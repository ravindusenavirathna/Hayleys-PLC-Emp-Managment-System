import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/helpers";
import Link from "next/link";
import {
  Users, ClipboardList, UserCheck, AlertTriangle, Activity, ChevronRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Supervisor Dashboard" };

export default async function SupervisorDashboardPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "supervisor"])) redirect("/");
  if (!user.warehouseId) redirect("/login");

  const warehouseId = user.warehouseId!;

  const [
    tasksNeedingAllocation,
    activeTasks,
    freeWorkersByCluster,
    recentTasksForAllocation,
  ] = await Promise.all([
    prisma.task.count({
      where: { warehouseId, status: "worker_allocation_pending" },
    }),
    prisma.task.count({
      where: { warehouseId, status: { in: ["in_progress", "ready_to_start"] } },
    }),
    prisma.cluster.findMany({
      where: { warehouseId, isActive: true },
      include: {
        _count: {
          select: {
            employees: { where: { status: "free", employeeType: "permanent", isActive: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        warehouseId,
        status: { in: ["worker_allocation_pending", "scheduled", "ready_to_start", "in_progress"] },
      },
      include: {
        cluster: { select: { name: true } },
        client: { select: { code: true } },
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ status: "asc" }, { taskDate: "asc" }],
      take: 10,
    }),
  ]);

  const totalFreeWorkers = freeWorkersByCluster.reduce(
    (sum, c) => sum + c._count.employees, 0
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.warehouse?.name} — Supervisor</h1>
          <p className="page-subtitle">Workforce allocation and task monitoring dashboard</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Needs Allocation"
          value={tasksNeedingAllocation}
          subtitle="Tasks waiting for workers"
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          icon={Activity}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Free Workers"
          value={totalFreeWorkers}
          subtitle="Available for assignment"
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Clusters"
          value={freeWorkersByCluster.length}
          subtitle="In this warehouse"
          icon={UserCheck}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Free workers by cluster */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Free Workers by Cluster</h3>
          </div>
          <div className="divide-y divide-border">
            {freeWorkersByCluster.map((cluster) => (
              <div key={cluster.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{cluster.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold tabular-nums ${
                    cluster._count.employees > 0 ? "text-emerald-700" : "text-red-500"
                  }`}>
                    {cluster._count.employees}
                  </span>
                  <span className="text-xs text-muted-foreground">free</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <Link href="/supervisor/borrow-workers" id="link-borrow-workers"
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
              Borrow workers from clusters →
            </Link>
          </div>
        </div>

        {/* Tasks needing action */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Tasks Requiring Action</h3>
            <Link href="/supervisor/allocation" id="link-all-allocation"
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTasksForAllocation.map((task) => (
              <Link key={task.id} href={`/supervisor/tasks/${task.id}`}
                id={`link-task-${task.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {task.taskNumber}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-foreground truncate">
                    {task.client.code} — {task.category.name} / {task.subCategory.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.cluster.name} · {formatDate(task.taskDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      task._count.assignments >= task.requiredWorkerCount ? "text-emerald-600" : "text-orange-600"
                    }`}>
                      {task._count.assignments}/{task.requiredWorkerCount}
                    </span>
                    <p className="text-[10px] text-muted-foreground">workers</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {recentTasksForAllocation.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No tasks requiring action right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
