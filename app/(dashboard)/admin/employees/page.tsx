import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { getEmployeeStatusLabel } from "@/lib/utils/helpers";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export const metadata: Metadata = { title: "Employees" };

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: { page?: string; cluster?: string; status?: string; type?: string };
}) {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 25;

  const where: any = { isActive: true };
  if (searchParams.cluster) where.homeClusterId = searchParams.cluster;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.type) where.employeeType = searchParams.type;

  const [employees, total, clusters] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        homeWarehouse: { select: { name: true } },
        homeCluster: { select: { name: true, code: true } },
        user: { select: { email: true } },
      },
      orderBy: [{ homeClusterId: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
    prisma.cluster.findMany({
      where: { isActive: true },
      include: { warehouse: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const employeeStatuses = ["free", "assigned", "working", "marked_done", "released", "unavailable", "on_leave", "inactive"];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{total.toLocaleString()} employees across all clusters</p>
        </div>
        <button
          id="btn-add-employee"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <select name="cluster" defaultValue={searchParams.cluster ?? ""}
          id="filter-cluster"
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Clusters</option>
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.warehouse.name} — {c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={searchParams.status ?? ""}
          id="filter-status"
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Statuses</option>
          {employeeStatuses.map((s) => (
            <option key={s} value={s}>{getEmployeeStatusLabel(s)}</option>
          ))}
        </select>
        <select name="type" defaultValue={searchParams.type ?? ""}
          id="filter-type"
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Types</option>
          <option value="permanent">Permanent</option>
          <option value="adhoc">Ad-hoc</option>
        </select>
        <button type="submit" id="btn-apply-filters"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Apply
        </button>
        <Link href="/admin/employees" id="btn-clear-filters"
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Clear
        </Link>
      </form>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {["Employee", "Code", "Home Warehouse", "Home Cluster", "Type", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 text-xs font-semibold">
                          {emp.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        {emp.user?.email && (
                          <p className="text-[10px] text-muted-foreground">{emp.user.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {emp.employeeCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{emp.homeWarehouse.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{emp.homeCluster.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      emp.employeeType === "permanent"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}>
                      {emp.employeeType === "permanent" ? "Permanent" : "Ad-hoc"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={emp.status} type="employee" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/employees?page=${page - 1}&cluster=${searchParams.cluster ?? ""}&status=${searchParams.status ?? ""}&type=${searchParams.type ?? ""}`}
                  id="btn-prev-page"
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">Previous</Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/employees?page=${page + 1}&cluster=${searchParams.cluster ?? ""}&status=${searchParams.status ?? ""}&type=${searchParams.type ?? ""}`}
                  id="btn-next-page"
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
