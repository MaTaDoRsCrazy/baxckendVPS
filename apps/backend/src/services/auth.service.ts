import { LoginEventType, UserStatus, type PrismaClient } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { hashValue, verifyValue } from "../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  toDateFromDuration,
  verifyRefreshToken
} from "../lib/jwt.js";
import { publicUserSelect, serializeUser } from "../lib/serializers.js";
import type { createSecurityService, SecurityClientContext } from "./security.service.js";

interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface RegisterInput {
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
}

interface LoginInput {
  identifier: string;
  password: string;
}

function assertActiveUser(user: { status: UserStatus }) {
  if (user.status === UserStatus.BLOCKED) {
    throw unauthorized("User is blocked");
  }

  if (user.status === UserStatus.DELETED) {
    throw unauthorized("User is deleted");
  }
}

export function createAuthService(
  prisma: PrismaClient,
  env: AppEnv,
  securityService: ReturnType<typeof createSecurityService>
) {
  async function issueSession(user: any, client: SecurityClientContext) {
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: "pending",
        userAgent: client.userAgent ?? null,
        ipAddress: client.ipAddress ?? null,
        country: client.geo?.country ?? null,
        city: client.geo?.city ?? null,
        lastSeenAt: new Date(),
        expiresAt: toDateFromDuration(env.REFRESH_TOKEN_TTL)
      }
    });

    const accessToken = signAccessToken(env, {
      userId: user.id,
      role: user.role,
      sessionId: session.id
    });
    const refreshToken = signRefreshToken(env, {
      userId: user.id,
      sessionId: session.id
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await hashValue(refreshToken),
        expiresAt: toDateFromDuration(env.REFRESH_TOKEN_TTL)
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }

  async function logEvent(input: {
    eventType: LoginEventType;
    userId?: string | null;
    emailOrUsername?: string | null;
    client: SecurityClientContext;
    success: boolean;
    failureReason?: string | null;
  }) {
    await securityService.recordLoginEvent({
      eventType: input.eventType,
      userId: input.userId ?? null,
      emailOrUsername: input.emailOrUsername ?? null,
      client: input.client,
      success: input.success,
      failureReason: input.failureReason ?? null
    });
  }

  return {
    async register(input: RegisterInput, meta: SessionMeta) {
      const client = await securityService.resolveClientContext(meta);
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: input.username },
            ...(input.email ? [{ email: input.email }] : [])
          ]
        }
      });

      if (existing) {
        await logEvent({
          eventType: LoginEventType.REGISTER,
          emailOrUsername: input.email ?? input.username,
          client,
          success: false,
          failureReason: "User with provided username or email already exists"
        });
        throw conflict("User with provided username or email already exists");
      }

      const user: any = await prisma.user.create({
        data: {
          username: input.username,
          email: input.email ?? null,
          phone: input.phone ?? null,
          country: input.country ?? null,
          passwordHash: await hashValue(input.password)
        } as any,
        select: {
          ...publicUserSelect,
          passwordHash: true
        } as any
      });

      const tokens = await issueSession(user, client);

      await logEvent({
        eventType: LoginEventType.REGISTER,
        userId: user.id,
        emailOrUsername: input.email ?? input.username,
        client,
        success: true
      });

      return {
        user: serializeUser(user),
        ...tokens
      };
    },

    async login(input: LoginInput, meta: SessionMeta) {
      const client = await securityService.resolveClientContext(meta);

      try {
        await securityService.assertLoginRateLimit(client.ipAddress);
      } catch (error) {
        await logEvent({
          eventType: LoginEventType.LOGIN,
          emailOrUsername: input.identifier,
          client,
          success: false,
          failureReason: error instanceof Error ? error.message : "Too many login attempts"
        });
        throw error;
      }

      const user: any = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.identifier }, { username: input.identifier }]
        },
        select: {
          ...publicUserSelect,
          passwordHash: true
        } as any
      });

      if (!user || !(await verifyValue(user.passwordHash, input.password))) {
        await logEvent({
          eventType: LoginEventType.LOGIN,
          emailOrUsername: input.identifier,
          client,
          success: false,
          failureReason: "Invalid credentials"
        });
        throw unauthorized("Invalid credentials");
      }

      try {
        assertActiveUser(user);
      } catch (error) {
        await logEvent({
          eventType: LoginEventType.LOGIN,
          userId: user.id,
          emailOrUsername: input.identifier,
          client,
          success: false,
          failureReason: error instanceof Error ? error.message : "User is blocked"
        });
        throw error;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() }
      });

      const tokens = await issueSession(user, client);

      await logEvent({
        eventType: LoginEventType.LOGIN,
        userId: user.id,
        emailOrUsername: input.identifier,
        client,
        success: true
      });

      return {
        user: serializeUser({
          ...user,
          lastSeenAt: new Date()
        }),
        ...tokens
      };
    },

    async refresh(refreshToken: string, meta: SessionMeta) {
      const client = await securityService.resolveClientContext(meta);
      let knownUserId: string | null = null;

      try {
        const payload = verifyRefreshToken(env, refreshToken);

        const session = await prisma.session.findUnique({
          where: { id: payload.sessionId },
          include: {
            user: true
          }
        });

        if (!session) {
          throw unauthorized("Session not found");
        }

        knownUserId = session.userId;

        if (
          session.userId !== payload.userId ||
          session.expiresAt < new Date() ||
          session.revokedAt
        ) {
          throw unauthorized("Refresh token expired");
        }

        if (!(await verifyValue(session.refreshTokenHash, refreshToken))) {
          throw unauthorized("Refresh token mismatch");
        }

        assertActiveUser(session.user);

        const nextRefreshToken = signRefreshToken(env, {
          userId: session.userId,
          sessionId: session.id
        });
        const accessToken = signAccessToken(env, {
          userId: session.userId,
          role: session.user.role,
          sessionId: session.id
        });

        await prisma.session.update({
          where: { id: session.id },
          data: {
            refreshTokenHash: await hashValue(nextRefreshToken),
            expiresAt: toDateFromDuration(env.REFRESH_TOKEN_TTL),
            lastSeenAt: new Date(),
            userAgent: client.userAgent ?? session.userAgent,
            ipAddress: client.ipAddress ?? session.ipAddress,
            country: client.geo?.country ?? session.country,
            city: client.geo?.city ?? session.city
          }
        });

        const user: any = await prisma.user.findUniqueOrThrow({
          where: { id: session.userId },
          select: publicUserSelect as any
        });

        await logEvent({
          eventType: LoginEventType.REFRESH,
          userId: session.userId,
          emailOrUsername: user.email ?? user.username,
          client,
          success: true
        });

        return {
          user: serializeUser(user),
          accessToken,
          refreshToken: nextRefreshToken
        };
      } catch (error) {
        await logEvent({
          eventType: LoginEventType.REFRESH,
          userId: knownUserId,
          client,
          success: false,
          failureReason: error instanceof Error ? error.message : "Refresh failed"
        });
        throw error;
      }
    },

    async logout(refreshToken: string) {
      const payload = verifyRefreshToken(env, refreshToken);
      await prisma.session.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.userId
        },
        data: {
          revokedAt: new Date()
        }
      });

      return { success: true };
    },

    async getMe(userId: string) {
      const user: any = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect as any
      });

      return serializeUser(user);
    }
  };
}
