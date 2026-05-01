import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "../api/admin";
import { TableCard } from "../components/table-card";

export function AuditLogPage() {
  const { data } = useQuery({
    queryKey: ["audit-log"],
    queryFn: getAuditLog
  });

  const rows = (data?.data ?? []) as Array<any>;

  return (
    <TableCard title="Audit Log" subtitle="Every admin route hit and moderation action is stored here for traceability.">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate">
          <tr>
            <th className="px-6 py-4">Admin</th>
            <th className="px-6 py-4">Action</th>
            <th className="px-6 py-4">Target</th>
            <th className="px-6 py-4">Created At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-6 py-4 font-medium text-ink">{row.admin?.username}</td>
              <td className="px-6 py-4">{row.action}</td>
              <td className="px-6 py-4 text-slate">{row.targetType}{row.targetId ? `:${row.targetId}` : ""}</td>
              <td className="px-6 py-4 text-slate">{new Date(row.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
