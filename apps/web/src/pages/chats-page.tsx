import type { Message } from "@emessenger/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getChat, getChats, getChatMessages, markMessageRead, startCall } from "../api/messenger";
import { Avatar } from "../components/avatar";
import { ChatList } from "../components/chat-list";
import { CreateChatPanel } from "../components/create-chat-panel";
import { MessageComposer } from "../components/message-composer";
import { getConversationTitle, getUserDisplayName } from "../lib/display";
import { formatBytes, formatTimeRu } from "../lib/ui";
import { useAuth } from "../providers/auth-provider";
import { useRealtime } from "../providers/realtime-provider";

function lastReadLabel(message: Message, currentUserId: string) {
  const readCount = (message.statuses ?? []).filter((status) => status.userId !== currentUserId && status.status === "READ").length;
  return readCount > 0 ? `Прочитано: ${readCount}` : "Отправлено";
}

function MessageContent({ message }: { message: Message }) {
  if (message.isDeleted) {
    return <p className="mt-1 whitespace-pre-wrap text-sm italic opacity-80">Сообщение удалено</p>;
  }

  return (
    <div className="mt-1 space-y-3">
      {message.body ? <p className="whitespace-pre-wrap text-sm">{message.body}</p> : null}
      {message.type === "IMAGE" && message.attachmentUrl ? (
        <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
          <img src={message.attachmentUrl} alt={message.attachmentName ?? "Изображение"} className="max-h-72 rounded-2xl object-cover" />
        </a>
      ) : null}
      {message.type === "VOICE" && message.attachmentUrl ? (
        <div className="rounded-2xl bg-black/5 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] opacity-70">Голосовое сообщение</p>
          <audio controls src={message.attachmentUrl} className="w-full" />
        </div>
      ) : null}
      {message.type === "FILE" && message.attachmentUrl ? (
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-current/20 px-4 py-3"
        >
          <p className="font-medium">{message.attachmentName ?? "Файл"}</p>
          <p className="mt-1 text-xs opacity-70">
            {message.attachmentMimeType ?? "Файл"} • {formatBytes(message.attachmentSize)}
          </p>
        </a>
      ) : null}
    </div>
  );
}

export function ChatsPage() {
  const { auth } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { typingByConversation, onlineUsers } = useRealtime();

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: getChats
  });

  const chatQuery = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChat(chatId!),
    enabled: Boolean(chatId)
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: Boolean(chatId)
  });

  useQuery({
    queryKey: ["chat-read", chatId, messagesQuery.data?.data?.length],
    enabled: Boolean(chatId && messagesQuery.data?.data?.length),
    queryFn: async () => {
      const unread = (messagesQuery.data?.data ?? []).filter((message) => message.senderId !== auth?.user.id);
      for (const message of unread) {
        await markMessageRead(message.id);
      }
      return true;
    }
  });

  const callMutation = useMutation({
    mutationFn: startCall,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
      navigate(`/call/${response.data.id}`);
    }
  });

  const chats = chatsQuery.data?.data ?? [];
  const conversation = chatQuery.data?.data;
  const messages = messagesQuery.data?.data ?? [];
  const typingUsers = typingByConversation[chatId ?? ""] ?? [];
  const title = getConversationTitle(conversation, auth?.user.id);
  const otherMembers = conversation?.members?.filter((member) => member.userId !== auth?.user.id) ?? [];
  const avatarUser = otherMembers[0]?.user;

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <aside className={`space-y-4 ${chatId ? "hidden lg:block" : "block"}`}>
        <div className="surface p-4">
          <h2 className="text-xl font-semibold text-ink">Чаты</h2>
          <p className="mt-1 text-sm text-muted">Сообщения, вложения, голосовые и звонки через LiveKit в одном интерфейсе.</p>
        </div>
        <CreateChatPanel />
        <div className="surface p-3">
          <ChatList chats={chats} />
        </div>
      </aside>

      <section className={`${chatId ? "block" : "hidden lg:block"}`}>
        <div className="surface flex min-h-[70vh] flex-col overflow-hidden">
          {conversation ? (
            <>
              <div className="border-b border-stroke bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar title={title} avatarUrl={avatarUser?.avatarUrl ?? conversation.avatarUrl} />
                    <div>
                      <div className="flex items-center gap-3">
                        <Link to="/chats" className="text-sm text-ocean lg:hidden">
                          Назад
                        </Link>
                        <h2 className="text-xl font-semibold text-ink">{title}</h2>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {otherMembers.some((member) => onlineUsers.has(member.user.id)) ? "В сети" : "Не в сети"}
                      </p>
                      {typingUsers.length > 0 ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-ocean">Печатает...</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="secondary-btn !px-3 !py-2"
                      onClick={() => callMutation.mutate({ conversationId: conversation.id, type: "AUDIO" })}
                    >
                      Аудио
                    </button>
                    <button
                      className="secondary-btn !px-3 !py-2"
                      onClick={() => callMutation.mutate({ conversationId: conversation.id, type: "VIDEO" })}
                    >
                      Видео
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-auto bg-canvas/70 px-4 py-4">
                {messages.map((message) => {
                  const own = message.senderId === auth?.user.id;
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-3xl px-4 py-3 ${own ? "bg-ocean text-white" : "bg-white text-ink"}`}>
                        <p className="text-xs opacity-70">{getUserDisplayName(message.sender)}</p>
                        <MessageContent message={message} />
                        <div className="mt-2 text-[11px] opacity-70">
                          {formatTimeRu(message.createdAt)} {own ? `• ${lastReadLabel(message, auth?.user.id ?? "")}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-muted">
                    Сообщений пока нет. Начните общение первым.
                  </div>
                ) : null}
              </div>
              <MessageComposer conversationId={conversation.id} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Выберите чат</h2>
                <p className="mt-2 text-sm text-muted">На мобильном чат откроется отдельным экраном, на десктопе он появится справа.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
