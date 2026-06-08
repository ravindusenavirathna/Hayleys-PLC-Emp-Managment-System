import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils/helpers";
import AllocateButton from "./AllocateButton";
import { Users, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Workforce Allocation" };

export default async function SupervisorAllocationPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "supervisor")) redirect("/");
  if (!user.warehouseId) redirect("/login");

  // Fetch tasks in this warehouse needing allocation
  const tasksNeedingAllocation = await prisma.task.findMany({
    where: {
      warehouseId: user.warehouseId,
      status: "worker_allocation_pending",
    },
    include: {
      cluster: true,
      client: true,
      category: true,
      subCategory: true,
    },
    orderBy: { taskDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workforce Allocation</h1>
          <p className="page-subtitle">Allocate available permanent and borrowed workers to scheduled tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Tasks Pending Workforce Allocation
        </h3>

        {tasksNeedingAllocation.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <p className="text-sm font-medium">All tasks are currently allocated!</p>
            <p className="text-xs">No tasks are pending worker assignments at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasksNeedingAllocation.map((task) => (
              <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {task.taskNumber}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      📍 {task.cluster.name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {task.client.name} — {task.category.name} / {task.subCategory.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    📅 {formatDate(task.taskDate)} · ⏰ {formatTime(task.startTime)} - {formatTime(task.endTime)}
                  </p>
                  <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Required: {task.requiredWorkerCount} Workers
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <AllocateButton taskId={task.id} supervisorId={user.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
