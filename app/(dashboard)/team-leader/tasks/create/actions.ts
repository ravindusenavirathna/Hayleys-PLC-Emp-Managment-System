"use server";

import { prisma } from "@/lib/prisma";
import { TaskService } from "@/services/task.service";
import { revalidatePath } from "next/cache";
import type { TaskFormData } from "./TaskCreateWizard";
import { z } from "zod";

export async function createTaskAction(
  input: TaskFormData & { createdById: string }
): Promise<{ success: boolean; taskNumber?: string; error?: string }> {
  try {
    const task = await TaskService.createTask(
      {
        warehouseId: input.warehouseId,
        clusterId: input.clusterId,
        taskDate: input.taskDate,
        startTime: input.startTime,
        endTime: input.endTime,
        clientId: input.clientId,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        equipmentTypeId: input.equipmentTypeId,
        equipmentQuantity: input.equipmentQuantity,
        requiredWorkerCount: input.requiredWorkerCount,
        supervisorId: input.supervisorId,
        notes: input.notes,
        selectedWorkerIds: [
          ...(input.selectedSameClusterWorkerIds ?? []),
          ...(input.selectedBorrowedWorkerIds ?? []),
        ],
        adhocWorkerCount: input.adhocWorkerCount,
      },
      input.createdById,
      input.selectedSameClusterWorkerIds ?? [],
      input.selectedBorrowedWorkerIds ?? [],
      input.adhocWorkerCount ?? 0
    );

    revalidatePath("/team-leader/tasks");
    revalidatePath("/team-leader");
    revalidatePath("/admin/tasks");

    return { success: true, taskNumber: task.taskNumber };
  } catch (error: any) {
    console.error("[createTaskAction]", error);
    return { success: false, error: error.message ?? "Failed to create task" };
  }
}
