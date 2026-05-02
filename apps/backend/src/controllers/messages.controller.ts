import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import type { RealtimeGateway } from "../lib/socket.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const createMessageSchema = z.object({
  conversationId: z.string().min(1),
  type: z.enum(["TEXT", "IMAGE", "FILE", "VOICE", "SYSTEM"]).default("TEXT"),
  body: z.string().trim().min(1).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentMimeType: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentSize: z.number().int().positive().optional().nullable(),
  replyToMessageId: z.string().optional().nullable()
});

const messageIdParamsSchema = z.object({
  messageId: z.string().min(1)
});

const updateMessageSchema = z.object({
  body: z.string().trim().min(1).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentMimeType: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentSize: z.number().int().positive().optional().nullable()
});

export function buildMessagesController(services: AppServices, env: AppEnv, gateway: RealtimeGateway) {
  return {
    create: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const input = createMessageSchema.parse(request.body) as any;
      const data: any = await services.messageService.createMessage(auth.userId, input);
      gateway.emitToConversation(input.conversationId, "message:new", data);
      return reply.status(201).send({ data });
    },

    update: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = messageIdParamsSchema.parse(request.params) as { messageId: string };
      const input = updateMessageSchema.parse(request.body) as any;
      const data: any = await services.messageService.updateMessage(auth.userId, params.messageId, input);
      gateway.emitToConversation(data.conversationId, "message:updated", data);
      return reply.send({ data });
    },

    delete: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = messageIdParamsSchema.parse(request.params) as { messageId: string };
      const data: any = await services.messageService.deleteMessage(auth.userId, params.messageId);
      gateway.emitToConversation(data.conversationId, "message:deleted", data);
      return reply.send({ data });
    },

    read: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = messageIdParamsSchema.parse(request.params) as { messageId: string };
      const data: any = await services.messageService.markRead(auth.userId, params.messageId);
      gateway.emitToConversation(data.conversationId, "message:read", {
        messageId: data.id,
        conversationId: data.conversationId,
        userId: auth.userId
      });
      return reply.send({ data });
    }
  };
}
