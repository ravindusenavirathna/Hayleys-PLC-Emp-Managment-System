"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#14b8a6", "#f97316", "#ef4444", "#84cc16"];

interface ReportsChartsProps {
  data: {
    tasksByStatus: Array<{ name: string; value: number }>;
    tasksByCategory: Array<{ name: string; value: number }>;
    tasksByClient: Array<{ name: string; value: number }>;
    workerUtilization: Array<{ name: string; value: number }>;
    adhocUsage: number;
  };
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function ReportsCharts({ data }: ReportsChartsProps) {
  return (
    <div className="space-y-4">
      {/* Summary stat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ad-hoc Workers (7 days)</p>
          <p className="text-3xl font-bold text-orange-600 mt-1 tabular-nums">{data.adhocUsage}</p>
          <p className="text-xs text-muted-foreground mt-1">Temporary workers hired in last 7 days</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tasks Tracked</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1 tabular-nums">
            {data.tasksByStatus.reduce((s, t) => s + t.value, 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Workforce</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">
            {data.workerUtilization.reduce((s, w) => s + w.value, 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Permanent workers in system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Tasks by Status">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.tasksByStatus} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.tasksByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by Category">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.tasksByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                {data.tasksByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by Client">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.tasksByClient} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.tasksByClient.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Worker Utilization (Permanent)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.workerUtilization} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                {data.workerUtilization.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
