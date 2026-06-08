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
  ClipboardList, CheckCircle, Clock, AlertTriangle, Plus, Activity, Layers,
} from "lucide-react";

export const metadata: Metadata = { title: "Warehouse Dashboard" };

export default async function TeamLeaderDashboardPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "team_leader"])) redirect("/");

  if (!user.warehouseId) redirect("/login");

  const warehouseId = user.warehouseId!;
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [
    todaysTasks,
    pendingTasks,
    completedToday,
    allocationPending,
    clusters,
    recentTasks,
  ] = await Promise.all([
    prisma.task.count({
      where: { warehouseId, taskDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.task.count({
      where: { warehouseId, status: { in: ["scheduled", "worker_allocation_pending"] } },
    }),
    prisma.task.count({
      where: {
        warehouseId,
        status: { in: ["completed", "verified", "closed"] },
        taskDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.task.count({
      where: { warehouseId, status: "worker_allocation_pending" },
    }),
    prisma.cluster.findMany({
      where: { warehouseId, isActive: true },
      include: {
        _count: {
          select: {
            tasks: { where: { status: { in: ["in_progress", "ready_to_start"] } } },
            employees: { where: { status: "free", isActive: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: { warehouseId },
      include: {
        cluster: { select: { name: true } },
        client: { select: { name: true, code: true } },
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ taskDate: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  const warehouse = user.warehouse!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{warehouse.name} Warehouse</h1>
          <p className="page-subtitle">
            Team Leader Dashboard ·{" "}
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Today's Tasks"
          value={todaysTasks}
          icon={ClipboardList}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Pending"
          value={pendingTasks}
          subtitle="Scheduled or pending allocation"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Allocation Needed"
          value={allocationPending}
          subtitle="Workers not yet assigned"
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cluster Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Cluster Overview</h3>
            </div>
            <div className="divide-y divide-border">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cluster.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cluster._count.employees} free workers
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-500" />
                      <span className="text-sm font-semibold text-indigo-700">
                        {cluster._count.tasks}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">active tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent Tasks</h3>
              </div>
              <Link
                href="/team-leader/tasks"
                id="link-all-tasks"
                className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/team-leader/tasks/${task.id}`}
                  id={`link-task-${task.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
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
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-foreground">
                      {task._count.assignments}/{task.requiredWorkerCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">workers</p>
                  </div>
                </Link>
              ))}
              {recentTasks.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No tasks yet. Create your first task!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
