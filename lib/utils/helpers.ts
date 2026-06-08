import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to display string.
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

/**
 * Format a datetime to display string.
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

/**
 * Format time only.
 */
export function formatTime(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "HH:mm");
}

/**
 * Format relative time (e.g., "2 hours ago").
 */
export function formatRelative(date: Date | string | null): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Generate a task number based on date and sequence.
 */
export function generateTaskNumber(seq: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `TSK-${year}${month}${day}-${String(seq).padStart(4, "0")}`;
}

/**
 * Get a color class for a task status.
 */
export function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "badge-draft",
    scheduled: "badge-scheduled",
    worker_allocation_pending: "badge-allocation-pending",
    ready_to_start: "badge-ready",
    in_progress: "badge-in-progress",
    partially_completed: "badge-in-progress",
    completed: "badge-completed",
    verified: "badge-verified",
    closed: "badge-closed",
    cancelled: "badge-cancelled",
  };
  return colors[status] ?? "badge-draft";
}

/**
 * Get a human-readable label for a task status.
 */
export function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    worker_allocation_pending: "Allocation Pending",
    ready_to_start: "Ready to Start",
    in_progress: "In Progress",
    partially_completed: "Partially Completed",
    completed: "Completed",
    verified: "Verified",
    closed: "Closed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

/**
 * Get a human-readable label for an employee status.
 */
export function getEmployeeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    assigned: "Assigned",
    working: "Working",
    marked_done: "Marked Done",
    released: "Released",
    unavailable: "Unavailable",
    on_leave: "On Leave",
    inactive: "Inactive",
  };
  return labels[status] ?? status;
}

/**
 * Get color class for employee status.
 */
export function getEmployeeStatusColor(status: string): string {
  const colors: Record<string, string> = {
    free: "badge-free",
    assigned: "badge-assigned",
    working: "badge-working",
    marked_done: "badge-marked-done",
    released: "badge-released",
    unavailable: "badge-unavailable",
    on_leave: "badge-on-leave",
    inactive: "badge-inactive",
  };
  return colors[status] ?? "badge-inactive";
}

/**
 * Get role display name.
 */
export function getRoleDisplayName(roleName: string): string {
  const names: Record<string, string> = {
    admin: "Administrator",
    team_leader: "Team Leader",
    supervisor: "Supervisor",
    assistant: "Assistant",
    permanent_worker: "Permanent Worker",
    adhoc_worker: "Ad-hoc Worker",
  };
  return names[roleName] ?? roleName;
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

/**
 * Format a number with commas.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Calculate percentage.
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
