"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AllocationService } from "@/services/allocation.service";

export async function autoAllocateTaskAction(taskId: string, supervisorId: string) {
  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: { cluster: true },
    });

    // 1. Get suggestions
    const suggestion = await AllocationService.suggestAllocation(
      task.warehouseId,
      task.clusterId,
      task.taskDate,
      task.startTime,
      task.endTime,
      task.requiredWorkerCount
    );

    // Get an array of IDs
    const sameClusterIds = suggestion.sameClusterWorkers;
    const borrowedIds = suggestion.borrowedWorkers;
    
    const adhocIds: string[] = [];

    // 2. Execute allocation
    await AllocationService.executeAllocation(
      task.id,
      sameClusterIds,
      borrowedIds,
      adhocIds,
      task.clusterId,
      task.warehouseId,
      task.startTime,
      task.endTime,
      supervisorId
    );

    revalidatePath("/supervisor");
    revalidatePath("/supervisor/allocation");
    return { success: true };
  } catch (error: any) {
    console.error("[AutoAllocate] Error:", error);
    return { success: false, error: error.message || "Failed to execute auto-allocation" };
  }
}
