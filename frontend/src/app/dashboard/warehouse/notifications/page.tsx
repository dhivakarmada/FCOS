'use client';

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Bell, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, 
  Trash2, Mail, MessageSquare, Phone, Info, Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AlertItem {
  id: string;
  type: "SLA_BREACH" | "LOW_STOCK" | "COURIER_DELAY" | "SYSTEM_LOG";
  message: string;
  time: string;
  severity: "critical" | "high" | "medium";
}

export default function FacilityNotificationsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['all-tasks-notifications'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  const alerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = [];

    // Find delayed tasks (SLA breaches)
    allTasks.forEach((t: any) => {
      if (t.status === 'PENDING') {
        const ageMinutes = (Date.now() - new Date(t.createdAt).getTime()) / 60000;
        const threshold = t.taskType === 'PICKING' ? 30 : 20;

        if (ageMinutes > threshold) {
          list.push({
            id: `ALT-${t.id.slice(-3).toUpperCase()}`,
            type: "SLA_BREACH",
            message: `${t.taskType} execution for Order #${t.order?.orderNumber || 'N/A'} is delayed by ${Math.round(ageMinutes)} mins (SLA limit: ${threshold}m)`,
            time: `${Math.round(ageMinutes)}m ago`,
            severity: "critical"
          });
        }
      }
    });

    // If no SLA breaches, add a nominal system log notification so there's always context if tasks exist
    if (list.length === 0 && allTasks.length > 0) {
      list.push({
        id: "ALT-SYS",
        type: "SYSTEM_LOG",
        message: `WMS dispatch queues active. Processed ${allTasks.filter((t: any) => t.status === 'COMPLETED').length} jobs successfully.`,
        time: "Just now",
        severity: "medium"
      });
    }

    return list;
  }, [allTasks]);

  const handleDismiss = (id: string) => {
    toast.success(`Alert warning ${id} acknowledged and logged`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchTasks().then(() => {
      setIsRefreshing(false);
      toast.success("Facility alerts queue updated");
    });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return <Badge className="bg-rose-500/10 text-rose-455 border border-rose-500/20 text-[9px] animate-pulse">CRITICAL</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px]">HIGH</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">MEDIUM</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Bell className="w-8 h-8 text-indigo-400 animate-pulse" />
            Facility Operations Warnings
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Monitor real-time SLA breach alarms, low bin warnings, and dispatch transit issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh warnings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts queue (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-4">
          {alerts.length === 0 ? (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl h-48 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 mb-3 text-emerald-500 opacity-60" />
              <p className="font-bold text-sm text-slate-300">All Systems Nominal</p>
              <p className="text-xs text-slate-655 mt-1">No active critical alerts or SLA threshold warnings detected in the facility.</p>
            </Card>
          ) : (
            alerts.map((al: any) => (
              <Card key={al.id} className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl hover:border-slate-700 transition-colors">
                <CardContent className="p-4 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-505 font-bold">{al.id}</span>
                      {getSeverityBadge(al.severity)}
                      <Badge variant="outline" className="text-[8px] bg-slate-950 border-slate-850 text-slate-455 uppercase py-0">{al.type}</Badge>
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed select-text">{al.message}</p>
                    <span className="text-[10px] text-slate-600 font-mono block mt-1">{al.time}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="hover:bg-slate-850 text-slate-400 rounded-lg" onClick={() => handleDismiss(al.id)}>
                      <Trash2 className="w-4 h-4 text-slate-555" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Warning rules overview */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl text-xs self-start">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-indigo-400" /> SLA Warning Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 space-y-1.5 text-[11px] leading-relaxed text-slate-455">
              <div className="flex justify-between items-center font-bold text-white mb-1">
                <span>Picking SLA limit</span>
                <span className="text-indigo-400 font-mono">30 mins</span>
              </div>
              <p>Pick tasks uncompleted 30 minutes after registration trigger warning alerts.</p>
            </div>

            <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-850 space-y-1.5 text-[11px] leading-relaxed text-slate-455">
              <div className="flex justify-between items-center font-bold text-white mb-1">
                <span>Packing SLA limit</span>
                <span className="text-indigo-400 font-mono">20 mins</span>
              </div>
              <p>Ready-to-pack orders unverified 20 minutes after picking trigger packing warnings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
