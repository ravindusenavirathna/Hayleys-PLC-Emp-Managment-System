import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    role: { name: string; displayName: string };
    warehouse?: { name: string; code: string } | null;
    cluster?: { name: string; code: string } | null;
  };
  children: React.ReactNode;
  title?: string;
}

export default function DashboardShell({
  user,
  children,
  title,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-[240px] transition-all duration-300">
        <TopBar user={user} title={title} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
