import type {
  Call,
  Conversation,
  Message,
  SocketClientEvents,
  SocketServerEvents
} from "@emessenger/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { acceptCall, rejectCall } from "../api/messenger";
import { useAuth } from "./auth-provider";

type ChatListEnvelope = { data: Conversation[] };
type ChatEnvelope = { data: Conversation };
type MessagesEnvelope = { data: Message[] };

interface RealtimeContextValue {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingByConversation: Record<string, string[]>;
  incomingCall: Call | null;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingByConversation, setTypingByConversation] = useState<Record<string, string[]>>({});
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setOnlineUsers(new Set());
      setTypingByConversation({});
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? "/", {
      path: "/socket.io",
      transports: ["websocket"],
      auth: {
        token: auth.accessToken
      }
    }) as Socket;

    socketRef.current = socket;

    socket.on("message:new", (message) => {
      queryClient.setQueryData<MessagesEnvelope>(["messages", message.conversationId], (current) => ({
        data: [...(current?.data ?? []).filter((entry) => entry.id !== message.id), message]
      }));

      queryClient.setQueryData<ChatEnvelope>(["chat", message.conversationId], (current) =>
        current
          ? { data: { ...current.data, messages: [...(current.data.messages ?? []).filter((entry) => entry.id !== message.id), message] } }
          : current
      );

      queryClient.setQueryData<ChatListEnvelope>(["chats"], (current) => {
        if (!current) return current;
        const existing = current.data.find((chat) => chat.id === message.conversationId);
        if (!existing) return current;
        const nextChat = { ...existing, messages: [message], updatedAt: message.createdAt };
        return {
          data: [nextChat, ...current.data.filter((chat) => chat.id !== message.conversationId)]
        };
      });
    });

    socket.on("message:updated", (message) => {
      queryClient.setQueryData<MessagesEnvelope>(["messages", message.conversationId], (current) => ({
        data: (current?.data ?? []).map((entry) => (entry.id === message.id ? message : entry))
      }));
    });

    socket.on("message:deleted", (message) => {
      queryClient.setQueryData<MessagesEnvelope>(["messages", message.conversationId], (current) => ({
        data: (current?.data ?? []).map((entry) => (entry.id === message.id ? message : entry))
      }));
    });

    socket.on("message:read", ({ conversationId, messageId, userId }) => {
      queryClient.setQueryData<MessagesEnvelope>(["messages", conversationId], (current) => ({
        data: (current?.data ?? []).map((entry) =>
          entry.id === messageId
            ? {
                ...entry,
                statuses: [
                  ...(entry.statuses ?? []).filter((status) => status.userId !== userId),
                  { userId, status: "READ", createdAt: new Date().toISOString() }
                ]
              }
            : entry
        )
      }));
    });

    socket.on("typing:start", ({ conversationId, userId }) => {
      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: Array.from(new Set([...(current[conversationId] ?? []), userId]))
      }));
    });

    socket.on("typing:stop", ({ conversationId, userId }) => {
      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).filter((entry) => entry !== userId)
      }));
    });

    socket.on("user:online", ({ userId }) => {
      setOnlineUsers((current) => new Set(current).add(userId));
    });

    socket.on("user:offline", ({ userId }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    });

    socket.on("call:incoming", (call) => {
      setIncomingCall(call);
    });

    socket.on("call:accepted", (call) => {
      setIncomingCall(null);
      queryClient.setQueryData(["call", call.id], call);
    });

    socket.on("call:rejected", () => {
      setIncomingCall(null);
    });

    socket.on("call:ended", () => {
      setIncomingCall(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth?.accessToken, queryClient]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      socket: socketRef.current,
      onlineUsers,
      typingByConversation,
      incomingCall,
      acceptIncomingCall: async () => {
        if (!incomingCall) return;
        const response = await acceptCall(incomingCall.id);
        setIncomingCall(null);
        navigate(`/call/${response.data.id}`);
      },
      rejectIncomingCall: async () => {
        if (!incomingCall) return;
        await rejectCall(incomingCall.id);
        setIncomingCall(null);
      }
    }),
    [incomingCall, navigate, onlineUsers, typingByConversation]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useRealtime должен использоваться внутри RealtimeProvider");
  }
  return value;
}
