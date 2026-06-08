import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Clusters" };

export default async function AdminClustersPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const clusters = await prisma.cluster.findMany({
    include: {
      warehouse: { select: { name: true, code: true } },
      _count: {
        select: {
          employees: { where: { isActive: true } },
          tasks: { where: { status: { notIn: ["cancelled", "closed"] } } },
        },
      },
    },
    orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clusters</h1>
          <p className="page-subtitle">{clusters.length} clusters across all warehouses</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {["Cluster", "Warehouse", "Code", "Employees", "Active Tasks", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clusters.map((cluster) => (
                <tr key={cluster.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{cluster.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cluster.warehouse.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {cluster.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{cluster._count.employees}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{cluster._count.tasks}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      cluster.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      {cluster.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
