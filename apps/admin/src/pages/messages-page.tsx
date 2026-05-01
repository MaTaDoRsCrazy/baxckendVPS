import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMessage, getMessages } from "../api/admin";
import { TableCard } from "../components/table-card";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["messages"],
    queryFn: getMessages
  });

  const removeMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["messages"] })
  });

  const messages = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Сообщения" subtitle="Просматривайте сообщения и мягко удаляйте контент при необходимости модерации.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Отправитель</th>
            <th className="px-6 py-4">Чат</th>
            <th className="px-6 py-4">Тип</th>
            <th className="px-6 py-4">Текст</th>
            <th className="px-6 py-4">Действие</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{message.sender?.username}</td>
              <td className="px-6 py-4 text-slate">{message.conversation?.title ?? message.conversation?.id}</td>
              <td className="px-6 py-4">{message.type}</td>
              <td className="px-6 py-4 text-slate">{message.body ?? (message.isDeleted ? "Удалено" : "—")}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => removeMutation.mutate(message.id)}
                  className="rounded-xl bg-ember px-3 py-2 text-xs font-semibold text-white"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
