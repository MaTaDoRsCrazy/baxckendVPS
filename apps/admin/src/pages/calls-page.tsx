import { useQuery } from "@tanstack/react-query";
import { getCalls } from "../api/admin";
import { TableCard } from "../components/table-card";

export function CallsPage() {
  const { data } = useQuery({
    queryKey: ["calls"],
    queryFn: getCalls
  });

  const calls = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Calls" subtitle="LiveKit room sessions linked to conversations and participant statuses.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Conversation</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Room</th>
            <th className="px-6 py-4">Participants</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{call.conversation?.title ?? call.conversation?.id}</td>
              <td className="px-6 py-4">{call.type}</td>
              <td className="px-6 py-4">{call.status}</td>
              <td className="px-6 py-4 text-slate">{call.livekitRoomName}</td>
              <td className="px-6 py-4 text-slate">{call.participants?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
