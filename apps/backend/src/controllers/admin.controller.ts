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

  return {
    dashboard: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getDashboard();
      await log(auth.userId, "admin.dashboard.view", "dashboard", null, null, request.ip);
      return reply.send({ data });
    },

    users: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getUsers();
      await log(auth.userId, "admin.users.view", "user", null, null, request.ip);
      return reply.send({ data });
    },

    block: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = userParamsSchema.parse(request.params);
      const data = await services.adminService.setUserStatus(params.userId, UserStatus.BLOCKED);
      await log(auth.userId, "admin.user.block", "user", params.userId, getRequestMeta(request), request.ip);
      return reply.send({ data });
    },

    unblock: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = userParamsSchema.parse(request.params);
      const data = await services.adminService.setUserStatus(params.userId, UserStatus.ACTIVE);
      await log(auth.userId, "admin.user.unblock", "user", params.userId, getRequestMeta(request), request.ip);
      return reply.send({ data });
    },

    chats: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getChats();
      await log(auth.userId, "admin.chats.view", "conversation", null, null, request.ip);
      return reply.send({ data });
    },

    messages: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getMessages();
      await log(auth.userId, "admin.messages.view", "message", null, null, request.ip);
      return reply.send({ data });
    },

    deleteMessage: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const params = messageParamsSchema.parse(request.params) as { messageId: string };
      const data: any = await services.messageService.adminDeleteMessage(params.messageId);
      gateway.emitToConversation(data.conversationId, "message:deleted", data);
      await log(auth.userId, "admin.message.delete", "message", params.messageId, null, request.ip);
      return reply.send({ data });
    },

    calls: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getCalls();
      await log(auth.userId, "admin.calls.view", "call", null, null, request.ip);
      return reply.send({ data });
    },

    auditLog: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getAuditLog();
      await log(auth.userId, "admin.audit.view", "admin_action", null, null, request.ip);
      return reply.send({ data });
    },

    serverStatus: async (request: any, reply: any) => {
      const auth = requireRoles(request, env, [...allowedRoles]);
      const data = await services.adminService.getServerStatus();
      await log(auth.userId, "admin.server.view", "server", null, null, request.ip);
      return reply.send({ data });
    }
  };
}
