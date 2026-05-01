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
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Overview</p>
        <h2 className="mt-3 text-3xl font-bold text-ink">System dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          Quick visibility into users, chats, messages and active LiveKit-backed call sessions.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Users" value={stats?.usersTotal ?? 0} />
        <StatCard label="Blocked Users" value={stats?.usersBlocked ?? 0} />
        <StatCard label="Chats" value={stats?.chatsTotal ?? 0} />
        <StatCard label="Messages" value={stats?.messagesTotal ?? 0} />
        <StatCard label="Calls" value={stats?.callsTotal ?? 0} />
        <StatCard label="Active Calls" value={stats?.activeCalls ?? 0} />
      </div>
    </div>
  );
}
