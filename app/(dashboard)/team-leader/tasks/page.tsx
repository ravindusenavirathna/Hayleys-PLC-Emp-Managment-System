import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils/helpers";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

export const metadata: Metadata = { title: "My Tasks" };

export default async function TeamLeaderTasksPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "team_leader"])) redirect("/");
  if (!user.warehouseId) redirect("/team-leader");

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 20;

  const where: any = { warehouseId: user.warehouseId };
  if (searchParams.status) where.status = searchParams.status;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        cluster: { select: { name: true, code: true } },
        client: { select: { name: true, code: true } },
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        supervisor: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ taskDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const taskStatuses = [
    "scheduled", "worker_allocation_pending", "ready_to_start",
    "in_progress", "completed", "verified", "closed", "cancelled",
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouse Tasks</h1>
          <p className="page-subtitle">{total.toLocaleString()} total tasks in your warehouse</p>
        </div>
        <Link
          href="/team-leader/tasks/create"
          id="btn-create-task"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <form method="GET" className="flex flex-wrap gap-3">
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            id="filter-status"
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            {taskStatuses.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <button
            type="submit"
            id="btn-apply-filters"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
          <Link
            href="/team-leader/tasks"
            id="btn-clear-filters"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </Link>
        </form>
      </div>

      {/* Task table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {["Task #", "Cluster", "Client", "Category", "Date", "Workers", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {task.taskNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{task.cluster.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{task.client.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{task.category.name}</p>
                      <p className="text-xs text-muted-foreground">{task.subCategory.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(task.taskDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold">{task._count.assignments}</span>
                      <span className="text-xs text-muted-foreground">/{task.requiredWorkerCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} type="task" />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/team-leader/tasks/${task.id}`}
                        id={`link-task-${task.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
