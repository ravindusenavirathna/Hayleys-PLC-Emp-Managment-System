import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/helpers";
import Link from "next/link";
import { ClipboardList, Activity, CheckCircle, Users, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Cluster Dashboard" };

export default async function AssistantDashboardPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "assistant"])) redirect("/");
  if (!user.clusterId) redirect("/login");

  const clusterId = user.clusterId!;

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [
    todaysTasks,
    activeTasks,
    completedTasks,
    freeWorkers,
    clusterWorkers,
    tasks,
  ] = await Promise.all([
    prisma.task.count({
      where: { clusterId, taskDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.task.count({
      where: { clusterId, status: { in: ["in_progress", "ready_to_start"] } },
    }),
    prisma.task.count({
      where: {
        clusterId,
        status: { in: ["completed", "verified", "closed"] },
        taskDate: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.employee.count({
      where: { homeClusterId: clusterId, status: "free", isActive: true },
    }),
    prisma.employee.findMany({
      where: { homeClusterId: clusterId, isActive: true, employeeType: "permanent" },
      select: { id: true, name: true, employeeCode: true, status: true },
      orderBy: { name: "asc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: { clusterId },
      include: {
        client: { select: { code: true } },
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ status: "asc" }, { taskDate: "asc" }],
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.cluster?.name}</h1>
          <p className="page-subtitle">
            Assistant Dashboard · {user.warehouse?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Today's Tasks" value={todaysTasks} icon={ClipboardList}
          iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <StatCard title="Active Tasks" value={activeTasks} icon={Activity}
          iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Completed Today" value={completedTasks} icon={CheckCircle}
          iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Free Workers" value={freeWorkers} icon={Users}
          iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Worker Status List */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Worker Status</h3>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {clusterWorkers.map((worker) => (
              <div key={worker.id} className="px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-600">
                      {worker.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{worker.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{worker.employeeCode}</p>
                  </div>
                </div>
                <StatusBadge status={worker.status} type="employee" />
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Cluster Tasks</h3>
            <Link href="/assistant/tasks" id="link-all-tasks"
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <Link key={task.id} href={`/assistant/tasks/${task.id}`}
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
                  <p className="text-xs text-muted-foreground">{formatDate(task.taskDate)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{task._count.assignments}/{task.requiredWorkerCount}</p>
                  <p className="text-[10px] text-muted-foreground">workers</p>
                </div>
              </Link>
            ))}
            {tasks.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No tasks assigned to this cluster.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
