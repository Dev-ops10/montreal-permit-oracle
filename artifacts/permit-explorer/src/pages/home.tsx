import React from "react";
import { useGetPermitStats } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, Building2, MapPin, Pickaxe } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = useGetPermitStats({ query: { queryKey: ["/api/permits/stats"] } });

  if (isLoading || !stats) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg border border-border"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-muted rounded-lg border border-border"></div>
          <div className="h-80 bg-muted rounded-lg border border-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">City Overview</h1>
        <p className="text-muted-foreground text-lg">
          Live statistics from the Montreal Open Data portal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Permits" value={stats.total_permits.toLocaleString()} icon={<Building2 className="w-5 h-5" />} />
        <StatCard title="Last 7 Days" value={stats.last_7_days.toLocaleString()} icon={<Activity className="w-5 h-5 text-green-600" />} />
        <StatCard title="Last 30 Days" value={stats.last_30_days.toLocaleString()} icon={<Activity className="w-5 h-5 text-blue-600" />} />
        <StatCard title="Last 365 Days" value={stats.last_365_days.toLocaleString()} icon={<Activity className="w-5 h-5 text-purple-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Top Boroughs</h2>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.by_borough.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="borough" type="category" width={100} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.by_borough.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <Pickaxe className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Top Work Types</h2>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.top_work_types.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="borough" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.top_work_types.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--chart-2))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div className="text-3xl font-bold font-mono tracking-tighter">
        {value}
      </div>
    </div>
  );
}
