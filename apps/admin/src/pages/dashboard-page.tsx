import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/admin";
import { StatCard } from "../components/stat-card";

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Обзор</p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Системная панель</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          Быстрый обзор пользователей, чатов, сообщений и активных звонков на базе LiveKit.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Пользователи" value={stats?.usersTotal ?? 0} />
        <StatCard label="Заблокированные" value={stats?.usersBlocked ?? 0} />
        <StatCard label="Чаты" value={stats?.chatsTotal ?? 0} />
        <StatCard label="Сообщения" value={stats?.messagesTotal ?? 0} />
        <StatCard label="Звонки" value={stats?.callsTotal ?? 0} />
        <StatCard label="Активные звонки" value={stats?.activeCalls ?? 0} />
      </div>
    </div>
  );
}
