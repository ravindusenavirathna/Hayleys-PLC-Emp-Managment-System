import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/helpers";
import { MapPin, Clock, Briefcase, Layers, CheckCircle, Loader2 } from "lucide-react";
import MarkDoneButton from "./MarkDoneButton";

export const metadata: Metadata = { title: "My Task" };

export default async function WorkerDashboardPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["permanent_worker", "adhoc_worker"])) redirect("/");

  // Find the worker's employee record
  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
  });

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No employee profile found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please contact your supervisor or administrator.
          </p>
        </div>
      </div>
    );
  }

  // Find current active task assignment
  const activeAssignment = await prisma.taskAssignment.findFirst({
    where: {
      employeeId: employee.id,
      status: { in: ["assigned", "accepted", "working"] },
    },
    include: {
      task: {
        include: {
          warehouse: { select: { name: true } },
          cluster: { select: { name: true } },
          client: { select: { name: true, code: true } },
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          equipmentType: { select: { name: true } },
          supervisor: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activeAssignment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Welcome, {employee.name}</h1>
          <p className="page-subtitle">Permanent Worker · {employee.employeeCode}</p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No active task assigned</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
            You are currently <strong className="text-emerald-600">free</strong>.
            A supervisor will assign you to a task when needed.
          </p>
          <div className="mt-6 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <p className="text-xs font-semibold text-emerald-700">Status: Free ✓</p>
          </div>
        </div>
      </div>
    );
  }

  const task = activeAssignment.task;
  const isAdhoc = user.role.name === "adhoc_worker";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Active Task</h1>
        <p className="page-subtitle">
          {employee.name} · {employee.employeeCode} ·{" "}
          {isAdhoc ? "Ad-hoc Worker" : "Permanent Worker"}
        </p>
      </div>

      {/* Task Card */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block text-indigo-200 text-xs font-medium mb-2">
                {task.taskNumber}
              </span>
              <h2 className="text-white text-xl font-bold">
                {task.category.name} — {task.subCategory.name}
              </h2>
              <p className="text-indigo-200 text-sm mt-1">{task.client.code}</p>
            </div>
            <StatusBadge status={activeAssignment.status} type="assignment" size="md" />
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{task.warehouse.name}</p>
              <p className="text-xs text-muted-foreground">{task.cluster.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Schedule</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(task.taskDate)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(task.startTime)} — {formatTime(task.endTime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Equipment</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {task.equipmentQuantity} × {task.equipmentType.name}
              </p>
            </div>
          </div>

          {task.supervisor && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supervisor</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{task.supervisor.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mark Done Action */}
        {activeAssignment.status !== "marked_done" && (
          <div className="px-6 pb-6">
            <div className="border-t border-border pt-5">
              <p className="text-sm text-muted-foreground mb-4">
                When you have completed your work, click the button below to mark this task as done.
                Your supervisor will verify your completion.
              </p>
              <MarkDoneButton
                assignmentId={activeAssignment.id}
                employeeId={employee.id}
              />
            </div>
          </div>
        )}

        {activeAssignment.status === "marked_done" && (
          <div className="px-6 pb-6">
            <div className="border-t border-border pt-5">
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Waiting for verification</p>
                  <p className="text-xs text-amber-700">
                    You have marked this task as done. Your supervisor or assistant will verify shortly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isAdhoc && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800">Ad-hoc Worker Notice</p>
          <p className="text-xs text-orange-700 mt-1">
            Your access will be automatically deactivated after this task is completed and verified.
          </p>
        </div>
      )}
    </div>
  );
}
