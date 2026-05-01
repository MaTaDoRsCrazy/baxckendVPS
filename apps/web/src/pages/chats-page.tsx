import type { Conversation, Message } from "@emessenger/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getChat, getChats, getChatMessages, markMessageRead, startCall } from "../api/messenger";
import { ChatList } from "../components/chat-list";
import { CreateChatPanel } from "../components/create-chat-panel";
import { MessageComposer } from "../components/message-composer";
import { formatTimeRu } from "../lib/ui";
import { useAuth } from "../providers/auth-provider";
import { useRealtime } from "../providers/realtime-provider";

function lastReadLabel(message: Message, currentUserId: string) {
  const readCount = (message.statuses ?? []).filter((status) => status.userId !== currentUserId && status.status === "READ").length;
  return readCount > 0 ? `Прочитано: ${readCount}` : "Отправлено";
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

  const title =
    conversation?.title ??
    conversation?.members?.filter((member) => member.userId !== auth?.user.id).map((member) => member.user.username).join(", ") ??
    "Выберите чат";

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <aside className={`space-y-4 ${chatId ? "hidden lg:block" : "block"}`}>
        <div className="surface p-4">
          <h2 className="text-xl font-semibold text-ink">Чаты</h2>
          <p className="mt-1 text-sm text-muted">Сообщения в реальном времени, звонки через LiveKit и удобный интерфейс для телефона и ПК.</p>
        </div>
        <CreateChatPanel />
        <div className="surface p-3">
          <ChatList chats={chats as Conversation[]} />
        </div>
      </aside>

      <section className={`${chatId ? "block" : "hidden lg:block"}`}>
        <div className="surface flex min-h-[70vh] flex-col overflow-hidden">
          {conversation ? (
            <>
              <div className="border-b border-stroke bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Link to="/chats" className="text-sm text-ocean lg:hidden">
                        Назад
                      </Link>
                      <h2 className="text-xl font-semibold text-ink">{title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {conversation.members?.some((member) => onlineUsers.has(member.user.id)) ? "В сети" : "Не в сети"}
                    </p>
                    {typingUsers.length > 0 ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.15em] text-ocean">Печатает...</p>
                    ) : null}
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
                      <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${own ? "bg-ocean text-white" : "bg-white text-ink"}`}>
                        <p className="text-xs opacity-70">{message.sender?.username ?? "Пользователь"}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{message.isDeleted ? "Сообщение удалено" : message.body}</p>
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
                <p className="mt-2 text-sm text-muted">На мобильном откроется отдельный экран чата, а на десктопе чат появится справа.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
