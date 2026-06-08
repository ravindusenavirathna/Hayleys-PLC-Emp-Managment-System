import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/shared/StatCard";
import {
  Users,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Warehouse,
  Layers,
  UserPlus,
  Activity,
} from "lucide-react";
import AdminTasksByWarehouseChart from "./TasksByWarehouseChart";
import AdminTasksByClientChart from "./TasksByClientChart";
import AdminRecentAuditLogs from "./RecentAuditLogs";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  // Fetch all KPI data in parallel
  const [
    totalEmployees,
    activeEmployees,
    totalWarehouses,
    totalClusters,
    activeTasks,
    completedToday,
    pendingAllocation,
    adhocToday,
    tasksByWarehouse,
    tasksByClient,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { status: "free", isActive: true } }),
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.cluster.count({ where: { isActive: true } }),
    prisma.task.count({
      where: { status: { in: ["in_progress", "ready_to_start", "scheduled"] } },
    }),
    prisma.task.count({
      where: {
        status: { in: ["completed", "verified", "closed"] },
        taskDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.task.count({ where: { status: "worker_allocation_pending" } }),
    prisma.taskAssignment.count({
      where: {
        workerType: "adhoc",
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Tasks by warehouse
    prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            tasks: {
              where: { status: { notIn: ["cancelled"] } },
            },
          },
        },
      },
    }),
    // Tasks by client
    prisma.client.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            tasks: { where: { status: { notIn: ["cancelled"] } } },
          },
        },
      },
      orderBy: { tasks: { _count: "desc" } },
      take: 8,
    }),
    // Recent audit logs
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            System overview — {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees.toLocaleString()}
          subtitle={`${activeEmployees} currently free`}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Warehouses"
          value={totalWarehouses}
          subtitle={`${totalClusters} clusters total`}
          icon={Warehouse}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          subtitle="In progress or ready"
          icon={Activity}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          subtitle="Completed / verified / closed"
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Allocation Pending"
          value={pendingAllocation}
          subtitle="Tasks needing workers"
          icon={AlertTriangle}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Ad-hoc Today"
          value={adhocToday}
          subtitle="Temporary workers hired"
          icon={UserPlus}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatCard
          title="Total Clusters"
          value={totalClusters}
          subtitle="Across all warehouses"
          icon={Layers}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatCard
          title="All Tasks"
          value={activeTasks + completedToday}
          subtitle="Active + completed today"
          icon={ClipboardList}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminTasksByWarehouseChart data={tasksByWarehouse.map(w => ({
          name: w.name,
          tasks: w._count.tasks,
        }))} />
        <AdminTasksByClientChart data={tasksByClient.map(c => ({
          name: c.code,
          tasks: c._count.tasks,
        }))} />
      </div>

      {/* Recent Audit Logs */}
      <AdminRecentAuditLogs logs={recentAuditLogs} />
    </div>
  );
}
