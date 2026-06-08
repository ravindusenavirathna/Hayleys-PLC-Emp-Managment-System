import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import TaskCreateWizard from "./TaskCreateWizard";

export const metadata: Metadata = { title: "Create Task" };

export default async function CreateTaskPage() {
  const user = await getSessionUser();
  if (!hasRole(user, ["admin", "team_leader"])) redirect("/");

  if (!user.warehouseId) redirect("/team-leader");

  // Fetch all form reference data server-side
  const [warehouse, clusters, clients, categories, equipmentTypes, supervisors] =
    await Promise.all([
      prisma.warehouse.findUnique({
        where: { id: user.warehouseId! },
        include: {
          clusters: { where: { isActive: true }, orderBy: { name: "asc" } },
        },
      }),
      prisma.cluster.findMany({
        where: { warehouseId: user.warehouseId!, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.taskCategory.findMany({
        include: {
          subCategories: { orderBy: { name: "asc" } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.equipmentType.findMany({ orderBy: { name: "asc" } }),
      // Supervisors in this warehouse
      prisma.user.findMany({
        where: {
          warehouseId: user.warehouseId!,
          role: { name: "supervisor" },
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      }),
    ]);

  if (!warehouse) redirect("/team-leader");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Create New Task</h1>
        <p className="page-subtitle">
          {warehouse.name} Warehouse — Fill in all task details to schedule and allocate workers
        </p>
      </div>

      <TaskCreateWizard
        warehouseId={user.warehouseId!}
        warehouseName={warehouse.name}
        clusters={clusters}
        clients={clients}
        categories={categories}
        equipmentTypes={equipmentTypes}
        supervisors={supervisors}
        createdById={user.id}
      />
    </div>
  );
}
