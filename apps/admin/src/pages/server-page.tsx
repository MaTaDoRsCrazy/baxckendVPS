import { useQuery } from "@tanstack/react-query";
import { getServerStatus } from "../api/admin";

export function ServerPage() {
  const { data } = useQuery({
    queryKey: ["server-status"],
    queryFn: getServerStatus
  });

  const status = data?.data ?? {};

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate">Health</p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Server status</h2>
        <p className="mt-2 text-sm text-slate">Backend process, memory, uptime and database reachability from the admin surface.</p>
      </section>
      <section className="panel p-6">
        <pre className="overflow-auto rounded-2xl bg-ink p-4 text-sm text-white">
          {JSON.stringify(status, null, 2)}
        </pre>
      </section>
    </div>
  );
}
