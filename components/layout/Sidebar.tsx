"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/helpers";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  LayoutDashboard,
  Users,
  ClipboardList,
  Warehouse,
  BarChart3,
  ScrollText,
  UserCog,
  Layers,
  UserCheck,
  CalendarCheck,
  ClipboardCheck,
  UserPlus,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Briefcase,
  Network,
} from "lucide-react";

// ────────────────────────────────────────────────────────────
// Navigation config per role
// ────────────────────────────────────────────────────────────

const NAV_BY_ROLE: Record<string, Array<{
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}>> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Warehouses", href: "/admin/warehouses", icon: Warehouse },
    { label: "Clusters", href: "/admin/clusters", icon: Network },
    { label: "Employees", href: "/admin/employees", icon: Users },
    { label: "Users & Roles", href: "/admin/users", icon: UserCog },
    { label: "Clients", href: "/admin/clients", icon: Briefcase },
    { label: "All Tasks", href: "/admin/tasks", icon: ClipboardList },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  ],
  team_leader: [
    { label: "Dashboard", href: "/team-leader", icon: LayoutDashboard },
    { label: "My Tasks", href: "/team-leader/tasks", icon: ClipboardList },
    { label: "Create Task", href: "/team-leader/tasks/create", icon: CalendarCheck },
    { label: "Cluster Overview", href: "/team-leader/clusters", icon: Layers },
    { label: "Reports", href: "/team-leader/reports", icon: BarChart3 },
  ],
  supervisor: [
    { label: "Dashboard", href: "/supervisor", icon: LayoutDashboard },
    { label: "Task Allocation", href: "/supervisor/allocation", icon: UserCheck },
    { label: "Borrow Workers", href: "/supervisor/borrow-workers", icon: UserPlus },
    { label: "Hire Ad-hoc", href: "/supervisor/adhoc-workers", icon: Users },
    { label: "Task Monitoring", href: "/supervisor/monitoring", icon: Activity },
    { label: "All Tasks", href: "/supervisor/tasks", icon: ClipboardList },
  ],
  assistant: [
    { label: "Dashboard", href: "/assistant", icon: LayoutDashboard },
    { label: "Assigned Tasks", href: "/assistant/tasks", icon: ClipboardList },
    { label: "Task Progress", href: "/assistant/progress", icon: Activity },
    { label: "Attendance", href: "/assistant/attendance", icon: CalendarCheck },
    { label: "Mark Complete", href: "/assistant/mark-complete", icon: ClipboardCheck },
  ],
  permanent_worker: [
    { label: "My Task", href: "/worker", icon: LayoutDashboard },
    { label: "Task History", href: "/worker/history", icon: ScrollText },
  ],
  adhoc_worker: [
    { label: "My Task", href: "/worker", icon: LayoutDashboard },
  ],
};

// ────────────────────────────────────────────────────────────
// Role badge colors
// ────────────────────────────────────────────────────────────
const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  team_leader: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  supervisor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  assistant: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  permanent_worker: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  adhoc_worker: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: { name: string; displayName: string };
    warehouse?: { name: string; code: string } | null;
    cluster?: { name: string; code: string } | null;
  };
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_BY_ROLE[user.role.name] ?? NAV_BY_ROLE.permanent_worker;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
      style={{ width: collapsed ? "72px" : "240px" }}
    >
      {/* ── Logo ── */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b flex-shrink-0",
          "border-[hsl(var(--sidebar-border))]"
        )}
      >
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="text-white font-bold text-sm leading-none truncate">
              LogiCore
            </p>
            <p className="text-indigo-400 text-xs mt-0.5">Enterprise WMS</p>
          </div>
        )}
      </div>

      {/* ── User Info ── */}
      {!collapsed && (
        <div className="mx-3 my-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-400 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <div
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
              ROLE_BADGE_COLORS[user.role.name] ?? "bg-white/10 text-white"
            )}
          >
            {user.role.displayName}
          </div>
          {user.warehouse && (
            <p className="text-slate-500 text-[10px] mt-1 truncate">
              📍 {user.warehouse.name}
              {user.cluster ? ` · ${user.cluster.name}` : ""}
            </p>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === pathname ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.href.replace(/\//g, "-").slice(1) || "home"}`}
              className={cn(
                "sidebar-link",
                isActive && "active",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer Actions ── */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
        {!collapsed && (
          <Link
            href="/settings"
            id="nav-settings"
            className="sidebar-link"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Settings</span>
          </Link>
        )}
        <button
          onClick={handleSignOut}
          id="btn-signout"
          className={cn(
            "sidebar-link w-full text-left hover:text-red-400",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          id="btn-collapse-sidebar"
          className={cn(
            "sidebar-link w-full text-left mt-2",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
