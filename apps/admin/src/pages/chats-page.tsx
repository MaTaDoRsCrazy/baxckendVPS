import { useQuery } from "@tanstack/react-query";
import { getChats } from "../api/admin";
import { TableCard } from "../components/table-card";
import { formatConversationTypeRu } from "../lib/ui";

export function ChatsPage() {
  const { data } = useQuery({
    queryKey: ["chats"],
    queryFn: getChats
  });

  const chats = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Чаты" subtitle="Список чатов с количеством участников и последним сообщением.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Чат</th>
            <th className="px-6 py-4">Тип</th>
            <th className="px-6 py-4">Участники</th>
            <th className="px-6 py-4">Последнее сообщение</th>
          </tr>
        </thead>
        <tbody>
          {chats.map((chat) => (
            <tr key={chat.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{chat.title ?? chat.id}</td>
              <td className="px-6 py-4">{formatConversationTypeRu(chat.type)}</td>
              <td className="px-6 py-4">{chat.members?.length ?? 0}</td>
              <td className="px-6 py-4 text-slate">{chat.messages?.[0]?.body ?? "Сообщений пока нет"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
