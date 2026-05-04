import { getDisplayName } from "@emessenger/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createSecurityIpBlock,
  deleteSecurityIpBlock,
  getSecurityIpBlocks,
  getSecurityLoginEvents,
  getSecuritySessions,
  revokeSecuritySession
} from "../api/admin";
import { TableCard } from "../components/table-card";
import {
  formatBooleanRu,
  formatDateTimeRu,
  formatLocation,
  translateAdminError,
  truncateText
} from "../lib/ui";

type SecurityTab = "login-events" | "ip-blocks" | "sessions";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss";
const tabClassName = (isActive: boolean) =>
  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
    isActive ? "bg-ink text-white" : "bg-white text-slate hover:bg-sand"
  }`;

function isBlockActive(block: { isActive: boolean; expiresAt?: string | Date | null }) {
  if (!block.isActive) {
    return false;
  }

  if (!block.expiresAt) {
    return true;
  }

  return new Date(block.expiresAt).getTime() > Date.now();
}

export function SecurityPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SecurityTab>("login-events");
  const [notice, setNotice] = useState<string | null>(null);
  const [filtersDraft, setFiltersDraft] = useState({
    userId: "",
    ip: "",
    success: "all"
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    userId: "",
    ip: "",
    success: undefined as boolean | undefined
  });
  const [blockForm, setBlockForm] = useState({
    ipAddress: "",
    cidr: "",
    reason: "",
    expiresAt: ""
  });

  const loginEventsQuery = useQuery({
    queryKey: ["security", "login-events", filters],
    queryFn: () => getSecurityLoginEvents(filters)
  });

  const ipBlocksQuery = useQuery({
    queryKey: ["security", "ip-blocks"],
    queryFn: getSecurityIpBlocks
  });

  const sessionsQuery = useQuery({
    queryKey: ["security", "sessions"],
    queryFn: () => getSecuritySessions()
  });

  const createBlockMutation = useMutation({
    mutationFn: createSecurityIpBlock,
    onSuccess: () => {
      setNotice("IP-блокировка сохранена");
      setBlockForm({
        ipAddress: "",
        cidr: "",
        reason: "",
        expiresAt: ""
      });
      void queryClient.invalidateQueries({ queryKey: ["security", "ip-blocks"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось создать блокировку");
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: deleteSecurityIpBlock,
    onSuccess: () => {
      setNotice("IP-блокировка отключена");
      void queryClient.invalidateQueries({ queryKey: ["security", "ip-blocks"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось отключить блокировку");
    }
  });

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSecuritySession,
    onSuccess: () => {
      setNotice("Сессия завершена");
      void queryClient.invalidateQueries({ queryKey: ["security", "sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? translateAdminError(error.message) : "Не удалось завершить сессию");
    }
  });

  const loginEvents = loginEventsQuery.data?.data.items ?? [];
  const loginEventsMeta = loginEventsQuery.data?.data;
  const ipBlocks = ipBlocksQuery.data?.data ?? [];
  const sessions = sessionsQuery.data?.data ?? [];

  function applyFilters() {
    setFilters({
      page: 1,
      limit: 25,
      userId: filtersDraft.userId.trim(),
      ip: filtersDraft.ip.trim(),
      success:
        filtersDraft.success === "all"
          ? undefined
          : filtersDraft.success === "true"
      ? true
      : false
    });
  }

  function resetFilters() {
    setFiltersDraft({
      userId: "",
      ip: "",
      success: "all"
    });
    setFilters({
      page: 1,
      limit: 25,
      userId: "",
      ip: "",
      success: undefined
    });
  }

  async function handleBlockSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    await createBlockMutation.mutateAsync({
      ipAddress: blockForm.ipAddress.trim() || null,
      cidr: blockForm.cidr.trim() || null,
      reason: blockForm.reason.trim(),
      expiresAt: blockForm.expiresAt ? new Date(blockForm.expiresAt).toISOString() : null
    });
  }

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Безопасность</p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Контроль входов, IP и сессий</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate">
          Здесь можно анализировать входы, блокировать подозрительные IP-адреса и завершать активные сессии пользователей.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className={tabClassName(activeTab === "login-events")} onClick={() => setActiveTab("login-events")}>
            История входов
          </button>
          <button type="button" className={tabClassName(activeTab === "ip-blocks")} onClick={() => setActiveTab("ip-blocks")}>
            IP-блокировки
          </button>
          <button type="button" className={tabClassName(activeTab === "sessions")} onClick={() => setActiveTab("sessions")}>
            Активные сессии
          </button>
        </div>
        {notice ? <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-ink">{notice}</p> : null}
      </div>

      {activeTab === "login-events" ? (
        <TableCard title="История входов" subtitle="Успешные и неуспешные попытки входа, регистрации и refresh-запросы.">
          <div className="border-b border-slate-200/70 px-6 py-5">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                className={inputClassName}
                placeholder="ID пользователя"
                value={filtersDraft.userId}
                onChange={(event) => setFiltersDraft((current) => ({ ...current, userId: event.target.value }))}
              />
              <input
                className={inputClassName}
                placeholder="IP-адрес"
                value={filtersDraft.ip}
                onChange={(event) => setFiltersDraft((current) => ({ ...current, ip: event.target.value }))}
              />
              <select
                className={inputClassName}
                value={filtersDraft.success}
                onChange={(event) => setFiltersDraft((current) => ({ ...current, success: event.target.value }))}
              >
                <option value="all">Все события</option>
                <option value="true">Только успешные</option>
                <option value="false">Только ошибки</option>
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={applyFilters} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss">
                  Применить
                </button>
                <button type="button" onClick={resetFilters} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate transition hover:bg-sand">
                  Сбросить
                </button>
              </div>
            </div>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate">
              <tr>
                <th className="px-6 py-4">Пользователь</th>
                <th className="px-6 py-4">Email/username</th>
                <th className="px-6 py-4">IP</th>
                <th className="px-6 py-4">Страна</th>
                <th className="px-6 py-4">Город</th>
                <th className="px-6 py-4">Устройство</th>
                <th className="px-6 py-4">Успешно</th>
                <th className="px-6 py-4">Причина ошибки</th>
                <th className="px-6 py-4">Дата</th>
              </tr>
            </thead>
            <tbody>
              {loginEvents.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-4 font-medium text-ink">{row.user ? getDisplayName(row.user) : "—"}</td>
                  <td className="px-6 py-4 text-slate">{row.emailOrUsername ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{row.ipAddress}</td>
                  <td className="px-6 py-4 text-slate">{row.country ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{row.city ?? "—"}</td>
                  <td className="px-6 py-4 text-slate" title={row.userAgent ?? ""}>{truncateText(row.userAgent, 54)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${row.success ? "badge-ok" : "badge-danger"}`}>{formatBooleanRu(row.success)}</span>
                  </td>
                  <td className="px-6 py-4 text-slate">{row.failureReason ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{formatDateTimeRu(row.createdAt)}</td>
                </tr>
              ))}
              {loginEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate">
                    События входа пока не найдены.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-200/70 px-6 py-4 text-sm text-slate">
            <span>
              Страница {loginEventsMeta?.page ?? 1} из {loginEventsMeta?.pages ?? 1}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={(filters.page ?? 1) <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={(filters.page ?? 1) >= (loginEventsMeta?.pages ?? 1)}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        </TableCard>
      ) : null}

      {activeTab === "ip-blocks" ? (
        <div className="space-y-6">
          <section className="panel p-6">
            <h3 className="text-xl font-semibold text-ink">Новая IP-блокировка</h3>
            <p className="mt-1 text-sm text-slate">Укажите либо конкретный IP-адрес, либо CIDR-диапазон.</p>
            <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleBlockSubmit}>
              <input
                className={inputClassName}
                placeholder="IP-адрес"
                value={blockForm.ipAddress}
                onChange={(event) => setBlockForm((current) => ({ ...current, ipAddress: event.target.value }))}
              />
              <input
                className={inputClassName}
                placeholder="CIDR"
                value={blockForm.cidr}
                onChange={(event) => setBlockForm((current) => ({ ...current, cidr: event.target.value }))}
              />
              <input
                className={inputClassName}
                placeholder="Причина"
                value={blockForm.reason}
                onChange={(event) => setBlockForm((current) => ({ ...current, reason: event.target.value }))}
              />
              <input
                className={inputClassName}
                type="datetime-local"
                value={blockForm.expiresAt}
                onChange={(event) => setBlockForm((current) => ({ ...current, expiresAt: event.target.value }))}
              />
              <div className="md:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  disabled={createBlockMutation.isPending}
                  className="rounded-2xl bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-70"
                >
                  {createBlockMutation.isPending ? "Сохраняем..." : "Заблокировать"}
                </button>
              </div>
            </form>
          </section>

          <TableCard title="IP-блокировки" subtitle="Активные и исторические правила блокировки IP-адресов и диапазонов.">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate">
                <tr>
                  <th className="px-6 py-4">IP/CIDR</th>
                  <th className="px-6 py-4">Причина</th>
                  <th className="px-6 py-4">Активна</th>
                  <th className="px-6 py-4">Истекает</th>
                  <th className="px-6 py-4">Кто заблокировал</th>
                  <th className="px-6 py-4">Дата</th>
                  <th className="px-6 py-4">Действие</th>
                </tr>
              </thead>
              <tbody>
                {ipBlocks.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-ink">{row.ipAddress ?? row.cidr ?? "—"}</td>
                    <td className="px-6 py-4 text-slate">{row.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${isBlockActive(row) ? "badge-danger" : "badge-ok"}`}>
                        {isBlockActive(row) ? "Да" : "Нет"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate">{formatDateTimeRu(row.expiresAt)}</td>
                    <td className="px-6 py-4 text-slate">{row.blockedByAdmin ? getDisplayName(row.blockedByAdmin) : "—"}</td>
                    <td className="px-6 py-4 text-slate">{formatDateTimeRu(row.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={!isBlockActive(row) || deleteBlockMutation.isPending}
                        onClick={() => deleteBlockMutation.mutate(row.id)}
                        className="rounded-xl bg-moss px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Разблокировать
                      </button>
                    </td>
                  </tr>
                ))}
                {ipBlocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate">
                      Список IP-блокировок пуст.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableCard>
        </div>
      ) : null}

      {activeTab === "sessions" ? (
        <TableCard title="Активные сессии" subtitle="Сессии с действующим refresh-токеном и последней активностью.">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate">
              <tr>
                <th className="px-6 py-4">Пользователь</th>
                <th className="px-6 py-4">IP</th>
                <th className="px-6 py-4">Страна</th>
                <th className="px-6 py-4">Город</th>
                <th className="px-6 py-4">User-Agent</th>
                <th className="px-6 py-4">Последняя активность</th>
                <th className="px-6 py-4">Действие</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-ink">{row.user ? getDisplayName(row.user) : "—"}</p>
                      {row.isCurrent ? <span className="badge badge-ok">Текущая</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate">{row.ipAddress ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{row.country ?? "—"}</td>
                  <td className="px-6 py-4 text-slate">{row.city ?? "—"}</td>
                  <td className="px-6 py-4 text-slate" title={row.userAgent ?? ""}>{truncateText(row.userAgent, 64)}</td>
                  <td className="px-6 py-4 text-slate">
                    <div>{formatDateTimeRu(row.lastSeenAt)}</div>
                    <div className="mt-1 text-xs">
                      {formatLocation(row.country, row.city)} • до {formatDateTimeRu(row.expiresAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      disabled={Boolean(row.isCurrent) || revokeSessionMutation.isPending}
                      onClick={() => revokeSessionMutation.mutate(row.id)}
                      className="rounded-xl bg-ember px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Завершить
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate">
                    Активных сессий не найдено.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableCard>
      ) : null}
    </div>
  );
}
