import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/StatusBadge";
import { getRoleDisplayName } from "@/lib/utils/helpers";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";

export const metadata: Metadata = { title: "Users & Roles" };

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        role: { select: { name: true, displayName: true } },
        warehouse: { select: { name: true } },
        cluster: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  const roleCounts = roles.map((r) => ({
    ...r,
    count: users.filter((u) => u.roleId === r.id).length,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">{users.length} users across {roles.length} roles</p>
        </div>
        <button
          id="btn-create-user"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {roleCounts.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <p className="text-2xl font-bold text-foreground tabular-nums">{role.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{role.displayName}s</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="data-table-wrapper">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <UserCog className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                {["Name", "Email", "Role", "Warehouse", "Cluster", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {u.role.displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {u.warehouse?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {u.cluster?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {u.isActive ? "Active" : "Inactive"}
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
