import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blockUser, getUsers, unblockUser } from "../api/admin";
import { TableCard } from "../components/table-card";
import { formatRoleRu, formatStatusRu } from "../lib/ui";

export function UsersPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  const users = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Пользователи" subtitle="Управляйте статусами аккаунтов и контролируйте доступ к системе.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Имя пользователя</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Роль</th>
            <th className="px-6 py-4">Статус</th>
            <th className="px-6 py-4">Действие</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{user.username}</td>
              <td className="px-6 py-4 text-slate">{user.email ?? "—"}</td>
              <td className="px-6 py-4">{formatRoleRu(user.role)}</td>
              <td className="px-6 py-4">
                <span className={`badge ${user.status === "ACTIVE" ? "badge-ok" : "badge-danger"}`}>{formatStatusRu(user.status)}</span>
              </td>
              <td className="px-6 py-4">
                {user.status === "BLOCKED" ? (
                  <button
                    onClick={() => unblockMutation.mutate(user.id)}
                    className="rounded-xl bg-moss px-3 py-2 text-xs font-semibold text-white"
                  >
                    Разблокировать
                  </button>
                ) : (
                  <button
                    onClick={() => blockMutation.mutate(user.id)}
                    className="rounded-xl bg-ember px-3 py-2 text-xs font-semibold text-white"
                  >
                    Заблокировать
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
