import { useQuery } from "@tanstack/react-query";
import { getChats } from "../api/admin";
import { TableCard } from "../components/table-card";

export function ChatsPage() {
  const { data } = useQuery({
    queryKey: ["chats"],
    queryFn: getChats
  });

  const chats = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Chats" subtitle="Conversation list with member count and the latest message snapshot.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Chat</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Members</th>
            <th className="px-6 py-4">Latest Message</th>
          </tr>
        </thead>
        <tbody>
          {chats.map((chat) => (
            <tr key={chat.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{chat.title ?? chat.id}</td>
              <td className="px-6 py-4">{chat.type}</td>
              <td className="px-6 py-4">{chat.members?.length ?? 0}</td>
              <td className="px-6 py-4 text-slate">{chat.messages?.[0]?.body ?? "No messages yet"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
