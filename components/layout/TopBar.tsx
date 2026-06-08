"use client";

import { Bell, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/helpers";

interface TopBarProps {
  user: {
    name: string;
    role: { name: string; displayName: string };
    warehouse?: { name: string; code: string } | null;
    cluster?: { name: string; code: string } | null;
  };
  title?: string;
}

const ROLE_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  admin: { text: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" },
  team_leader: { text: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  supervisor: { text: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200", dot: "bg-cyan-500" },
  assistant: { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  permanent_worker: { text: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  adhoc_worker: { text: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" },
};

export default function TopBar({ user, title }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const colors = ROLE_COLORS[user.role.name] ?? ROLE_COLORS.permanent_worker;

  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Page title or breadcrumb */}
      {title && (
        <div className="hidden md:block">
          <h1 className="text-sm font-semibold text-slate-700">{title}</h1>
        </div>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="global-search"
                type="text"
                placeholder="Search tasks, workers, clusters..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button
              id="close-search"
              onClick={() => setSearchOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="open-search"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search...</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Context badge — Warehouse/Cluster */}
        {user.warehouse && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="font-medium text-slate-700">{user.warehouse.name}</span>
            {user.cluster && (
              <>
                <span className="text-slate-300">·</span>
                <span>{user.cluster.name}</span>
              </>
            )}
          </div>
        )}

        {/* Role badge */}
        <div
          className={cn(
            "hidden sm:flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 border",
            colors.bg,
            colors.text
          )}
        >
          <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
          {user.role.displayName}
        </div>

        {/* Notifications */}
        <button
          id="btn-notifications"
          className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-white" />
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
