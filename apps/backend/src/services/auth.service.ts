import type { PrismaClient, User } from "@prisma/client";
import { UserStatus } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { hashValue, verifyValue } from "../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  toDateFromDuration,
  verifyRefreshToken
} from "../lib/jwt.js";
import { publicUserSelect } from "../lib/serializers.js";

interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface RegisterInput {
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
}

interface LoginInput {
  identifier: string;
  password: string;
}

function assertActiveUser(user: Pick<User, "status">) {
  if (user.status === UserStatus.BLOCKED) {
    throw unauthorized("User is blocked");
  }

  if (user.status === UserStatus.DELETED) {
    throw unauthorized("User is deleted");
  }
}

export function createAuthService(prisma: PrismaClient, env: AppEnv) {
  async function issueSession(user: Pick<User, "id" | "role">, meta: SessionMeta) {
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: "pending",
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
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

  return {
    async register(input: RegisterInput, meta: SessionMeta) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: input.username },
            ...(input.email ? [{ email: input.email }] : [])
          ]
        }
      });

      if (existing) {
        throw conflict("User with provided username or email already exists");
      }

      const user = await prisma.user.create({
        data: {
          username: input.username,
          email: input.email ?? null,
          phone: input.phone ?? null,
          passwordHash: await hashValue(input.password)
        },
        select: {
          ...publicUserSelect,
          passwordHash: true
        }
      });

      const tokens = await issueSession(user, meta);

      return {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          lastSeenAt: user.lastSeenAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        ...tokens
      };
    },

    async login(input: LoginInput, meta: SessionMeta) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.identifier }, { username: input.identifier }]
        },
        select: {
          ...publicUserSelect,
          passwordHash: true
        }
      });

      if (!user || !(await verifyValue(user.passwordHash, input.password))) {
        throw unauthorized("Invalid credentials");
      }

      assertActiveUser(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() }
      });

      const tokens = await issueSession(user, meta);

      return {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          lastSeenAt: new Date(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        ...tokens
      };
    },

    async refresh(refreshToken: string, meta: SessionMeta) {
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

      if (session.userId !== payload.userId || session.expiresAt < new Date()) {
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
          userAgent: meta.userAgent ?? session.userAgent,
          ipAddress: meta.ipAddress ?? session.ipAddress
        }
      });

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.userId },
        select: publicUserSelect
      });

      return {
        user,
        accessToken,
        refreshToken: nextRefreshToken
      };
    },

    async logout(refreshToken: string) {
      const payload = verifyRefreshToken(env, refreshToken);
      await prisma.session.deleteMany({
        where: {
          id: payload.sessionId,
          userId: payload.userId
        }
      });

      return { success: true };
    },

    async getMe(userId: string) {
      return prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect
      });
    }
  };
}
