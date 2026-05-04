import type { PrismaClient } from "@prisma/client";
import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { z, type ZodSchema } from "zod";
import type { AppEnv } from "../config/env.js";
import { normalizeIp } from "./ip.js";
import { getSocketToken } from "../plugins/auth.js";
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

type Normalizer = (payload: unknown) => unknown;

function getSocketClientIp(socket: Socket) {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;

  if (typeof forwardedValue === "string") {
    const candidates = forwardedValue
      .split(",")
      .map((value) => normalizeIp(value))
      .filter((value): value is string => Boolean(value));

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  return normalizeIp(socket.handshake.address);
}

function getSocketUserAgent(socket: Socket) {
  const rawUserAgent = socket.handshake.headers["user-agent"];
  const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;
  return typeof userAgent === "string" && userAgent.trim().length > 0 ? userAgent.trim() : null;
}

function payloadType(payload: unknown) {
  if (payload === null) return "null";
  if (Array.isArray(payload)) return "array";
  return typeof payload;
}

function normalizeConversationPayload(payload: unknown) {
  if (typeof payload === "string") {
    return { conversationId: payload };
  }
  return payload;
}

function normalizeMessageReadPayload(payload: unknown) {
  if (typeof payload === "string") {
    return { messageId: payload };
  }
  return payload;
}

function normalizeCallActionPayload(payload: unknown) {
  if (typeof payload === "string") {
    return { callId: payload };
  }
  return payload;
}

export class RealtimeGateway {
  private readonly io: Server;
  private readonly onlineUsers = new Map<string, Set<string>>();
  private readonly sessionSockets = new Map<string, Set<string>>();

  constructor(
    server: HttpServer,
    private readonly prisma: PrismaClient,
    private readonly env: AppEnv,
    private readonly services: Pick<AppServices, "chatService" | "messageService" | "callService" | "securityService">
  ) {
    this.io = new Server(server, {
      cors: {
        origin: this.env.corsOrigins,
        credentials: true
      }
    });

    this.io.use((socket, next) => {
      void (async () => {
        try {
          const meta = {
            ipAddress: getSocketClientIp(socket),
            userAgent: getSocketUserAgent(socket)
          };
          await this.services.securityService.assertIpAllowed(meta.ipAddress);

          const rawToken =
            typeof socket.handshake.auth.token === "string"
              ? socket.handshake.auth.token
              : socket.handshake.headers.authorization?.replace("Bearer ", "");

          const token = getSocketToken(rawToken);
          const { auth, session } = await this.services.securityService.authenticateAccessToken(token);
          await this.services.securityService.touchSessionActivity(session, meta);
          socket.data.auth = auth;
          next();
        } catch (error) {
          next(error as Error);
        }
      })();
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

  disconnectSession(sessionId: string) {
    const socketIds = this.sessionSockets.get(sessionId);
    if (!socketIds?.size) {
      return;
    }

    Array.from(socketIds).forEach((socketId) => {
      this.io.sockets.sockets.get(socketId)?.disconnect(true);
    });
    this.sessionSockets.delete(sessionId);
  }

  disconnectSessions(sessionIds: string[]) {
    sessionIds.forEach((sessionId) => {
      this.disconnectSession(sessionId);
    });
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

  private emitSocketError(socket: Socket, code: string, message: string) {
    socket.emit("error", { code, message });
  }

  private logInvalidPayload(event: string, userId: string, payload: unknown) {
    console.warn("socket:event:invalid_payload", {
      event,
      userId,
      payloadType: payloadType(payload)
    });
  }

  private logEventError(event: string, userId: string, error: unknown) {
    console.error("socket:event:error", {
      event,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  private async runSafeSocketHandler<T>(
    socket: Socket,
    event: string,
    payload: unknown,
    schema: ZodSchema<T>,
    handler: (input: T) => Promise<void>,
    normalize: Normalizer = (value) => value
  ) {
    const auth = socket.data.auth as { userId: string };
    const normalizedPayload = normalize(payload);
    const parsed = schema.safeParse(normalizedPayload);

    if (!parsed.success) {
      this.logInvalidPayload(event, auth.userId, payload);
      this.emitSocketError(socket, "INVALID_SOCKET_PAYLOAD", "Некорректные данные события");
      return;
    }

    try {
      await handler(parsed.data);
    } catch (error) {
      this.logEventError(event, auth.userId, error);
      this.emitSocketError(socket, "REALTIME_EVENT_ERROR", "Ошибка realtime-события");
    }
  }

  private async handleConnection(socket: Socket) {
    try {
      const auth = socket.data.auth as { userId: string; sessionId: string };
      const { userId, sessionId } = auth;

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

      const sessionSocketIds = this.sessionSockets.get(sessionId) ?? new Set<string>();
      sessionSocketIds.add(socket.id);
      this.sessionSockets.set(sessionId, sessionSocketIds);

      if (wasOffline) {
        memberships.forEach((membership) => {
          socket.to(this.getConversationRoom(membership.conversationId)).emit("user:online", { userId });
        });
      }

      socket.on("message:send", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "message:send",
          payload,
          sendMessageSchema,
          async (parsed) => {
            const message: any = await this.services.messageService.createMessage(userId, parsed as any);
            this.emitToConversation(parsed.conversationId, "message:new", message);
          }
        );
      });

      socket.on("message:read", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "message:read",
          payload,
          messageReadSchema,
          async (parsed) => {
            const message: any = await this.services.messageService.markRead(userId, parsed.messageId);
            this.emitToConversation(message.conversationId, "message:read", {
              messageId: message.id,
              conversationId: message.conversationId,
              userId
            });
          },
          normalizeMessageReadPayload
        );
      });

      socket.on("typing:start", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "typing:start",
          payload,
          typingSchema,
          async (parsed) => {
            await this.services.chatService.assertConversationMember(parsed.conversationId, userId);
            socket.to(this.getConversationRoom(parsed.conversationId)).emit("typing:start", {
              conversationId: parsed.conversationId,
              userId
            });
          },
          normalizeConversationPayload
        );
      });

      socket.on("typing:stop", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "typing:stop",
          payload,
          typingSchema,
          async (parsed) => {
            await this.services.chatService.assertConversationMember(parsed.conversationId, userId);
            socket.to(this.getConversationRoom(parsed.conversationId)).emit("typing:stop", {
              conversationId: parsed.conversationId,
              userId
            });
          },
          normalizeConversationPayload
        );
      });

      socket.on("call:start", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "call:start",
          payload,
          startCallSchema,
          async (parsed) => {
            const call = await this.services.callService.startCall(userId, parsed);
            socket.to(this.getConversationRoom(parsed.conversationId)).emit("call:incoming", call);
          },
          normalizeConversationPayload
        );
      });

      socket.on("call:accept", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "call:accept",
          payload,
          callActionSchema,
          async (parsed) => {
            const call = await this.services.callService.acceptCall(userId, parsed.callId);
            this.emitToConversation(call.conversationId, "call:accepted", call);
          },
          normalizeCallActionPayload
        );
      });

      socket.on("call:reject", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "call:reject",
          payload,
          callActionSchema,
          async (parsed) => {
            const call = await this.services.callService.rejectCall(userId, parsed.callId);
            this.emitToConversation(call.conversationId, "call:rejected", call);
          },
          normalizeCallActionPayload
        );
      });

      socket.on("call:end", (payload: unknown) => {
        void this.runSafeSocketHandler(
          socket,
          "call:end",
          payload,
          callActionSchema,
          async (parsed) => {
            const call = await this.services.callService.endCall(userId, parsed.callId);
            this.emitToConversation(call.conversationId, "call:ended", call);
          },
          normalizeCallActionPayload
        );
      });

      socket.on("disconnect", () => {
        const sockets = this.onlineUsers.get(userId);
        if (!sockets) {
          return;
        }

        sockets.delete(socket.id);
        if (sockets.size > 0) {
          const currentSessionSockets = this.sessionSockets.get(sessionId);
          currentSessionSockets?.delete(socket.id);
          if (currentSessionSockets && currentSessionSockets.size === 0) {
            this.sessionSockets.delete(sessionId);
          }
          return;
        }

        this.onlineUsers.delete(userId);
        const currentSessionSockets = this.sessionSockets.get(sessionId);
        currentSessionSockets?.delete(socket.id);
        if (currentSessionSockets && currentSessionSockets.size === 0) {
          this.sessionSockets.delete(sessionId);
        }
        memberships.forEach((membership) => {
          socket.to(this.getConversationRoom(membership.conversationId)).emit("user:offline", { userId });
        });
      });
    } catch (error) {
      const auth = socket.data.auth as { userId?: string } | undefined;
      this.logEventError("socket:connection", auth?.userId ?? "unknown", error);
      this.emitSocketError(socket, "REALTIME_CONNECTION_ERROR", "Ошибка realtime-подключения");
      socket.disconnect();
    }
  }
}
