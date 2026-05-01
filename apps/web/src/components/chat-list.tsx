import type { Conversation } from "@emessenger/shared";
import { Link, useParams } from "react-router-dom";

export function ChatList({ chats }: { chats: Conversation[] }) {
  const { chatId } = useParams();

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const label =
          chat.title ??
          chat.members?.map((member) => member.user.username).filter(Boolean).slice(0, 2).join(", ") ??
          chat.id;

        return (
          <Link
            key={chat.id}
            to={`/chats/${chat.id}`}
            className={`block rounded-2xl border px-4 py-3 transition ${
              chatId === chat.id ? "border-ocean bg-ocean/8" : "border-stroke bg-white hover:bg-canvas"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{label}</p>
                <p className="mt-1 truncate text-xs text-muted">{chat.messages?.[0]?.body ?? "No messages yet"}</p>
              </div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted">{chat.type}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
