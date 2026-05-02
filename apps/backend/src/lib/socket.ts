import type { PrismaClient } from "@prisma/client";
import { Server, type Socket } from "socket.io";
import { z } from "zod";
import type { Server as HttpServer } from "node:http";
import type { AppEnv } from "../config/env.js";
import { getSocketToken } from "../plugins/auth.js";
import { verifyAccessToken } from "./jwt.js";
import type { AppServices } from "../services/index.js";

const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  clientTempId: z.string().trim().min(1).max(128).optional().nullable(),
  type: z.enum(["TEXT", "IMAGE", "FILE", "VOICE", "SYSTEM"]).default("TEXT"),
  body: z.string().trim().min(1).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentMimeType: z.string().trim().min(1).max(255).optional().nullable(),
  attachmentSize: z.number().int().positive().optional().nullable(),
  replyToMessageId: z.string().optional().nullable()
});

const messageReadSchema = z.object({
  messageId: z.string().min(1)
});

const typingSchema = z.object({
  conversationId: z.string().min(1)
});

const startCallSchema = z.object({
  conversationId: z.string().min(1),
  type: z.enum(["AUDIO", "VIDEO"])
});

const callActionSchema = z.object({
  callId: z.string().min(1)
});

export class RealtimeGateway {
  private readonly io: Server;
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    server: HttpServer,
    private readonly prisma: PrismaClient,
    private readonly env: AppEnv,
    private readonly services: Pick<AppServices, "chatService" | "messageService" | "callService">
  ) {
    this.io = new Server(server, {
      cors: {
        origin: this.env.corsOrigins,
        credentials: true
      }
    });

    this.io.use((socket, next) => {
      try {
        const rawToken =
          typeof socket.handshake.auth.token === "string"
            ? socket.handshake.auth.token
            : socket.handshake.headers.authorization?.replace("Bearer ", "");

        const token = getSocketToken(rawToken);
        const auth = verifyAccessToken(this.env, token);
        socket.data.auth = auth;
        next();
      } catch (error) {
        next(error as Error);
      }
    });

    this.io.on("connection", (socket) => {
      void this.handleConnection(socket);
    });
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.io.to(this.getConversationRoom(conversationId)).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.io.to(this.getUserRoom(userId)).emit(event, payload);
  }

  joinConversationForUser(userId: string, conversationId: string) {
    const socketIds = this.onlineUsers.get(userId);
    if (!socketIds?.size) {
      return;
    }

    socketIds.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      socket?.join(this.getConversationRoom(conversationId));
    });
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }

  private getConversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private async handleConnection(socket: Socket) {
    const auth = socket.data.auth as { userId: string };
    const { userId } = auth;

    socket.join(this.getUserRoom(userId));

    const memberships = await this.prisma.conversationMember.findMany({
      where: {
        userId,
        leftAt: null
      },
      select: { conversationId: true }
    });

    memberships.forEach((membership) => {
      socket.join(this.getConversationRoom(membership.conversationId));
    });

    const currentSockets = this.onlineUsers.get(userId) ?? new Set<string>();
    const wasOffline = currentSockets.size === 0;
    currentSockets.add(socket.id);
    this.onlineUsers.set(userId, currentSockets);

    if (wasOffline) {
      memberships.forEach((membership) => {
        socket.to(this.getConversationRoom(membership.conversationId)).emit("user:online", { userId });
      });
    }

    socket.on("message:send", async (payload: unknown) => {
      const parsed = sendMessageSchema.parse(payload) as any;
      const message: any = await this.services.messageService.createMessage(userId, parsed);
      this.emitToConversation(parsed.conversationId, "message:new", message);
    });

    socket.on("message:read", async (payload: unknown) => {
      const parsed = messageReadSchema.parse(payload) as { messageId: string };
      const message: any = await this.services.messageService.markRead(userId, parsed.messageId);
      this.emitToConversation(message.conversationId, "message:read", {
        messageId: message.id,
        conversationId: message.conversationId,
        userId
      });
    });

    socket.on("typing:start", async (payload: unknown) => {
      const parsed = typingSchema.parse(payload) as { conversationId: string };
      await this.services.chatService.assertConversationMember(parsed.conversationId, userId);
      socket.to(this.getConversationRoom(parsed.conversationId)).emit("typing:start", {
        conversationId: parsed.conversationId,
        userId
      });
    });

    socket.on("typing:stop", async (payload: unknown) => {
      const parsed = typingSchema.parse(payload) as { conversationId: string };
      await this.services.chatService.assertConversationMember(parsed.conversationId, userId);
      socket.to(this.getConversationRoom(parsed.conversationId)).emit("typing:stop", {
        conversationId: parsed.conversationId,
        userId
      });
    });

    socket.on("call:start", async (payload: unknown) => {
      const parsed = startCallSchema.parse(payload) as { conversationId: string; type: "AUDIO" | "VIDEO" };
      const call = await this.services.callService.startCall(userId, parsed);
      socket.to(this.getConversationRoom(parsed.conversationId)).emit("call:incoming", call);
    });

    socket.on("call:accept", async (payload: unknown) => {
      const parsed = callActionSchema.parse(payload) as { callId: string };
      const call = await this.services.callService.acceptCall(userId, parsed.callId);
      this.emitToConversation(call.conversationId, "call:accepted", call);
    });

    socket.on("call:reject", async (payload: unknown) => {
      const parsed = callActionSchema.parse(payload) as { callId: string };
      const call = await this.services.callService.rejectCall(userId, parsed.callId);
      this.emitToConversation(call.conversationId, "call:rejected", call);
    });

    socket.on("call:end", async (payload: unknown) => {
      const parsed = callActionSchema.parse(payload) as { callId: string };
      const call = await this.services.callService.endCall(userId, parsed.callId);
      this.emitToConversation(call.conversationId, "call:ended", call);
    });

    socket.on("disconnect", () => {
      const sockets = this.onlineUsers.get(userId);
      if (!sockets) {
        return;
      }

      sockets.delete(socket.id);
      if (sockets.size > 0) {
        return;
      }

      this.onlineUsers.delete(userId);
      memberships.forEach((membership) => {
        socket.to(this.getConversationRoom(membership.conversationId)).emit("user:offline", { userId });
      });
    });
  }
}
