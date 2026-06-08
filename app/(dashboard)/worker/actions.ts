"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { logWorkerAction } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";

export async function markWorkerDoneAction({
  assignmentId,
  employeeId,
}: {
  assignmentId: string;
  employeeId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verify this assignment belongs to this employee
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        id: assignmentId,
        employeeId,
        status: { in: ["assigned", "accepted", "working"] },
      },
      include: { task: true },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found or already marked done." };
    }

    const now = new Date();

    // Update assignment status
    await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "marked_done",
        markedDoneAt: now,
      },
    });

    // Update employee status to marked_done
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: "marked_done" },
    });

    // Check if ALL workers in this task have marked done
    const pendingAssignments = await prisma.taskAssignment.count({
      where: {
        taskId: assignment.taskId,
        status: { in: ["assigned", "accepted", "working"] },
      },
    });

    if (pendingAssignments === 0) {
      // All workers done — automatically move task to "completed"
      await prisma.task.update({
        where: { id: assignment.taskId },
        data: {
          status: "completed",
          actualEndTime: now,
        },
      });

      await prisma.taskStatusHistory.create({
        data: {
          taskId: assignment.taskId,
          fromStatus: "in_progress",
          toStatus: "completed",
          changedBy: user.id,
          reason: "All workers marked task as done",
        },
      });
    }

    // Audit log
    await logWorkerAction(
      user.id,
      "worker_marked_done",
      employeeId,
      assignment.taskId,
      { status: assignment.status },
      { status: "marked_done", markedDoneAt: now.toISOString() }
    );

    revalidatePath("/worker");
    revalidatePath("/assistant");
    revalidatePath("/supervisor");

    return { success: true };
  } catch (error: any) {
    console.error("[markWorkerDoneAction]", error);
    return { success: false, error: error.message ?? "Failed to mark task as done" };
  }
}
