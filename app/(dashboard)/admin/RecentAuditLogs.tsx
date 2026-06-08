import { formatRelative, capitalize } from "@/lib/utils/helpers";
import Link from "next/link";
import { ScrollText } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  user: { name: string; email: string };
}

export default function AdminRecentAuditLogs({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Recent Audit Logs</h3>
        </div>
        <Link
          href="/admin/audit-logs"
          id="link-view-all-audit-logs"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No audit logs yet
          </p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 text-xs font-bold">
                  {log.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{log.user.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {capitalize(log.action.replace(/_/g, " "))}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {log.entityType} · {log.entityId.slice(0, 8)}...
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelative(log.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
