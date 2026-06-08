import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { Hammer, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Task History — Coming Soon" };

export default async function HistoryComingSoonPage() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4 text-center px-4">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-2">
        <Hammer className="w-8 h-8 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Feature Pipeline — Phase 11
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Task History Under Construction
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          This sub-page is pre-registered in the LogiCore WMS routing tables and sidebar nav. The functional implementation is queued for the next release.
        </p>
      </div>
      <div className="text-xs text-slate-400 font-mono mt-6 border-t border-slate-100 pt-4 w-full max-w-xs">
        LogiCore WMS MVP · {user.role.displayName} Portal
      </div>
    </div>
  );
}
