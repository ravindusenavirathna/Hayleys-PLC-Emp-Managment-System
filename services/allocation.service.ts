import { prisma } from "@/lib/prisma";
import type { EmployeeStatus } from "@prisma/client";

interface WorkerAvailabilityResult {
  sameClusterFree: {
    id: string;
    name: string;
    employeeCode: string;
    status: EmployeeStatus;
  }[];
  otherClustersFree: {
    id: string;
    name: string;
    employeeCode: string;
    homeClusterId: string;
    homeClusterName: string;
    status: EmployeeStatus;
  }[];
  sameClusterCount: number;
  otherClustersCount: number;
  totalAvailablePermanent: number;
}

interface AllocationSuggestion {
  sameClusterWorkers: string[]; // employee IDs
  borrowedWorkers: string[]; // employee IDs
  adhocNeeded: number;
  summary: {
    required: number;
    fromSameCluster: number;
    fromOtherClusters: number;
    adhoc: number;
  };
}

/**
 * THE CORE ALLOCATION SERVICE
 *
 * Implements the worker allocation priority:
 * 1. Same-cluster permanent workers (free)
 * 2. Other-cluster permanent workers in same warehouse (free)
 * 3. Ad-hoc workers (only if still short)
 */
export class AllocationService {
  /**
   * Get available workers for a task, organized by cluster priority.
   */
  static async getWorkerAvailability(
    warehouseId: string,
    clusterId: string,
    taskDate: Date,
    startTime: Date,
    endTime: Date
  ): Promise<WorkerAvailabilityResult> {
    // Find all workers already booked in this time window
    const bookedWorkerIds = await this.getBookedWorkerIds(
      taskDate,
      startTime,
      endTime
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. Same-cluster free permanent workers
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const sameClusterFree = await prisma.employee.findMany({
      where: {
        homeClusterId: clusterId,
        employeeType: "permanent",
        status: "free",
        isActive: true,
        id: { notIn: bookedWorkerIds },
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Other-cluster free permanent workers in same warehouse
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const otherClustersFree = await prisma.employee.findMany({
      where: {
        homeWarehouseId: warehouseId,
        homeClusterId: { not: clusterId },
        employeeType: "permanent",
        status: "free",
        isActive: true,
        id: { notIn: bookedWorkerIds },
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        homeClusterId: true,
        status: true,
        homeCluster: { select: { name: true } },
      },
      orderBy: [{ homeClusterId: "asc" }, { name: "asc" }],
    });

    return {
      sameClusterFree,
      otherClustersFree: otherClustersFree.map((e) => ({
        id: e.id,
        name: e.name,
        employeeCode: e.employeeCode,
        homeClusterId: e.homeClusterId,
        homeClusterName: e.homeCluster.name,
        status: e.status,
      })),
      sameClusterCount: sameClusterFree.length,
      otherClustersCount: otherClustersFree.length,
      totalAvailablePermanent:
        sameClusterFree.length + otherClustersFree.length,
    };
  }

  /**
   * Auto-suggest the optimal worker allocation for a task.
   * Follows the priority order:
   * 1. Same-cluster → 2. Other clusters → 3. Ad-hoc
   */
  static async suggestAllocation(
    warehouseId: string,
    clusterId: string,
    taskDate: Date,
    startTime: Date,
    endTime: Date,
    requiredCount: number
  ): Promise<AllocationSuggestion> {
    const availability = await this.getWorkerAvailability(
      warehouseId,
      clusterId,
      taskDate,
      startTime,
      endTime
    );

    let remaining = requiredCount;
    const sameClusterWorkers: string[] = [];
    const borrowedWorkers: string[] = [];

    // Step 1: Take from same cluster
    const sameClusterTake = Math.min(
      remaining,
      availability.sameClusterFree.length
    );
    for (let i = 0; i < sameClusterTake; i++) {
      sameClusterWorkers.push(availability.sameClusterFree[i].id);
    }
    remaining -= sameClusterTake;

    // Step 2: Borrow from other clusters
    if (remaining > 0) {
      const otherClusterTake = Math.min(
        remaining,
        availability.otherClustersFree.length
      );
      for (let i = 0; i < otherClusterTake; i++) {
        borrowedWorkers.push(availability.otherClustersFree[i].id);
      }
      remaining -= otherClusterTake;
    }

    // Step 3: Ad-hoc count needed
    const adhocNeeded = Math.max(0, remaining);

    return {
      sameClusterWorkers,
      borrowedWorkers,
      adhocNeeded,
      summary: {
        required: requiredCount,
        fromSameCluster: sameClusterWorkers.length,
        fromOtherClusters: borrowedWorkers.length,
        adhoc: adhocNeeded,
      },
    };
  }

  /**
   * Check if a specific worker is double-booked in a time window.
   */
  static async isWorkerAvailable(
    employeeId: string,
    taskDate: Date,
    startTime: Date,
    endTime: Date,
    excludeTaskId?: string
  ): Promise<boolean> {
    const conflict = await prisma.taskAssignment.findFirst({
      where: {
        employeeId,
        status: {
          in: ["assigned", "accepted", "working"],
        },
        task: {
          taskDate: { equals: taskDate },
          id: excludeTaskId ? { not: excludeTaskId } : undefined,
          status: {
            notIn: ["cancelled", "closed"],
          },
        },
        AND: [
          { assignmentStartTime: { lt: endTime } },
          { assignmentEndTime: { gt: startTime } },
        ],
      },
    });

    return !conflict;
  }

  /**
   * Get IDs of all workers currently booked in a time window.
   */
  private static async getBookedWorkerIds(
    taskDate: Date,
    startTime: Date,
    endTime: Date
  ): Promise<string[]> {
    const bookedAssignments = await prisma.taskAssignment.findMany({
      where: {
        status: { in: ["assigned", "accepted", "working"] },
        task: {
          taskDate: { equals: taskDate },
          status: { notIn: ["cancelled", "closed"] },
        },
        AND: [
          { assignmentStartTime: { lt: endTime } },
          { assignmentEndTime: { gt: startTime } },
        ],
      },
      select: { employeeId: true },
    });

    return Array.from(new Set(bookedAssignments.map((a) => a.employeeId)));
  }

  /**
   * Execute the worker allocation for a task.
   * Creates task assignments and worker movement records for borrowed workers.
   */
  static async executeAllocation(
    taskId: string,
    sameClusterWorkerIds: string[],
    borrowedWorkerIds: string[],
    adhocWorkerIds: string[],
    assignedClusterId: string,
    assignedWarehouseId: string,
    startTime: Date,
    endTime: Date,
    createdById: string
  ): Promise<void> {
    // Get task details
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: { cluster: true, warehouse: true },
    });

    // Process same-cluster workers
    for (const employeeId of sameClusterWorkerIds) {
      const employee = await prisma.employee.findUniqueOrThrow({
        where: { id: employeeId },
        include: { homeCluster: true },
      });

      await prisma.taskAssignment.create({
        data: {
          taskId,
          employeeId,
          workerType: "permanent",
          originalWarehouseId: employee.homeWarehouseId,
          originalClusterId: employee.homeClusterId,
          assignedWarehouseId,
          assignedClusterId,
          isBorrowed: false,
          assignmentStartTime: startTime,
          assignmentEndTime: endTime,
          status: "assigned",
          createdById,
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "assigned" },
      });
    }

    // Process borrowed workers
    for (const employeeId of borrowedWorkerIds) {
      const employee = await prisma.employee.findUniqueOrThrow({
        where: { id: employeeId },
      });

      await prisma.taskAssignment.create({
        data: {
          taskId,
          employeeId,
          workerType: "permanent",
          originalWarehouseId: employee.homeWarehouseId,
          originalClusterId: employee.homeClusterId,
          assignedWarehouseId,
          assignedClusterId,
          isBorrowed: true,
          assignmentStartTime: startTime,
          assignmentEndTime: endTime,
          status: "assigned",
          createdById,
        },
      });

      // Create movement record
      await prisma.workerMovement.create({
        data: {
          employeeId,
          taskId,
          fromWarehouseId: employee.homeWarehouseId,
          fromClusterId: employee.homeClusterId,
          toWarehouseId: assignedWarehouseId,
          toClusterId: assignedClusterId,
          isActive: true,
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "assigned" },
      });
    }

    // Process ad-hoc workers
    for (const employeeId of adhocWorkerIds) {
      const employee = await prisma.employee.findUniqueOrThrow({
        where: { id: employeeId },
      });

      await prisma.taskAssignment.create({
        data: {
          taskId,
          employeeId,
          workerType: "adhoc",
          originalWarehouseId: assignedWarehouseId,
          originalClusterId: assignedClusterId,
          assignedWarehouseId,
          assignedClusterId,
          isBorrowed: false,
          assignmentStartTime: startTime,
          assignmentEndTime: endTime,
          status: "assigned",
          createdById,
        },
      });

      await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "assigned", isActive: true },
      });
    }
  }

  /**
   * Release all workers from a completed task.
   * Permanent workers go back to "free". Borrowed workers return to original cluster.
   * Ad-hoc workers become "inactive".
   */
  static async releaseWorkers(taskId: string): Promise<void> {
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        taskId,
        status: { in: ["assigned", "accepted", "working", "marked_done", "verified_done"] },
      },
      include: { employee: true },
    });

    for (const assignment of assignments) {
      const now = new Date();

      await prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: { status: "released", releasedAt: now },
      });

      if (assignment.workerType === "adhoc") {
        // Ad-hoc workers become inactive after task
        await prisma.employee.update({
          where: { id: assignment.employeeId },
          data: { status: "inactive", isActive: false },
        });
      } else {
        // Permanent workers go back to free
        await prisma.employee.update({
          where: { id: assignment.employeeId },
          data: { status: "free" },
        });

        // Close any active movement records
        if (assignment.isBorrowed) {
          await prisma.workerMovement.updateMany({
            where: {
              employeeId: assignment.employeeId,
              taskId,
              isActive: true,
            },
            data: { returnedAt: now, isActive: false },
          });
        }
      }
    }
  }
}
