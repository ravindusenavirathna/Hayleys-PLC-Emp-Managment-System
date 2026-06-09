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
    warehousesList,
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
    // List of active warehouses
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: "desc" } // Orders "Venus", then "Mercury"
    })
  ]);

  const warehouseStats = await Promise.all(
    warehousesList.map(async (wh) => {
      const [
        totalEmp,
        freeEmp,
        activeTsk,
        completedTsk,
        pendingAllocTsk,
        clustersList
      ] = await Promise.all([
        prisma.employee.count({ where: { homeWarehouseId: wh.id, isActive: true } }),
        prisma.employee.count({ where: { homeWarehouseId: wh.id, status: "free", isActive: true } }),
        prisma.task.count({
          where: { warehouseId: wh.id, status: { in: ["in_progress", "ready_to_start", "scheduled"] } }
        }),
        prisma.task.count({
          where: {
            warehouseId: wh.id,
            status: { in: ["completed", "verified", "closed"] },
            taskDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            }
          }
        }),
        prisma.task.count({ where: { warehouseId: wh.id, status: "worker_allocation_pending" } }),
        prisma.cluster.findMany({
          where: { warehouseId: wh.id, isActive: true },
          include: {
            _count: {
              select: {
                tasks: { where: { status: { in: ["in_progress", "ready_to_start"] } } },
                employees: { where: { status: "free", isActive: true } }
              }
            }
          }
        })
      ]);

      return {
        warehouse: wh,
        totalEmp,
        freeEmp,
        activeTsk,
        completedTsk,
        pendingAllocTsk,
        clustersList
      };
    })
  );

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

      {/* Warehouse Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Warehouse Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {warehouseStats.map(({ warehouse, totalEmp, freeEmp, activeTsk, completedTsk, pendingAllocTsk, clustersList }) => (
            <div key={warehouse.id} className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{warehouse.name} Warehouse</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Code: {warehouse.code} · {warehouse.description || ""}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700">
                  {clustersList.length} Clusters
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Active Tasks</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeTsk}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pendingAllocTsk} need allocation</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Completed Today</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{completedTsk}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Workforce Status</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{totalEmp}</span>
                    <span className="text-xs text-muted-foreground">Total Permanent Workers</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">● {freeEmp} currently free & available</p>
                </div>
              </div>

              {/* Clusters Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cluster Status</h4>
                <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/20 border-slate-100">
                  {clustersList.map(cluster => (
                    <div key={cluster.id} className="p-3 flex items-center justify-between text-sm bg-white hover:bg-slate-50/30 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800">{cluster.name}</p>
                        <p className="text-xs text-muted-foreground">Code: {cluster.code}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold text-indigo-600">{cluster._count.tasks}</p>
                          <p className="text-[10px] text-muted-foreground">active tasks</p>
                        </div>
                        <div className="border-l pl-4 border-slate-100">
                          <p className="font-bold text-emerald-600">{cluster._count.employees}</p>
                          <p className="text-[10px] text-muted-foreground">free workers</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
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
