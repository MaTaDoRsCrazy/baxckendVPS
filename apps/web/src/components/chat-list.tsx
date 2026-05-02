import type { Conversation } from "@emessenger/shared";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "./avatar";
import { getConversationTitle, getMessagePreview } from "../lib/display";
import { formatChatDateRu, formatConversationTypeRu } from "../lib/ui";

export function ChatList({ chats }: { chats: Conversation[] }) {
  const { chatId } = useParams();

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const label = getConversationTitle(chat);
        const lastMessage = chat.messages?.[0];

        return (
          <Link
            key={chat.id}
            to={`/chats/${chat.id}`}
            className={`block rounded-2xl border px-4 py-3 transition ${
              chatId === chat.id ? "border-ocean bg-ocean/8" : "border-stroke bg-white hover:bg-canvas"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar title={label} avatarUrl={chat.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-ink">{label}</p>
                  <p className="shrink-0 text-[11px] text-muted">
                    {lastMessage?.createdAt ? formatChatDateRu(lastMessage.createdAt) : ""}
                  </p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-muted">{getMessagePreview(lastMessage)}</p>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-muted">
                    {formatConversationTypeRu(chat.type)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
