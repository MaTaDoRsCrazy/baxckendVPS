import { useEffect, useRef, useState } from "react";
import { createMessage, uploadFile } from "../api/messenger";
import { translateWebError } from "../lib/ui";
import { useRealtime } from "../providers/realtime-provider";

interface PendingAttachment {
  file: File;
  previewUrl?: string;
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const { socket } = useRealtime();
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

  async function sendMessage() {
    const body = value.trim();
    if (!body && !pendingAttachment) return;

    setIsSending(true);
    setError(null);

    try {
      if (pendingAttachment) {
        const upload = await uploadFile(pendingAttachment.file);
        const mimeType = upload.data.mimeType;
        const type = mimeType.startsWith("image/")
          ? "IMAGE"
          : mimeType.startsWith("audio/")
            ? "VOICE"
            : "FILE";

        await createMessage({
          conversationId,
          type,
          body: body || null,
          attachmentUrl: upload.data.url,
          attachmentName: upload.data.originalName,
          attachmentMimeType: upload.data.mimeType,
          attachmentSize: upload.data.size
        });
      } else {
        await createMessage({
          conversationId,
          body,
          type: "TEXT"
        });
      }

      if (pendingAttachment?.previewUrl) {
        URL.revokeObjectURL(pendingAttachment.previewUrl);
      }
      setValue("");
      setPendingAttachment(null);
      socket?.emit("typing:stop", { conversationId });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : translateWebError());
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
        <button className="secondary-btn !px-3 !py-3" onClick={() => fileInputRef.current?.click()}>
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
          className={`secondary-btn !px-3 !py-3 ${isRecording ? "!border-coral !text-coral" : ""}`}
          onClick={() => void toggleRecording()}
        >
          {isRecording ? "Стоп" : "Голос"}
        </button>
        <button className="primary-btn" onClick={() => void sendMessage()} disabled={isSending}>
          {isSending ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}
