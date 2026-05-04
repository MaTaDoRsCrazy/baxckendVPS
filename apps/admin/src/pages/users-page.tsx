import type { AdminUser } from "@emessenger/shared";
import { getAvatarFallback, getDisplayName } from "@emessenger/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import {
  blockUser,
  createSecurityIpBlock,
  getUsers,
  revokeUserSessions,
  unblockUser
} from "../api/admin";
import { TableCard } from "../components/table-card";
import {
  formatDateTimeRu,
  formatLocation,
  formatRoleRu,
  formatStatusRu,
  truncateText,
  translateAdminError
} from "../lib/ui";

function AdminAvatar({ title, avatarUrl }: { title: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={title} className="h-10 w-10 rounded-2xl object-cover" />;
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-xs font-semibold text-white">
      {getAvatarFallback({ name: title })}
    </div>
  );
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers
  });

  const invalidateSecurityData = () => {
    void queryClient.invalidateQueries({ queryKey: ["users"] });
    void queryClient.invalidateQueries({ queryKey: ["security"] });
  };

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      setNotice("Пользователь заблокирован");
      invalidateSecurityData();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось заблокировать пользователя");
    }
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      setNotice("Пользователь разблокирован");
      invalidateSecurityData();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось разблокировать пользователя");
    }
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: revokeUserSessions,
    onSuccess: (response) => {
      setNotice(`Завершено сессий: ${response.data.count}`);
      invalidateSecurityData();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось завершить сессии");
    }
  });

  const blockIpMutation = useMutation({
    mutationFn: createSecurityIpBlock,
    onSuccess: () => {
      setNotice("IP-адрес пользователя заблокирован");
      invalidateSecurityData();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось заблокировать IP-адрес");
    }
  });

  const users = data?.data ?? [];

  return (
    <TableCard title="Пользователи" subtitle="Проверяйте профиль, контакты, статус и недавнюю активность аккаунтов.">
      {notice ? <div className="border-b border-slate-200/70 px-6 py-4 text-sm text-ink">{notice}</div> : null}
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Пользователь</th>
            <th className="px-6 py-4">Username</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Телефон</th>
            <th className="px-6 py-4">О себе</th>
            <th className="px-6 py-4">Роль</th>
            <th className="px-6 py-4">Статус</th>
            <th className="px-6 py-4">Действие</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: AdminUser) => {
            const displayName = getDisplayName(user);
            const lastLogin = user.lastLoginEvent;
            const canBlockLastIp = Boolean(lastLogin?.ipAddress && lastLogin.ipAddress !== "unknown");

            return (
              <Fragment key={user.id}>
                <tr className="border-t border-slate-100 align-top">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AdminAvatar title={displayName} avatarUrl={user.avatarUrl} />
                      <div>
                        <p className="font-medium text-ink">{displayName}</p>
                        <p className="text-xs text-slate">{user.country ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">{user.username || "—"}</td>
                  <td className="px-6 py-4 text-slate">{user.email ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{user.phone ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{truncateText(user.about, 64)}</td>
                  <td className="px-6 py-4">{formatRoleRu(user.role)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.status === "ACTIVE" ? "badge-ok" : "badge-danger"}`}>{formatStatusRu(user.status)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === "BLOCKED" ? (
                      <button
                        type="button"
                        onClick={() => unblockMutation.mutate(user.id)}
                        className="rounded-xl bg-moss px-3 py-2 text-xs font-semibold text-white"
                      >
                        Разблокировать
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => blockMutation.mutate(user.id)}
                        className="rounded-xl bg-ember px-3 py-2 text-xs font-semibold text-white"
                      >
                        Заблокировать
                      </button>
                    )}
                  </td>
                </tr>
                <tr className="border-t border-slate-100 bg-slate-50/60">
                  <td colSpan={8} className="px-6 py-5">
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Последние входы пользователя</p>
                        <div className="mt-3 space-y-2 text-sm text-slate">
                          {user.recentLoginEvents.length > 0 ? (
                            user.recentLoginEvents.map((event) => (
                              <div key={event.id} className="rounded-2xl bg-white px-4 py-3">
                                <p className="font-medium text-ink">
                                  {event.success ? "Успешный вход" : "Ошибка входа"} • {formatDateTimeRu(event.createdAt)}
                                </p>
                                <p className="mt-1">
                                  {event.ipAddress} • {formatLocation(event.country, event.city)}
                                </p>
                                <p className="mt-1 text-xs text-slate">{event.failureReason ?? event.emailOrUsername ?? "—"}</p>
                              </div>
                            ))
                          ) : (
                            <p>-</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Последний IP</p>
                        <p className="mt-3 text-sm font-medium text-ink">{lastLogin?.ipAddress ?? "-"}</p>
                        <p className="mt-1 text-xs text-slate">Активных сессий: {user.activeSessionsCount}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Последняя страна/город</p>
                        <p className="mt-3 text-sm font-medium text-ink">{formatLocation(lastLogin?.country, lastLogin?.city)}</p>
                        <p className="mt-1 text-xs text-slate">Последний вход: {formatDateTimeRu(lastLogin?.createdAt)}</p>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          disabled={!canBlockLastIp || blockIpMutation.isPending}
                          onClick={() =>
                            blockIpMutation.mutate({
                              ipAddress: lastLogin?.ipAddress ?? null,
                              cidr: null,
                              reason: `Блокировка IP пользователя ${displayName}`,
                              expiresAt: null
                            })
                          }
                          className="w-full rounded-2xl bg-ember px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Заблокировать IP
                        </button>
                        <button
                          type="button"
                          disabled={revokeSessionsMutation.isPending}
                          onClick={() => revokeSessionsMutation.mutate(user.id)}
                          className="w-full rounded-2xl border border-ink px-4 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Завершить сессии
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}
