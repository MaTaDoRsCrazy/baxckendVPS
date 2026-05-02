import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import type { RealtimeGateway } from "../lib/socket.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const createPrivateSchema = z.object({
  participantId: z.string().min(1)
});

const createGroupSchema = z.object({
  title: z.string().trim().min(1),
  memberIds: z.array(z.string().min(1)).min(1)
});

const chatParamsSchema = z.object({
  chatId: z.string().min(1)
});

const messageQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  cursor: z.string().trim().min(1).optional(),
  since: z.string().trim().min(1).optional()
});

export function buildChatsController(services: AppServices, env: AppEnv, gateway: RealtimeGateway) {
  return {
    list: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const data = await services.chatService.listForUser(auth.userId);
      return reply.send({ data });
    },

    createPrivate: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const input = createPrivateSchema.parse(request.body);
      const data = await services.chatService.createPrivate(auth.userId, input.participantId);
      [auth.userId, input.participantId].forEach((userId) => {
        gateway.joinConversationForUser(userId, data.id);
        gateway.emitToUser(userId, "chat:updated", {
          conversationId: data.id,
          updatedAt: new Date().toISOString(),
          lastMessage: null
        });
      });
      return reply.status(201).send({ data });
    },

    createGroup: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const input = createGroupSchema.parse(request.body);
      const data = await services.chatService.createGroup(auth.userId, input.title, input.memberIds);
      Array.from(new Set([auth.userId, ...input.memberIds])).forEach((userId) => {
        gateway.joinConversationForUser(userId, data.id);
        gateway.emitToUser(userId, "chat:updated", {
          conversationId: data.id,
          updatedAt: new Date().toISOString(),
          lastMessage: null
        });
      });
      return reply.status(201).send({ data });
    },

    getOne: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = chatParamsSchema.parse(request.params);
      const data = await services.chatService.getConversation(auth.userId, params.chatId);
      return reply.send({ data });
    },

    getMessages: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = chatParamsSchema.parse(request.params);
      const query = messageQuerySchema.parse(request.query);
      const data = await services.chatService.getMessages(auth.userId, params.chatId, query);
      return reply.send({ data });
    }
  };
}
