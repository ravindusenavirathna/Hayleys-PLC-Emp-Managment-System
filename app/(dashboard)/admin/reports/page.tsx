import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import ReportsCharts from "./ReportsCharts";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "team_leader"])) redirect("/");

  const isAdmin = user.role.name === "admin";
  const warehouseFilter = isAdmin ? {} : { warehouseId: user.warehouseId! };

  const [
    tasksByStatus,
    tasksByCategory,
    tasksByClient,
    adhocUsage,
    workerUtilization,
  ] = await Promise.all([
    // Tasks by status
    prisma.task.groupBy({
      by: ["status"],
      where: warehouseFilter,
      _count: { id: true },
    }),
    // Tasks by category
    prisma.task.groupBy({
      by: ["categoryId"],
      where: warehouseFilter,
      _count: { id: true },
    }),
    // Tasks by client
    prisma.task.groupBy({
      by: ["clientId"],
      where: warehouseFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    // Ad-hoc usage (last 7 days)
    prisma.taskAssignment.count({
      where: {
        workerType: "adhoc",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Worker utilization
    prisma.employee.groupBy({
      by: ["status"],
      where: { isActive: true, employeeType: "permanent" },
      _count: { id: true },
    }),
  ]);

  // Get categories and clients for labels
  const [categories, clients] = await Promise.all([
    prisma.taskCategory.findMany(),
    prisma.client.findMany(),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.code]));

  const chartData = {
    tasksByStatus: tasksByStatus.map((t) => ({
      name: t.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: t._count?.id || 0,
    })),
    tasksByCategory: tasksByCategory.map((t) => ({
      name: categoryMap[t.categoryId] ?? t.categoryId,
      value: t._count?.id || 0,
    })),
    tasksByClient: tasksByClient.map((t) => ({
      name: clientMap[t.clientId] ?? t.clientId,
      value: t._count?.id || 0,
    })),
    workerUtilization: workerUtilization.map((w) => ({
      name: w.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: w._count?.id || 0,
    })),
    adhocUsage,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            {isAdmin ? "System-wide analytics" : `${user.warehouse?.name} warehouse analytics`}
          </p>
        </div>
      </div>

      <ReportsCharts data={chartData} />
    </div>
  );
}
