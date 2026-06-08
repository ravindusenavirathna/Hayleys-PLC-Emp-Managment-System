import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Warehouse } from "lucide-react";

export const metadata: Metadata = { title: "Warehouses" };

export default async function AdminWarehousesPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const warehouses = await prisma.warehouse.findMany({
    include: {
      _count: {
        select: {
          clusters: true,
          employees: { where: { isActive: true } },
          tasks: { where: { status: { notIn: ["cancelled", "closed"] } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouses</h1>
          <p className="page-subtitle">{warehouses.length} warehouses in the system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{warehouse.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{warehouse.code}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                warehouse.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}>
                {warehouse.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {warehouse.description && (
              <p className="text-sm text-muted-foreground mb-4">{warehouse.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xl font-bold text-foreground tabular-nums">{warehouse._count.clusters}</p>
                <p className="text-xs text-muted-foreground">Clusters</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xl font-bold text-foreground tabular-nums">{warehouse._count.employees}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xl font-bold text-foreground tabular-nums">{warehouse._count.tasks}</p>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
