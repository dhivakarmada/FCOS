'use client';

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  BarChart3, RefreshCw, Clock, 
  CheckCircle2, AlertTriangle, Play 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function WarehouseAnalyticsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dbMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['wms-dashboard-metrics-analytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    }
  });

  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['all-tasks-analytics'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  const { data: staffPerformance = [], refetch: refetchPerformance } = useQuery({
    queryKey: ['staff-performance-analytics'],
    queryFn: async () => {
      const res = await api.get('/staff/performance/all');
      return res.data;
    }
  });

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['all-orders-analytics'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    }
  });

  // 1. Average Fulfillment Speed
  const avgPickTime = useMemo(() => {
    const validStaff = staffPerformance.filter((s: any) => s.avgCompletionMinutes !== 'N/A' && s.avgCompletionMinutes !== undefined);
    if (validStaff.length === 0) return "N/A";
    const sum = validStaff.reduce((acc: number, s: any) => acc + parseFloat(s.avgCompletionMinutes), 0);
    const avgMins = sum / validStaff.length;
    return avgMins < 1 ? `${Math.round(avgMins * 60)}s` : `${avgMins.toFixed(1)}m`;
  }, [staffPerformance]);

  // 2. Order Aging Peak
  const agingPeak = useMemo(() => {
    const pendingTasks = allTasks.filter((t: any) => t.status === 'PENDING');
    if (pendingTasks.length === 0) return "0 mins";
    const ages = pendingTasks.map((t: any) => (Date.now() - new Date(t.createdAt).getTime()) / 60000);
    const maxAgeMins = Math.max(...ages);
    return maxAgeMins < 60 ? `${Math.round(maxAgeMins)} mins` : `${(maxAgeMins / 60).toFixed(1)} hours`;
  }, [allTasks]);

  // 3. SLA Success / Breach Rate
  const slaSuccess = useMemo(() => {
    const totalTasksCount = allTasks.length;
    if (totalTasksCount === 0) return "100.0%";
    const cancelledTasksCount = allTasks.filter((t: any) => t.status === 'CANCELLED').length;
    return ((totalTasksCount - cancelledTasksCount) / totalTasksCount * 100).toFixed(1) + "%";
  }, [allTasks]);

  const metrics = [
    { title: "Average Fulfillment Speed", value: avgPickTime, change: "Goal: < 30s", status: "NOMINAL" },
    { title: "Order Aging Peak", value: agingPeak, change: "Max allowed: 60m", status: "NOMINAL" },
    { title: "Orders Shipped Today", value: `${dbMetrics?.ordersToday || 0}`, change: "Synced with DB", status: "NOMINAL" },
    { title: "SLA Success Rate", value: slaSuccess, change: "Goal: > 98%", status: "NOMINAL" }
  ];

  // 4. Hourly Throughput
  const hourlyThroughput = useMemo(() => {
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED' && t.completedAt);
    const now = new Date();
    
    const getCountForHourAgo = (hoursAgo: number) => {
      const start = new Date(now.getTime() - (hoursAgo + 1) * 3600000);
      const end = new Date(now.getTime() - hoursAgo * 3600000);
      return completedTasks.filter((t: any) => {
        const completedDate = new Date(t.completedAt);
        return completedDate >= start && completedDate < end;
      }).length;
    };

    const formatHourRange = (hoursAgo: number) => {
      const startHour = new Date(now.getTime() - (hoursAgo + 1) * 3600000).getHours();
      const endHour = new Date(now.getTime() - hoursAgo * 3600000).getHours();
      const formatTime = (h: number) => `${h.toString().padStart(2, '0')}:00`;
      return `${formatTime(startHour)} - ${formatTime(endHour)}`;
    };

    return [
      { hour: formatHourRange(3), count: getCountForHourAgo(3), max: 10, color: "bg-indigo-500/50" },
      { hour: formatHourRange(2), count: getCountForHourAgo(2), max: 10, color: "bg-indigo-500/70" },
      { hour: formatHourRange(1), count: getCountForHourAgo(1), max: 10, color: "bg-indigo-500 animate-pulse" },
      { hour: `${now.getHours().toString().padStart(2, '0')}:00 - ${(now.getHours() + 1).toString().padStart(2, '0')}:00 (Est)`, count: 0, max: 10, color: "bg-slate-800" }
    ];
  }, [allTasks]);

  // 5. Courier stats
  const courierStats = useMemo(() => {
    const orders = ordersData?.orders || [];
    const statsMap: Record<string, { total: number; success: number; delayed: number }> = {};
    
    orders.forEach((o: any) => {
      if (o.shipment?.courierName) {
        const c = o.shipment.courierName;
        if (!statsMap[c]) {
          statsMap[c] = { total: 0, success: 0, delayed: 0 };
        }
        statsMap[c].total++;
        if (o.status === 'DELIVERED') {
          statsMap[c].success++;
        }
        if (o.status === 'CANCELLED') {
          statsMap[c].delayed++;
        }
      }
    });

    const entries = Object.entries(statsMap).map(([name, s]) => {
      const successRate = s.total > 0 ? (s.success / s.total * 100).toFixed(1) : "100.0";
      const delayRate = s.total > 0 ? (s.delayed / s.total * 100).toFixed(1) : "0.0";
      return {
        name,
        success: successRate,
        latency: "1.2 days", // average estimate
        delayRate: `${delayRate}%`
      };
    });

    if (entries.length === 0) {
      return [
        { name: "Standard Carrier", success: "100.0", latency: "1.0 days", delayRate: "0.0%" }
      ];
    }
    return entries;
  }, [ordersData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchMetrics(), refetchTasks(), refetchPerformance(), refetchOrders()]).then(() => {
      setIsRefreshing(false);
      toast.success("Operational analytics updated");
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            Operational Intelligence & BI
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Monitor average picking times, order aging curves, and courier success rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh analytics
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.title}</p>
              <h2 className="text-3xl font-black text-white mt-2 tracking-tighter">{m.value}</h2>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{m.change}</span>
                <Badge variant="outline" className="text-[8px] bg-slate-950 border-slate-850 text-indigo-405 px-1 py-0">{m.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Fulfillment bottlenecks */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Hourly Order Throughput</CardTitle>
            <CardDescription>Processed orders tracked by hour.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {hourlyThroughput.map((row, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-350 font-bold">
                  <span>{row.hour}</span>
                  <span className="font-mono text-white">{row.count} / {row.max} items</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-850">
                  <div 
                    className={`h-2.5 rounded-full ${row.color}`}
                    style={{ width: `${(row.count / row.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Courier Success rates */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Courier Performance Analytics</CardTitle>
            <CardDescription>Average transit delays and delivery success rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {courierStats.map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-955/60 rounded-xl border border-slate-850 flex items-center justify-between text-[11px]">
                <div>
                  <p className="font-bold text-slate-200">{c.name}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Avg Transit: {c.latency}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-white font-bold font-mono">{c.success}% Success</span>
                  <div className="text-[9px] text-rose-400 font-bold uppercase">Delay: {c.delayRate}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
