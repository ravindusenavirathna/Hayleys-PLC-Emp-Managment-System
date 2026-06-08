import { prisma } from "@/lib/prisma";
import { AllocationService } from "./allocation.service";
import { logTaskAction } from "@/lib/utils/audit";
import { generateTaskNumber } from "@/lib/utils/helpers";
import type { TaskCreateInput } from "@/lib/validations/task.schema";
import type { TaskStatus } from "@prisma/client";

export class TaskService {
  /**
   * Create a new task from the multi-step form data.
   */
  static async createTask(
    input: TaskCreateInput,
    createdById: string,
    sameClusterWorkerIds: string[],
    borrowedWorkerIds: string[],
    adhocWorkerCount: number
  ) {
    // Generate a unique task number
    const taskCount = await prisma.task.count();
    const taskNumber = generateTaskNumber(taskCount + 1);

    const startTime = new Date(`${input.taskDate}T${input.startTime}:00`);
    const endTime = new Date(`${input.taskDate}T${input.endTime}:00`);

    const task = await prisma.task.create({
      data: {
        taskNumber,
        warehouseId: input.warehouseId,
        clusterId: input.clusterId,
        clientId: input.clientId,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        equipmentTypeId: input.equipmentTypeId,
        equipmentQuantity: input.equipmentQuantity,
        taskDate: new Date(input.taskDate),
        startTime,
        endTime,
        requiredWorkerCount: input.requiredWorkerCount,
        status: "scheduled",
        createdById,
        supervisorId: input.supervisorId || null,
        notes: input.notes || null,
      },
    });

    // Record initial status history
    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        fromStatus: null,
        toStatus: "scheduled",
        changedBy: createdById,
        reason: "Task created",
      },
    });

    // If workers were selected, allocate them
    if (
      sameClusterWorkerIds.length > 0 ||
      borrowedWorkerIds.length > 0
    ) {
      await AllocationService.executeAllocation(
        task.id,
        sameClusterWorkerIds,
        borrowedWorkerIds,
        [], // Ad-hoc workers don't have IDs yet — they're hired separately
        input.clusterId,
        input.warehouseId,
        startTime,
        endTime,
        createdById
      );

      // Update task status to ready_to_start if workers allocated
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "ready_to_start" },
      });

      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: "scheduled",
          toStatus: "ready_to_start",
          changedBy: createdById,
          reason: "Workers allocated",
        },
      });
    } else if (input.requiredWorkerCount > 0) {
      // Mark as allocation pending if workers needed but none assigned
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "worker_allocation_pending" },
      });

      await prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          fromStatus: "scheduled",
          toStatus: "worker_allocation_pending",
          changedBy: createdById,
          reason: "Workers not yet allocated",
        },
      });
    }

    // Audit log
    await logTaskAction(createdById, "task_created", task.id, null, {
      taskNumber,
      status: task.status,
    });

    return task;
  }

  /**
   * Update a task status with history tracking.
   */
  static async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    reason?: string
  ) {
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
    });

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId,
        fromStatus: task.status,
        toStatus: newStatus,
        changedBy: userId,
        reason,
      },
    });

    // If task is closed, release all workers
    if (newStatus === "closed") {
      await AllocationService.releaseWorkers(taskId);
    }

    await logTaskAction(
      userId,
      newStatus === "cancelled" ? "task_cancelled" :
      newStatus === "completed" ? "task_completed" :
      newStatus === "verified" ? "task_verified" :
      newStatus === "closed" ? "task_closed" :
      "task_updated",
      taskId,
      { status: task.status },
      { status: newStatus }
    );

    return updated;
  }

  /**
   * Get tasks with server-side pagination and filtering.
   */
  static async getTasks(params: {
    warehouseId?: string;
    clusterId?: string;
    status?: TaskStatus;
    clientId?: string;
    categoryId?: string;
    taskDate?: Date;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
      ...(params.clusterId && { clusterId: params.clusterId }),
      ...(params.status && { status: params.status }),
      ...(params.clientId && { clientId: params.clientId }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.taskDate && { taskDate: params.taskDate }),
      ...(params.search && {
        OR: [
          { taskNumber: { contains: params.search, mode: "insensitive" as const } },
          { notes: { contains: params.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          warehouse: { select: { name: true, code: true } },
          cluster: { select: { name: true, code: true } },
          client: { select: { name: true, code: true } },
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          equipmentType: { select: { name: true } },
          createdBy: { select: { name: true } },
          supervisor: { select: { name: true } },
          _count: { select: { assignments: true } },
        },
        orderBy: [{ taskDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single task with full details.
   */
  static async getTaskById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        warehouse: true,
        cluster: true,
        client: true,
        category: true,
        subCategory: true,
        equipmentType: true,
        createdBy: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true, email: true } },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true,
                employeeType: true,
                homeCluster: { select: { name: true } },
              },
            },
            originalCluster: { select: { name: true } },
            assignedCluster: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }
}
