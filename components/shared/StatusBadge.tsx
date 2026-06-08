import { cn, getTaskStatusLabel, getTaskStatusColor, getEmployeeStatusLabel, getEmployeeStatusColor } from "@/lib/utils/helpers";

interface StatusBadgeProps {
  status: string;
  type?: "task" | "employee" | "assignment";
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  type = "task",
  size = "sm",
}: StatusBadgeProps) {
  const label =
    type === "employee"
      ? getEmployeeStatusLabel(status)
      : type === "assignment"
      ? formatAssignmentStatus(status)
      : getTaskStatusLabel(status);

  const colorClass =
    type === "employee"
      ? getEmployeeStatusColor(status)
      : getTaskStatusColor(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      {label}
    </span>
  );
}

function formatAssignmentStatus(status: string): string {
  const labels: Record<string, string> = {
    assigned: "Assigned",
    accepted: "Accepted",
    working: "Working",
    marked_done: "Marked Done",
    verified_done: "Verified",
    released: "Released",
    absent: "Absent",
    replaced: "Replaced",
  };
  return labels[status] ?? status;
}
