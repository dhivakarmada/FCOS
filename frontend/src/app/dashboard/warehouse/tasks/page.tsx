'use client';

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Radio, CheckCircle2, AlertTriangle, RefreshCw, BarChart2,
  Plus, Users, ArrowRight, Play, Check, RotateCcw 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  type: "PICK" | "PACK" | "QC" | "DISPATCH" | "REPLENISHMENT";
  assignee: string;
  orderId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

export default function TaskManagementPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dbTasks = [], refetch } = useQuery({
    queryKey: ['kanban-staff-tasks'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await api.patch(`/staff/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      refetch();
      toast.success("Task status updated in database");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update task status");
    }
  });

  const tasks: TaskItem[] = dbTasks.map((t: any) => {
    let type: TaskItem["type"] = "PICK";
    if (t.taskType === "PICKING") type = "PICK";
    else if (t.taskType === "PACKING") type = "PACK";
    else if (t.taskType === "RETURN_VERIFY") type = "QC";
    else if (t.taskType === "DISPATCH") type = "DISPATCH";
    else type = "REPLENISHMENT";

    let status: TaskItem["status"] = "PENDING";
    if (t.status === "COMPLETED") status = "COMPLETED";
    else if (t.status === "IN_PROGRESS") status = "IN_PROGRESS";
    else if (t.status === "CANCELLED") status = "FAILED";
    else {
      status = t.staff ? "ASSIGNED" : "PENDING";
    }

    return {
      id: t.id,
      type,
      assignee: t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : "Unassigned",
      orderId: t.order?.orderNumber || `Order #${t.orderId || 'N/A'}`,
      priority: t.taskType === "PICKING" ? "HIGH" : "MEDIUM" as TaskItem["priority"],
      status
    };
  });

  const moveTaskStatus = (id: string, nextStatus: TaskItem["status"]) => {
    let dbStatus = "PENDING";
    if (nextStatus === "COMPLETED") dbStatus = "COMPLETED";
    else if (nextStatus === "IN_PROGRESS") dbStatus = "IN_PROGRESS";
    else if (nextStatus === "FAILED") dbStatus = "CANCELLED";
    else dbStatus = "PENDING";

    updateStatusMutation.mutate({ taskId: id, status: dbStatus });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Kanban workflows synchronized");
    });
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case "HIGH": return "text-rose-400 border-rose-500/20 bg-rose-500/10";
      case "MEDIUM": return "text-amber-400 border-amber-500/20 bg-amber-500/10";
      default: return "text-slate-400 border-slate-800 bg-slate-900";
    }
  };

  const renderColumn = (colStatus: TaskItem["status"], label: string, badgeColor: string) => {
    const colTasks = tasks.filter(t => t.status === colStatus);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
          <h4 className="font-bold text-xs text-slate-350 uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
            {label}
          </h4>
          <Badge variant="outline" className="bg-slate-950 border-slate-900 text-slate-500 text-[10px] font-mono">
            {colTasks.length}
          </Badge>
        </div>

        <div className="space-y-3 min-h-[350px] bg-slate-950/20 p-2.5 rounded-xl border border-slate-900/60">
          {colTasks.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold border border-dashed border-slate-900 rounded-lg">
              Empty
            </div>
          ) : (
            colTasks.map(t => (
              <Card key={t.id} className="border border-slate-850 bg-slate-900/60 hover:border-slate-700 transition-all text-xs">
                <CardContent className="p-3.5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{t.id}</span>
                    <Badge variant="outline" className={`text-[8px] py-0 ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </Badge>
                  </div>
                  <div>
                    <h5 className="font-bold text-white uppercase text-[10px]">{t.type} TASK</h5>
                    <p className="text-[10px] text-slate-450 mt-0.5 truncate font-medium">Ref: {t.orderId}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-850/60 pt-2.5">
                    <span>Assignee: <strong className="text-slate-350">{t.assignee}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    {colStatus === "PENDING" && (
                      <Button size="icon" className="w-5 h-5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-indigo-400 rounded" onClick={() => moveTaskStatus(t.id, "ASSIGNED")}>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {colStatus === "ASSIGNED" && (
                      <Button size="icon" className="w-5 h-5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-indigo-400 rounded" onClick={() => moveTaskStatus(t.id, "IN_PROGRESS")}>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {colStatus === "IN_PROGRESS" && (
                      <div className="flex gap-1">
                        <Button size="icon" className="w-5 h-5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-455 rounded" onClick={() => moveTaskStatus(t.id, "FAILED")}>
                          <AlertTriangle className="w-3 h-3" />
                        </Button>
                        <Button size="icon" className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-455 rounded" onClick={() => moveTaskStatus(t.id, "COMPLETED")}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {colStatus === "FAILED" && (
                      <Button size="icon" className="w-5 h-5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 rounded" onClick={() => moveTaskStatus(t.id, "PENDING")}>
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Radio className="w-8 h-8 text-indigo-400" />
            Task Management Kanban
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Audit active task pipelines, assign pick/pack jobs, and coordinate replenishment runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Board
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold" onClick={() => toast.success("Created new replenishment task")}>
            <Plus className="w-4 h-4" /> Create Replenishment Task
          </Button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5 overflow-x-auto pb-4">
        {renderColumn("PENDING", "Pending Queue", "bg-slate-600")}
        {renderColumn("ASSIGNED", "Assigned Tasks", "bg-sky-500")}
        {renderColumn("IN_PROGRESS", "In Progress", "bg-amber-500")}
        {renderColumn("COMPLETED", "Completed", "bg-emerald-500")}
        {renderColumn("FAILED", "Failed Tasks", "bg-rose-500")}
      </div>
    </div>
  );
}
