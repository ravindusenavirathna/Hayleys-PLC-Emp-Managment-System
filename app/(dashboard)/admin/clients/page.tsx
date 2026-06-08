import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const user = await getSessionUser();
  if (!hasRole(user, "admin")) redirect("/");

  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} active clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{client.code.charAt(0)}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                client.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}>
                {client.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <h3 className="font-bold text-foreground text-lg">{client.code}</h3>
            <p className="text-sm text-muted-foreground">{client.name}</p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{client._count.tasks}</span> total tasks
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
