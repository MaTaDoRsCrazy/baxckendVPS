import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import type { RealtimeGateway } from "../lib/socket.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const startCallSchema = z.object({
  conversationId: z.string().min(1),
  type: z.enum(["AUDIO", "VIDEO"])
});

const callParamsSchema = z.object({
  callId: z.string().min(1)
});

export function buildCallsController(services: AppServices, env: AppEnv, gateway: RealtimeGateway) {
  function emitCallEvent(conversationId: string, event: string, payload: unknown) {
    queueMicrotask(() => {
      try {
        gateway.emitToConversation(conversationId, event, payload);
      } catch (error) {
        console.error("call:socket_emit_error", {
          conversationId,
          event,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  return {
    start: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const input = startCallSchema.parse(request.body);
      const data = await services.callService.startCall(auth.userId, input);
      emitCallEvent(input.conversationId, "call:incoming", data);
      return reply.status(201).send({ data });
    },

    accept: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = callParamsSchema.parse(request.params);
      const data = await services.callService.acceptCall(auth.userId, params.callId);
      emitCallEvent(data.conversationId, "call:accepted", data);
      return reply.send({ data });
    },

    reject: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = callParamsSchema.parse(request.params);
      const data = await services.callService.rejectCall(auth.userId, params.callId);
      emitCallEvent(data.conversationId, "call:rejected", data);
      return reply.send({ data });
    },

    end: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = callParamsSchema.parse(request.params);
      const data = await services.callService.endCall(auth.userId, params.callId);
      emitCallEvent(data.conversationId, "call:ended", data);
      return reply.send({ data });
    },

    token: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const params = callParamsSchema.parse(request.params);
      const data = await services.callService.createJoinToken(auth.userId, params.callId);
      return reply.send(data);
    },

    history: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const data = await services.callService.getHistory(auth.userId);
      return reply.send({ data });
    }
  };
}
