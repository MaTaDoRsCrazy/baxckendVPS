import { useEffect, useRef, useState } from "react";
import { createMessage } from "../api/messenger";
import { useRealtime } from "../providers/realtime-provider";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const { socket } = useRealtime();
  const [value, setValue] = useState("");
  const typingTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        window.clearTimeout(typingTimeout.current);
      }
      socket?.emit("typing:stop", { conversationId });
    };
  }, [conversationId, socket]);

  async function sendMessage() {
    const body = value.trim();
    if (!body) return;
    await createMessage({
      conversationId,
      body,
      type: "TEXT"
    });
    setValue("");
    socket?.emit("typing:stop", { conversationId });
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

  return (
    <div className="border-t border-stroke bg-white px-4 py-4">
      <div className="flex items-end gap-3">
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
          placeholder="Type your message"
        />
        <button className="primary-btn" onClick={() => void sendMessage()}>
          Send
        </button>
      </div>
    </div>
  );
}
