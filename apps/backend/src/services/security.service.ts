import { LoginEventType, UserStatus, type PrismaClient } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import { AppError, badRequest, conflict, notFound, tooManyRequests, unauthorized } from "../lib/errors.js";
import { cidrOverlaps, isIpInCidr, normalizeCidr, normalizeIp, parseCidr } from "../lib/ip.js";
import {
  ipBlockSelect,
  loginEventSelect,
  serializeIpBlock,
  serializeLoginEvent,
  serializeUserSession,
  userSessionSelect
} from "../lib/serializers.js";
import { verifyAccessToken } from "../lib/jwt.js";
import type { RequestAuth } from "../types/auth.js";
import type { GeoIpLookupResult, GeoIpService } from "./geoip.service.js";

const RATE_LIMIT_FAILURE_REASON = "Too many login attempts from this IP. Please try later.";

type WhitelistEntry =
  | { type: "ip"; value: string }
  | { type: "cidr"; value: string };

export interface SecurityClientContext {
  ipAddress: string | null;
  userAgent: string | null;
  isWhitelisted: boolean;
  geo: GeoIpLookupResult | null;
}

interface LoginEventInput {
  eventType: LoginEventType;
  userId?: string | null;
  emailOrUsername?: string | null;
  client: SecurityClientContext;
  success: boolean;
  failureReason?: string | null;
}

interface LoginEventListQuery {
  page: number;
  limit: number;
  userId?: string;
  ip?: string;
  success?: boolean;
}

interface SessionListQuery {
  userId?: string;
  currentSessionId?: string;
}

interface CreateIpBlockInput {
  ipAddress?: string | null;
  cidr?: string | null;
  reason: string;
  expiresAt?: Date | null;
  blockedByAdminId?: string | null;
}

