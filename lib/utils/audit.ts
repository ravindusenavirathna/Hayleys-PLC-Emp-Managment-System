import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface CreateAuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  taskId?: string;
}

/**
 * Write an audit log entry to the database.
 * This should be called for all important user actions.
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: (params.oldValue as any) ?? undefined,
        newValue: (params.newValue as any) ?? undefined,
        ipAddress: params.ipAddress,
        taskId: params.taskId,
      },
    });
  } catch (error) {
    // Never let audit log failures break main operations
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

/**
 * Shorthand to log a task-related action.
 */
export async function logTaskAction(
  userId: string,
  action: AuditAction,
  taskId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: "task",
    entityId: taskId,
    oldValue,
    newValue,
    taskId,
  });
}

/**
 * Shorthand to log a user action.
 */
export async function logUserAction(
  userId: string,
  action: AuditAction,
  targetUserId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: "user",
    entityId: targetUserId,
    oldValue,
    newValue,
  });
}

/**
 * Shorthand to log a worker/employee action.
 */
export async function logWorkerAction(
  userId: string,
  action: AuditAction,
  employeeId: string,
  taskId?: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: "employee",
    entityId: employeeId,
    oldValue,
    newValue,
    taskId,
  });
}
