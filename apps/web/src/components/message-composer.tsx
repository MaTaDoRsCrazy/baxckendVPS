import type { Conversation, Message } from "@emessenger/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createMessage, type MessageListPage, uploadFile } from "../api/messenger";
import { useAuth } from "../providers/auth-provider";
import { useRealtime } from "../providers/realtime-provider";

interface PendingAttachment {
  file: File;
  previewUrl?: string;
}

type MessagesEnvelope = { data: MessageListPage };
type ChatListEnvelope = { data: Conversation[] };
type RealtimeMessage = Message & {
  clientTempId?: string | null;
  deliveryState?: "PENDING" | "SENT" | "FAILED" | null;
  senderLabel?: string | null;
};

function createClientTempId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function mergeMessages(current: RealtimeMessage[], incoming: RealtimeMessage) {
  const next = [...current];
  const index = next.findIndex((entry) =>
    entry.id === incoming.id ||
    (incoming.clientTempId && entry.clientTempId === incoming.clientTempId) ||
    (entry.clientTempId && entry.clientTempId === incoming.clientTempId)
  );

  if (index >= 0) {
    next[index] = {
      ...next[index],
      ...incoming
    };
  } else {
    next.push(incoming);
  }

  return next.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function upsertChatPreview(chats: Conversation[], message: Message) {
  const currentChat = chats.find((chat) => chat.id === message.conversationId);
  if (!currentChat) {
    return chats;
  }

  const nextChat = {
    ...currentChat,
    messages: [message],
    updatedAt: message.createdAt
  };

  return [nextChat, ...chats.filter((chat) => chat.id !== message.conversationId)];
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const { auth } = useAuth();
  const { socket } = useRealtime();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimeout = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        window.clearTimeout(typingTimeout.current);
      }
      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl);
      }
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      socket?.emit("typing:stop", { conversationId });
    };
  }, [conversationId, pendingAttachment?.previewUrl, socket]);

  function buildOptimisticMessage(input: {
    clientTempId: string;
    type: string;
    body: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMimeType?: string | null;
    attachmentSize?: number | null;
  }): RealtimeMessage {
    const now = new Date().toISOString();
    const user = auth?.user;

    return {
      id: `temp:${input.clientTempId}`,
      clientTempId: input.clientTempId,
      conversationId,
      senderId: user?.id ?? "me",
      type: input.type as Message["type"],
      body: input.body,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentName: input.attachmentName ?? null,
      attachmentMimeType: input.attachmentMimeType ?? null,
      attachmentSize: input.attachmentSize ?? null,
      replyToMessageId: null,
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      sender: user,
      senderLabel: user?.displayName ?? user?.fullName ?? user?.username ?? user?.email ?? user?.phone ?? "Пользователь",
      statuses: user ? [{ userId: user.id, status: "READ", createdAt: now }] : [],
      deliveryState: "PENDING"
    };
  }

  function applyOptimisticMessage(message: RealtimeMessage) {
    queryClient.setQueryData<MessagesEnvelope>(["messages", conversationId], (current) => ({
      data: {
        items: mergeMessages(current?.data.items ?? [], message),
        nextCursor: current?.data.nextCursor ?? null,
        hasMore: current?.data.hasMore ?? false
      }
    }));

    queryClient.setQueryData<ChatListEnvelope>(["chats"], (current) =>
      current
        ? {
            data: upsertChatPreview(current.data, message)
          }
        : current
    );
  }

  function markMessageFailed(message: RealtimeMessage) {
    applyOptimisticMessage({
      ...message,
      deliveryState: "FAILED"
    });
  }

  function clearDraft() {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setValue("");
    setPendingAttachment(null);
    socket?.emit("typing:stop", { conversationId });
  }

  async function sendMessage() {
    const body = value.trim();
    if (!body && !pendingAttachment) {
      return;
    }

    setIsSending(true);
    setError(null);

    let optimisticMessage: RealtimeMessage | null = null;

    try {
      const clientTempId = createClientTempId();

      optimisticMessage = buildOptimisticMessage({
        clientTempId,
        type: pendingAttachment
          ? pendingAttachment.file.type.startsWith("image/")
            ? "IMAGE"
            : pendingAttachment.file.type.startsWith("audio/")
              ? "VOICE"
              : "FILE"
          : "TEXT",
        body: body || null,
        attachmentName: pendingAttachment?.file.name,
        attachmentMimeType: pendingAttachment?.file.type || undefined,
        attachmentSize: pendingAttachment?.file.size
      });

      applyOptimisticMessage(optimisticMessage);

      let response;
      if (pendingAttachment) {
        const upload = await uploadFile(pendingAttachment.file);
        const mimeType = upload.data.mimeType;
        const type = mimeType.startsWith("image/")
          ? "IMAGE"
          : mimeType.startsWith("audio/")
            ? "VOICE"
            : "FILE";

        response = await createMessage({
          conversationId,
          clientTempId,
          type,
          body: body || null,
          attachmentUrl: upload.data.url,
          attachmentName: upload.data.originalName,
          attachmentMimeType: upload.data.mimeType,
          attachmentSize: upload.data.size
        });
      } else {
        response = await createMessage({
          conversationId,
          clientTempId,
          body,
          type: "TEXT"
        });
      }

      applyOptimisticMessage({
        ...response.data,
        deliveryState: "SENT"
      });

      clearDraft();
    } catch (submitError) {
      if (optimisticMessage) {
        markMessageFailed(optimisticMessage);
      }
      setError(submitError instanceof Error && submitError.message ? submitError.message : "Не удалось отправить сообщение");
    } finally {
      setIsSending(false);
    }
  }

  function handleChange(next: string) {
    setValue(next);
    socket?.emit("typing:start", { conversationId });

    if (typingTimeout.current) {
      window.clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = window.setTimeout(() => {
      socket?.emit("typing:stop", { conversationId });
    }, 1200);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setPendingAttachment({ file, previewUrl });
    setError(null);
    event.target.value = "";
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        setPendingAttachment({ file });
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch {
      setError("Не удалось получить доступ к микрофону");
    }
  }

  return (
    <div className="border-t border-stroke bg-white px-4 py-4">
      {pendingAttachment ? (
        <div className="mb-3 rounded-2xl border border-stroke bg-canvas px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{pendingAttachment.file.name}</p>
              <p className="mt-1 text-xs text-muted">{Math.round(pendingAttachment.file.size / 1024)} КБ</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-coral"
              onClick={() => {
                if (pendingAttachment.previewUrl) {
                  URL.revokeObjectURL(pendingAttachment.previewUrl);
                }
                setPendingAttachment(null);
              }}
            >
              Убрать
            </button>
          </div>
          {pendingAttachment.previewUrl ? (
            <img src={pendingAttachment.previewUrl} alt={pendingAttachment.file.name} className="mt-3 max-h-40 rounded-2xl object-cover" />
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex items-end gap-3">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
        <button type="button" className="secondary-btn !px-3 !py-3" onClick={() => fileInputRef.current?.click()}>
          Скрепка
        </button>
        <textarea
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          rows={2}
          className="field min-h-12 resize-none"
          placeholder="Напишите сообщение"
        />
        <button
          type="button"
          className={`secondary-btn !px-3 !py-3 ${isRecording ? "!border-coral !text-coral" : ""}`}
          onClick={() => void toggleRecording()}
        >
          {isRecording ? "Стоп" : "Голос"}
        </button>
        <button type="button" className="primary-btn" onClick={() => void sendMessage()} disabled={isSending}>
          {isSending ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}
