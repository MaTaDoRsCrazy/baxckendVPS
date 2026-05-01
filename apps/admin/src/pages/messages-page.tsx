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
    <TableCard title="Messages" subtitle="Inspect message payloads and soft-delete content when moderation requires it.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Sender</th>
            <th className="px-6 py-4">Conversation</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Body</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{message.sender?.username}</td>
              <td className="px-6 py-4 text-slate">{message.conversation?.title ?? message.conversation?.id}</td>
              <td className="px-6 py-4">{message.type}</td>
              <td className="px-6 py-4 text-slate">{message.body ?? (message.isDeleted ? "Deleted" : "—")}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => removeMutation.mutate(message.id)}
                  className="rounded-xl bg-ember px-3 py-2 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
