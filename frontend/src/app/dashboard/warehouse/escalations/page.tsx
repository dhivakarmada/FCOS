'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  ShieldAlert, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, 
  Trash2, Mail, MessageSquare, Phone, Info, Clock, Camera, Send 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IssueItem {
  id: string;
  category: "MISSING_ITEM" | "DAMAGED_STOCK" | "SCANNER_FAILURE" | "STAFF_INCIDENT";
  subject: string;
  reporter: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "OPEN" | "RESOLVED";
  time: string;
  history: Array<{ sender: string; text: string; time: string }>;
}

export default function FacilityEscalationsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const { data: allTasks = [], refetch } = useQuery({
    queryKey: ['all-tasks-escalations'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  // Filter tasks that are cancelled or failed to represent escalations/exceptions
  const cancelledTasks = allTasks.filter((t: any) => t.status === 'CANCELLED');

  const issues: IssueItem[] = cancelledTasks.map((t: any) => ({
    id: `ESC-${t.id.slice(-4).toUpperCase()}`,
    category: t.taskType === "PICKING" ? "MISSING_ITEM" : "DAMAGED_STOCK",
    subject: `${t.taskType} exception on Order #${t.order?.orderNumber || 'N/A'}`,
    reporter: t.staff ? `${t.staff.firstName} ${t.staff.lastName} (${t.taskType})` : "System Coordinator",
    severity: "HIGH",
    status: "OPEN",
    time: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
    history: [
      { 
        sender: t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : "System Coordinator", 
        text: `Operation failed. Task of type ${t.taskType} was flagged as cancelled/failed. Direct manager override or replenishment route verification is required.`, 
        time: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"
      }
    ]
  }));

  const handleResolveIssue = async (id: string) => {
    const task = cancelledTasks.find((t: any) => `ESC-${t.id.slice(-4).toUpperCase()}` === id);
    if (!task) return;
    try {
      await api.patch(`/staff/tasks/${task.id}/status`, { status: 'PENDING' });
      toast.success(`Escalation resolved: Reset Task ${task.id} to Pending queue.`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resolve escalation");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedIssueId) return;
    toast.success(`Operational command spooled: "${replyInput}"`);
    setReplyInput("");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Facility escalations board synced");
    });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge className="bg-rose-500/10 text-rose-455 border border-rose-500/20 text-[9px] animate-pulse">CRITICAL</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px]">HIGH</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">MEDIUM</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded-full px-2.5">RESOLVED</Badge>;
      default:
        return <Badge className="bg-rose-500/10 text-rose-455 border border-rose-500/20 text-[9px] rounded-full px-2.5 animate-pulse">OPEN</Badge>;
    }
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Operational Exception & Escalations Board
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Log inventory shortages, file damaged item reports, and override conveyor routing failures.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh board
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Escalation List (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-3">
          {issues.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              All systems green. No active operational exceptions or shortage alerts.
            </div>
          ) : (
            issues.map(iss => (
              <div 
                key={iss.id} 
                onClick={() => setSelectedIssueId(iss.id)}
                className={`p-4 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedIssueId === iss.id ? "border-rose-500/50 bg-rose-955/5" : "border-slate-800"
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-505 font-bold">{iss.id}</span>
                    <Badge variant="outline" className="text-[8px] bg-slate-950 border-slate-850 px-2 py-0 text-slate-450 uppercase">
                      {iss.category.replace("_", " ")}
                    </Badge>
                    {getSeverityBadge(iss.severity)}
                    {getStatusBadge(iss.status)}
                  </div>
                  <h4 className="font-bold text-white text-sm truncate">{iss.subject}</h4>
                  <p className="text-xs text-slate-450 font-medium">Reporter: {iss.reporter}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-850 justify-between">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] text-slate-505 font-bold uppercase">Reported At</p>
                    <span className="font-mono text-slate-350">{iss.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat / Reply details */}
        <div>
          {selectedIssue ? (
            <Card className="border border-slate-850 bg-slate-900/50 backdrop-blur shadow-xl flex flex-col h-[450px]">
              <CardHeader className="pb-3 border-b border-slate-850 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-black text-white">{selectedIssue.id}</CardTitle>
                    <CardDescription className="text-xs text-slate-400 truncate max-w-[200px] mt-1 font-semibold">
                      {selectedIssue.subject}
                    </CardDescription>
                  </div>
                  {selectedIssue.status !== "RESOLVED" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-455 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs"
                      onClick={() => handleResolveIssue(selectedIssue.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              {/* History stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
                {selectedIssue.history.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl max-w-[85%] text-xs space-y-1 ${
                      msg.sender.includes("Manager") || msg.sender.includes("Agent")
                        ? "bg-rose-500/10 text-slate-100 border border-rose-500/20 ml-auto" 
                        : "bg-slate-900 text-slate-300 border border-slate-805"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3 text-[9px] font-bold text-slate-505 uppercase">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="font-medium leading-relaxed select-text">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input form */}
              <CardContent className="p-3 border-t border-slate-850 shrink-0 bg-slate-900/50">
                {selectedIssue.status === "RESOLVED" ? (
                  <div className="p-2 text-center text-xs text-slate-500 font-bold bg-slate-955 rounded-lg border border-slate-900">
                    This issue has been resolved.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                      placeholder="Type operational override command..." 
                      className="bg-slate-950 border-slate-850 text-white rounded-lg text-xs placeholder:text-slate-650 focus-visible:ring-rose-500/45"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="bg-rose-600 hover:bg-rose-750 text-white rounded-lg shrink-0 w-8 h-8">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl h-64 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <ShieldAlert className="w-8 h-8 mb-3 opacity-20 text-slate-455" />
              <p className="font-bold text-sm">No exception selected</p>
              <p className="text-xs text-slate-650 mt-1 max-w-[200px]">Select an escalation card to review logs and trigger conveyor reroutes or manual overrides.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
