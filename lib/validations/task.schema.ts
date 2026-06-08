import { z } from "zod";

// ============================================================
// TASK SCHEMAS
// ============================================================

export const TaskStep1BaseSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  clusterId: z.string().min(1, "Cluster is required"),
  taskDate: z.string().min(1, "Task date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export const TaskStep1Schema = TaskStep1BaseSchema.refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

export const TaskStep2Schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().min(1, "Sub-category is required"),
  equipmentTypeId: z.string().min(1, "Equipment type is required"),
  equipmentQuantity: z
    .number({ invalid_type_error: "Must be a number" })
    .min(1, "Quantity must be at least 1")
    .max(9999),
  notes: z.string().max(500).optional(),
});

export const TaskStep3Schema = z.object({
  requiredWorkerCount: z
    .number({ invalid_type_error: "Must be a number" })
    .min(1, "At least 1 worker required")
    .max(1000),
});

export const TaskStep4Schema = z.object({
  supervisorId: z.string().optional(),
  selectedWorkerIds: z.array(z.string()).default([]),
  adhocWorkerCount: z.number().min(0).default(0),
});

export const TaskCreateSchema = z.object({
  ...TaskStep1BaseSchema.shape,
  ...TaskStep2Schema.shape,
  ...TaskStep3Schema.shape,
  ...TaskStep4Schema.shape,
});

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type TaskStep1Input = z.infer<typeof TaskStep1Schema>;
export type TaskStep2Input = z.infer<typeof TaskStep2Schema>;
export type TaskStep3Input = z.infer<typeof TaskStep3Schema>;
export type TaskStep4Input = z.infer<typeof TaskStep4Schema>;

export const TaskUpdateSchema = z.object({
  status: z
    .enum([
      "draft",
      "scheduled",
      "worker_allocation_pending",
      "ready_to_start",
      "in_progress",
      "partially_completed",
      "completed",
      "verified",
      "closed",
      "cancelled",
    ])
    .optional(),
  supervisorId: z.string().optional(),
  notes: z.string().max(500).optional(),
  actualStartTime: z.string().datetime().optional(),
  actualEndTime: z.string().datetime().optional(),
});
