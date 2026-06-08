import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/helpers";
import Link from "next/link";
import { Calendar, Clock, Users, ArrowLeft, Building2, User, FileText } from "lucide-react";

export const metadata: Metadata = { title: "Task Details" };

interface PageProps {
  params: { id: string };
}

export default async function AdminTaskDetailPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      warehouse: true,
      cluster: true,
      client: true,
      category: true,
      subCategory: true,
      equipmentType: true,
      createdBy: { select: { name: true, email: true } },
      supervisor: { select: { name: true, email: true } },
      assignments: {
        include: {
          employee: true,
        },
      },
    },
  });

  if (!task) notFound();

  const allocatedCount = task.assignments.length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tasks list
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
              {task.taskNumber}
            </span>
            <StatusBadge status={task.status} type="task" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {task.client.name} — {task.category.name} ({task.subCategory.name})
          </h1>
          <p className="text-sm text-muted-foreground">
            📍 {task.warehouse.name} Warehouse · {task.cluster.name}
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 md:border-l border-border md:pl-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Allocation Status</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-foreground">{allocatedCount}</span>
              <span className="text-sm text-muted-foreground">/ {task.requiredWorkerCount} Workers</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allocatedCount >= task.requiredWorkerCount ? "✅ Fully Allocated" : "⚠️ Needs Allocation"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Specs */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 border-b border-border pb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              Task Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Equipment Type</p>
                <p className="font-medium text-foreground mt-0.5">{task.equipmentType.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipment Quantity</p>
                <p className="font-medium text-foreground mt-0.5">{task.equipmentQuantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled Date</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(task.taskDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shift Time</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatTime(task.startTime)} - {formatTime(task.endTime)}
                </p>
              </div>
            </div>
            {task.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Notes / Special Instructions</p>
                <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {task.notes}
                </p>
              </div>
            )}
          </div>

          {/* Allocated Workers Table */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold">Allocated Workforce</h3>
            </div>
            <div className="overflow-x-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {task.assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        No workers allocated to this task yet.
                      </td>
                    </tr>
                  ) : (
                    task.assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs font-semibold">
                          {assignment.employee.employeeCode}
                        </td>
                        <td className="px-6 py-3 font-medium text-foreground">
                          {assignment.employee.name}
                        </td>
                        <td className="px-6 py-3 capitalize">
                          {assignment.workerType}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={assignment.status} type="assignment" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column — Administration & Timeline */}
        <div className="space-y-6">
          {/* Supervision Card */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 border-b border-border pb-3">
              <User className="w-4 h-4 text-slate-500" />
              Task Leadership
            </h3>
            <div>
              <p className="text-xs text-muted-foreground">Assigned Supervisor</p>
              {task.supervisor ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-700">
                    {task.supervisor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.supervisor.name}</p>
                    <p className="text-[10px] text-muted-foreground">{task.supervisor.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-1 italic">No supervisor assigned yet</p>
              )}
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">Created By</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                  {task.createdBy.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{task.createdBy.name}</p>
                  <p className="text-[10px] text-muted-foreground">{task.createdBy.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse Context */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 border-b border-border pb-3">
              <Building2 className="w-4 h-4 text-slate-500" />
              Operational Area
            </h3>
            <div>
              <p className="text-xs text-muted-foreground">Warehouse Code</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{task.warehouse.code}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cluster Code</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{task.cluster.code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
