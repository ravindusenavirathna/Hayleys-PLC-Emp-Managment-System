import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatRelative, capitalize } from "@/lib/utils/helpers";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; action?: string };
}) {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 25;

  const where: any = {};
  if (searchParams.action) where.action = searchParams.action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Record<string, string> = {
    task_created: "bg-blue-50 text-blue-700 border-blue-200",
    task_updated: "bg-amber-50 text-amber-700 border-amber-200",
    task_cancelled: "bg-red-50 text-red-700 border-red-200",
    task_completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    task_verified: "bg-green-50 text-green-700 border-green-200",
    task_closed: "bg-slate-50 text-slate-600 border-slate-200",
    worker_assigned: "bg-indigo-50 text-indigo-700 border-indigo-200",
    worker_borrowed: "bg-violet-50 text-violet-700 border-violet-200",
    adhoc_hired: "bg-orange-50 text-orange-700 border-orange-200",
    worker_marked_done: "bg-cyan-50 text-cyan-700 border-cyan-200",
    worker_released: "bg-teal-50 text-teal-700 border-teal-200",
    user_login: "bg-gray-50 text-gray-600 border-gray-200",
    user_permission_changed: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">{total.toLocaleString()} total log entries</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {["Time", "User", "Action", "Entity", "Details"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <p>{formatRelative(log.createdAt)}</p>
                    <p className="text-[10px] opacity-70">{formatDate(log.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{log.user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${actionColors[log.action] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {capitalize(log.action.replace(/_/g, " "))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{log.entityType}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{log.entityId.slice(0, 12)}...</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {log.newValue && (
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {JSON.stringify(log.newValue).slice(0, 60)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`/admin/audit-logs?page=${page - 1}`} id="btn-prev-page"
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a href={`/admin/audit-logs?page=${page + 1}`} id="btn-next-page"
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
