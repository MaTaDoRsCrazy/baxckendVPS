import { useQuery } from "@tanstack/react-query";
import { getCalls } from "../api/admin";
import { TableCard } from "../components/table-card";
import { formatStatusRu } from "../lib/ui";

export function CallsPage() {
  const { data } = useQuery({
    queryKey: ["calls"],
    queryFn: getCalls
  });

  const calls = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Звонки" subtitle="Сессии LiveKit, связанные с чатами и статусами участников.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Чат</th>
            <th className="px-6 py-4">Тип</th>
            <th className="px-6 py-4">Статус</th>
            <th className="px-6 py-4">Комната</th>
            <th className="px-6 py-4">Участники</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{call.conversation?.title ?? call.conversation?.id}</td>
              <td className="px-6 py-4">{call.type === "AUDIO" ? "Аудио" : "Видео"}</td>
              <td className="px-6 py-4">{formatStatusRu(call.status)}</td>
              <td className="px-6 py-4 text-slate">{call.livekitRoomName}</td>
              <td className="px-6 py-4 text-slate">{call.participants?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
