import { UserStatus } from "@prisma/client";
import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import { getRequestMeta } from "../lib/request.js";
import type { RealtimeGateway } from "../lib/socket.js";
import { requireRoles } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";
import type { createAuditLogger } from "../lib/audit.js";

const userParamsSchema = z.object({
  userId: z.string().min(1)
});

const messageParamsSchema = z.object({
  messageId: z.string().min(1)
});

const loginEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  userId: z.string().trim().min(1).optional(),
  ip: z.string().trim().min(1).optional(),
  success: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    })
});

const ipBlockBodySchema = z.object({
  ipAddress: z.string().trim().min(1).optional().nullable(),
  cidr: z.string().trim().min(1).optional().nullable(),
  reason: z.string().trim().min(1).max(500),
  expiresAt: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((value) => (value ? new Date(value) : null))
});

const ipBlockParamsSchema = z.object({
  id: z.string().min(1)
});

const sessionsQuerySchema = z.object({
  userId: z.string().trim().min(1).optional()
});

const sessionParamsSchema = z.object({
  id: z.string().min(1)
});

export function buildAdminController(
  services: AppServices,
  env: AppEnv,
  auditLogger: ReturnType<typeof createAuditLogger>,
  gateway: RealtimeGateway
) {
  const allowedRoles = ["ADMIN", "SUPER_ADMIN"] as const;

  async function log(adminId: string, action: string, targetType: string, targetId: string | null, metadata: unknown, ipAddress?: string | null) {
    await auditLogger.log({
      adminId,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress
    });
  }

  function getAdminIp(request: any) {
    return getRequestMeta(request).ipAddress;
  }

  return {
    dashboard: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getDashboard();
      await log(auth.userId, "admin.dashboard.view", "dashboard", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    users: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getUsers();
      await log(auth.userId, "admin.users.view", "user", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    block: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = userParamsSchema.parse(request.params);
      const data = await services.adminService.setUserStatus(params.userId, UserStatus.BLOCKED);
      await log(auth.userId, "admin.user.block", "user", params.userId, getRequestMeta(request), getAdminIp(request));
      return reply.send({ data });
    },

    unblock: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = userParamsSchema.parse(request.params);
      const data = await services.adminService.setUserStatus(params.userId, UserStatus.ACTIVE);
      await log(auth.userId, "admin.user.unblock", "user", params.userId, getRequestMeta(request), getAdminIp(request));
      return reply.send({ data });
    },

    revokeUserSessions: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = userParamsSchema.parse(request.params);
      const data = await services.securityService.revokeUserSessions(params.userId);
      gateway.disconnectSessions(data.sessionIds);
      await log(auth.userId, "admin.user.sessions.revoke", "user", params.userId, data, getAdminIp(request));
      return reply.send({ data });
    },

    chats: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getChats();
      await log(auth.userId, "admin.chats.view", "conversation", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    messages: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getMessages();
      await log(auth.userId, "admin.messages.view", "message", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    deleteMessage: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = messageParamsSchema.parse(request.params) as { messageId: string };
      const data: any = await services.messageService.adminDeleteMessage(params.messageId);
      gateway.emitToConversation(data.conversationId, "message:deleted", data);
      await log(auth.userId, "admin.message.delete", "message", params.messageId, null, getAdminIp(request));
      return reply.send({ data });
    },

    calls: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getCalls();
      await log(auth.userId, "admin.calls.view", "call", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    loginEvents: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const query = loginEventsQuerySchema.parse(request.query);
      const data = await services.securityService.getLoginEvents(query);
      await log(auth.userId, "admin.security.login_events.view", "login_event", null, query, getAdminIp(request));
      return reply.send({ data });
    },

    ipBlocks: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.securityService.getIpBlocks();
      await log(auth.userId, "admin.security.ip_blocks.view", "ip_block", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    createIpBlock: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const input = ipBlockBodySchema.parse(request.body);
      const data = await services.securityService.createIpBlock({
        ...input,
        blockedByAdminId: auth.userId
      });
      await log(auth.userId, "admin.security.ip_block.create", "ip_block", data.id, data, getAdminIp(request));
      return reply.status(201).send({ data });
    },

    deleteIpBlock: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = ipBlockParamsSchema.parse(request.params);
      const data = await services.securityService.deactivateIpBlock(params.id);
      await log(auth.userId, "admin.security.ip_block.delete", "ip_block", params.id, data, getAdminIp(request));
      return reply.send({ data });
    },

    sessions: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const query = sessionsQuerySchema.parse(request.query);
      const data = await services.securityService.getActiveSessions({
        userId: query.userId,
        currentSessionId: auth.sessionId
      });
      await log(auth.userId, "admin.security.sessions.view", "session", null, query, getAdminIp(request));
      return reply.send({ data });
    },

    revokeSession: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = sessionParamsSchema.parse(request.params);
      const data = await services.securityService.revokeSession(params.id);
      gateway.disconnectSession(params.id);
      await log(auth.userId, "admin.security.session.revoke", "session", params.id, data, getAdminIp(request));
      return reply.send({ data });
    },

    auditLog: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getAuditLog();
      await log(auth.userId, "admin.audit.view", "admin_action", null, null, getAdminIp(request));
      return reply.send({ data });
    },

    serverStatus: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getServerStatus();
      await log(auth.userId, "admin.server.view", "server", null, null, getAdminIp(request));
      return reply.send({ data });
    }
  };
}
