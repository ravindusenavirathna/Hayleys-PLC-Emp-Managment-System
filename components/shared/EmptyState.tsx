import { cn } from "@/lib/utils/helpers";
import { FileX, Search, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "file" | "search" | "alert";
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon = "file",
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon === "search" ? Search : icon === "alert" ? AlertCircle : FileX;

  return (
    <div className={cn("flex flex-col items-center gap-3 py-8", className)}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