function sanitizeText(input?: string | null) {
  if (typeof input !== "string") {
    return null;
  }

  const normalized = input.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildWhitelistEntries(entries: string[]): WhitelistEntry[] {
  return entries.map((entry) => {
    const normalizedIp = normalizeIp(entry);
    if (normalizedIp) {
      return { type: "ip", value: normalizedIp } as const;
    }

    const normalizedCidr = normalizeCidr(entry);
    if (normalizedCidr) {
      return { type: "cidr", value: normalizedCidr } as const;
    }

    throw new Error(`Invalid ADMIN_IP_WHITELIST entry: ${entry}`);
  });
}

function assertUserIsActive(status: UserStatus) {
  if (status === UserStatus.BLOCKED) {
    throw unauthorized("User is blocked");
  }

  if (status === UserStatus.DELETED) {
    throw unauthorized("User is deleted");
  }
}

export function createSecurityService(prisma: PrismaClient, env: AppEnv, geoIpService: GeoIpService) {
  const whitelistEntries = buildWhitelistEntries(env.adminIpWhitelist);

  function isWhitelistedIp(ipAddress?: string | null) {
    const normalizedIp = normalizeIp(ipAddress);
    if (!normalizedIp) {
      return false;
    }

    return whitelistEntries.some((entry) =>
      entry.type === "ip" ? entry.value === normalizedIp : isIpInCidr(normalizedIp, entry.value)
    );
  }

  function overlapsWhitelist(ipAddress?: string | null, cidr?: string | null) {
    const normalizedIp = normalizeIp(ipAddress);
    const normalizedCidr = normalizeCidr(cidr);

    return whitelistEntries.some((entry) => {
      if (normalizedIp) {
        return entry.type === "ip"
          ? entry.value === normalizedIp
          : isIpInCidr(normalizedIp, entry.value);
      }

      if (!normalizedCidr) {
        return false;
      }

      return entry.type === "ip"
        ? isIpInCidr(entry.value, normalizedCidr)
        : cidrOverlaps(entry.value, normalizedCidr);
    });
  }

  async function findMatchingIpBlock(ipAddress?: string | null) {
    const normalizedIp = normalizeIp(ipAddress);
    if (!normalizedIp || isWhitelistedIp(normalizedIp)) {
      return null;
    }

    const now = new Date();
    const blocks = await prisma.ipBlock.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
          },
          {
            OR: [{ ipAddress: normalizedIp }, { cidr: { not: null } }]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return blocks.find((block) => {
      if (block.ipAddress && block.ipAddress === normalizedIp) {
        return true;
      }

      return Boolean(block.cidr && isIpInCidr(normalizedIp, block.cidr));
    }) ?? null;
  }

  return {
    async resolveClientContext(
      meta: { ipAddress?: string | null; userAgent?: string | null },
      options?: { includeGeo?: boolean }
    ): Promise<SecurityClientContext> {
      const ipAddress = normalizeIp(meta.ipAddress) ?? null;
      const userAgent = sanitizeText(meta.userAgent);
      const isWhitelisted = isWhitelistedIp(ipAddress);
      const includeGeo = options?.includeGeo ?? true;
      const geo = includeGeo && ipAddress ? await geoIpService.lookup(ipAddress) : null;

      return {
        ipAddress,
        userAgent,
        isWhitelisted,
        geo
      };
    },

    isWhitelistedIp,

    async assertIpAllowed(ipAddress?: string | null) {
      const block = await findMatchingIpBlock(ipAddress);
      if (!block) {
        return;
      }

      throw new AppError(403, "IP_BLOCKED", "Доступ с этого IP-адреса заблокирован");
    },

    async assertLoginRateLimit(ipAddress?: string | null) {
      const normalizedIp = normalizeIp(ipAddress);
      if (!normalizedIp || isWhitelistedIp(normalizedIp)) {
        return;
      }

      const windowStart = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000);
      const failedAttempts = await prisma.loginEvent.count({
        where: {
          eventType: LoginEventType.LOGIN,
          ipAddress: normalizedIp,
          success: false,
          createdAt: { gte: windowStart },
          failureReason: {
            not: RATE_LIMIT_FAILURE_REASON
          }
        }
      });

      if (failedAttempts >= env.LOGIN_MAX_ATTEMPTS_PER_IP) {
        throw tooManyRequests(RATE_LIMIT_FAILURE_REASON, "TOO_MANY_LOGIN_ATTEMPTS");
      }
    },

    async recordLoginEvent(input: LoginEventInput) {
      const ipAddress = input.client.ipAddress ?? "unknown";
      await prisma.loginEvent.create({
        data: {
          eventType: input.eventType,
          userId: input.userId ?? null,
          emailOrUsername: sanitizeText(input.emailOrUsername),
          ipAddress,
          userAgent: input.client.userAgent,
          country: input.client.geo?.country ?? null,
          city: input.client.geo?.city ?? null,
          region: input.client.geo?.region ?? null,
          asn: input.client.geo?.asn ?? null,
          provider: input.client.geo?.provider ?? null,
          success: input.success,
          failureReason: sanitizeText(input.failureReason)
        }
      });
    },

    async authenticateAccessToken(token: string) {
      const payload = verifyAccessToken(env, token);
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              status: true
            }
          }
        }
      });

      if (!session || session.userId !== payload.userId || session.expiresAt <= new Date() || session.revokedAt) {
        throw unauthorized("Session expired");
      }

      assertUserIsActive(session.user.status);

      const auth: RequestAuth = {
        userId: session.userId,
        role: session.user.role,
        sessionId: session.id
      };

      return {
        auth,
        session
      };
    },

    async touchSessionActivity(
      session: {
        id: string;
        ipAddress: string | null;
        userAgent: string | null;
        country: string | null;
        city: string | null;
        lastSeenAt: Date;
      },
      meta: { ipAddress?: string | null; userAgent?: string | null }
    ) {
      const now = new Date();
      const nextIpAddress = normalizeIp(meta.ipAddress) ?? session.ipAddress;
      const nextUserAgent = sanitizeText(meta.userAgent) ?? session.userAgent;
      const shouldRefreshTimestamp = now.getTime() - session.lastSeenAt.getTime() >= 60_000;
      const ipChanged = nextIpAddress !== session.ipAddress;
      const userAgentChanged = nextUserAgent !== session.userAgent;

      if (!shouldRefreshTimestamp && !ipChanged && !userAgentChanged) {
        return;
      }

      const nextGeo = ipChanged && nextIpAddress ? await geoIpService.lookup(nextIpAddress) : null;

      await prisma.session.update({
        where: { id: session.id },
        data: {
          lastSeenAt: now,
          ipAddress: nextIpAddress,
          userAgent: nextUserAgent,
          country: nextGeo?.country ?? session.country,
          city: nextGeo?.city ?? session.city
        }
      });
    },

    async getLoginEvents(query: LoginEventListQuery) {
      const page = Math.max(1, query.page);
      const limit = Math.min(100, Math.max(1, query.limit));
      const where = {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.ip ? { ipAddress: { contains: query.ip.trim() } } : {}),
        ...(typeof query.success === "boolean" ? { success: query.success } : {})
      };

      const [total, items] = await prisma.$transaction([
        prisma.loginEvent.count({ where }),
        prisma.loginEvent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: loginEventSelect
        })
      ]);

      return {
        items: items.map(serializeLoginEvent),
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit))
      };
    },

    async getIpBlocks() {
      const blocks = await prisma.ipBlock.findMany({
        orderBy: { createdAt: "desc" },
        select: ipBlockSelect
      });

      return blocks.map(serializeIpBlock);
    },

    async createIpBlock(input: CreateIpBlockInput) {
      const reason = sanitizeText(input.reason);
      if (!reason) {
        throw badRequest("Block reason is required");
      }

      const normalizedIp = normalizeIp(input.ipAddress);
      const normalizedCidr = normalizeCidr(input.cidr);

      if (!normalizedIp && !normalizedCidr) {
        throw badRequest("Either ipAddress or cidr is required");
      }

      if (normalizedIp && normalizedCidr) {
        throw badRequest("Provide either ipAddress or cidr, not both");
      }

      if (input.ipAddress && !normalizedIp) {
        throw badRequest("Invalid IP address");
      }

      if (input.cidr && !normalizedCidr) {
        throw badRequest("Invalid CIDR range");
      }

      if (input.expiresAt && input.expiresAt <= new Date()) {
        throw badRequest("Block expiration must be in the future");
      }

      if (input.expiresAt && Number.isNaN(input.expiresAt.getTime())) {
        throw badRequest("Invalid block expiration date");
      }

      if (overlapsWhitelist(normalizedIp, normalizedCidr)) {
        throw badRequest(normalizedIp ? "Whitelisted IP address cannot be blocked" : "Whitelisted IP range cannot be blocked");
      }

      const activeDuplicate = await prisma.ipBlock.findFirst({
        where: {
          isActive: true,
          AND: [
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            normalizedIp ? { ipAddress: normalizedIp } : { cidr: normalizedCidr }
          ]
        }
      });

      if (activeDuplicate) {
        throw conflict("IP block already exists");
      }

      const block = await prisma.ipBlock.create({
        data: {
          ipAddress: normalizedIp ?? null,
          cidr: normalizedCidr ?? null,
          reason,
          expiresAt: input.expiresAt ?? null,
          blockedByAdminId: input.blockedByAdminId ?? null
        },
        select: ipBlockSelect
      });

      return serializeIpBlock(block);
    },

    async deactivateIpBlock(id: string) {
      const existing = await prisma.ipBlock.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!existing) {
        throw notFound("IP block not found");
      }

      const block = await prisma.ipBlock.update({
        where: { id },
        data: {
          isActive: false
        },
        select: ipBlockSelect
      });

      return serializeIpBlock(block);
    },

    async getActiveSessions(query: SessionListQuery = {}) {
      const now = new Date();
      const sessions = await prisma.session.findMany({
        where: {
          revokedAt: null,
          expiresAt: { gt: now },
          ...(query.userId ? { userId: query.userId } : {})
        },
        orderBy: { lastSeenAt: "desc" },
        take: 200,
        select: userSessionSelect
      });

      return sessions.map((session) => ({
        ...serializeUserSession(session),
        isCurrent: session.id === query.currentSessionId
      }));
    },

    async revokeSession(id: string) {
      const existing = await prisma.session.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!existing) {
        throw notFound("Session not found");
      }

      const session = await prisma.session.update({
        where: { id },
        data: {
          revokedAt: new Date()
        },
        select: userSessionSelect
      });

      return serializeUserSession(session);
    },

    async revokeUserSessions(userId: string) {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        select: { id: true }
      });

      if (sessions.length === 0) {
        return {
          sessionIds: [],
          count: 0
        };
      }

      await prisma.session.updateMany({
        where: {
          id: {
            in: sessions.map((session) => session.id)
          }
        },
        data: {
          revokedAt: new Date()
        }
      });

      return {
        sessionIds: sessions.map((session) => session.id),
        count: sessions.length
      };
    },

    async validateIpOrCidr(input: { ipAddress?: string | null; cidr?: string | null }) {
      const normalizedIp = normalizeIp(input.ipAddress);
      const normalizedCidr = normalizeCidr(input.cidr);

      if (!normalizedIp && !normalizedCidr) {
        throw badRequest("Either ipAddress or cidr is required");
      }

      if (normalizedIp && normalizedCidr) {
        throw badRequest("Provide either ipAddress or cidr, not both");
      }

      if (input.ipAddress && !normalizedIp) {
        throw badRequest("Invalid IP address");
      }

      if (input.cidr && !normalizedCidr) {
        throw badRequest("Invalid CIDR range");
      }

      if (normalizedCidr && !parseCidr(normalizedCidr)) {
        throw badRequest("Invalid CIDR range");
      }

      return {
        ipAddress: normalizedIp ?? null,
        cidr: normalizedCidr ?? null
      };
    },

    getRateLimitFailureReason() {
      return RATE_LIMIT_FAILURE_REASON;
    }
  };
}
