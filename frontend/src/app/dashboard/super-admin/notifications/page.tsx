'use client';

import { useState } from "react";
import { 
  Bell, Search, Mail, MessageSquare, Phone, 
  CheckCircle, AlertTriangle, Play, RefreshCw, Layers 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const queryClient = useQueryClient();

  // Queries
  const { data: templates = [], isLoading: isTemplatesLoading, refetch: refetchTemplates, isFetching: isFetchingTemplates } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const res = await api.get("/notifications/templates");
      return res.data;
    }
  });

  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs, isFetching: isFetchingLogs } = useQuery({
    queryKey: ["notification-logs"],
    queryFn: async () => {
      const res = await api.get("/notifications/logs");
      return res.data;
    }
  });

  // Mutations
  const toggleChannelMutation = useMutation({
    mutationFn: async ({ id, channel }: { id: string; channel: 'email' | 'sms' | 'whatsapp' }) => {
      const res = await api.post(`/notifications/templates/${id}/toggle-channel`, { channel });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Updated channels for ${data.name}`);
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update channel");
    }
  });

  const sendTestMutation = useMutation({
    mutationFn: async (body: { channel: string; recipient: string; templateName: string }) => {
      const res = await api.post("/notifications/send-test", body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Test notification triggered and logged successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to trigger test notification");
    }
  });

  const handleToggleChannel = (templateId: string, channel: 'email' | 'sms' | 'whatsapp') => {
    toggleChannelMutation.mutate({ id: templateId, channel });
  };

  const handleRefresh = () => {
    refetchTemplates();
    refetchLogs();
    toast.success("Notification data refreshed");
  };

  // Derive Stats
  const totalSentToday = logs.filter((l: any) => new Date(l.time).toDateString() === new Date().toDateString()).length;
  const successLogs = logs.filter((l: any) => l.status === "DELIVERED").length;
  const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 100;

  const stats = [
    { title: "Messages Sent Today", value: totalSentToday.toString(), cost: `₹${(totalSentToday * 0.15).toFixed(2)}`, channels: "Email/SMS/WA" },
    { title: "Delivery Success Rate", value: `${successRate}%`, cost: "0% bounce", channels: "Across all APIs" },
    { title: "WhatsApp API Queue", value: "0 Pending", cost: "Latency --", channels: "Meta Cloud API" },
    { title: "SMS Gateway Status", value: "Nominal", cost: "API balance: ₹150.00", channels: "Twilio/TextLocal" }
  ];

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || log.template.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === "all" || log.channel.toLowerCase() === channelFilter.toLowerCase();
    return matchesSearch && matchesChannel;
  });

  const isRefreshing = isFetchingTemplates || isFetchingLogs;
  const isLoading = isTemplatesLoading || isLogsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading notifications telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8 text-amber-500" />
            Central Dispatch & Notification Hub
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Configure multi-channel communication templates (Email, SMS, WhatsApp) and monitor delivery queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button 
            className="h-9 gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold border-none"
            onClick={() => sendTestMutation.mutate({ channel: "email", recipient: "admin@fcos.com", templateName: "System Test Mail" })}
            disabled={sendTestMutation.isPending}
          >
            <Play className="w-4 h-4" /> Send Test Message
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => (
          <Card key={idx} className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 backdrop-blur shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">{s.title}</p>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-2 tracking-tighter">{s.value}</h2>
              <div className="space-y-0.5 mt-2">
                <p className="text-[10px] text-amber-500 font-bold uppercase">{s.cost}</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">{s.channels}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates Builder (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle>Notification Templates Manager</CardTitle>
            <CardDescription>Determine mapping rules for system triggers to user channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Template ID</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Event Trigger Name</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Active Channels</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Last Edited</TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t: any) => (
                    <TableRow key={t.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                      <TableCell className="font-mono text-slate-500 dark:text-slate-400 font-bold">{t.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-850 dark:text-slate-200">{t.name}</p>
                          <code className="text-[10px] bg-slate-100 dark:bg-slate-950 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-850">
                            {t.event}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleChannel(t.id, 'email')}
                            className={`p-1.5 rounded-lg border transition-colors ${t.email ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-650 border-slate-200 dark:border-slate-900'}`}
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleChannel(t.id, 'sms')}
                            className={`p-1.5 rounded-lg border transition-colors ${t.sms ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-650 border-slate-200 dark:border-slate-900'}`}
                            title="SMS"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleChannel(t.id, 'whatsapp')}
                            className={`p-1.5 rounded-lg border transition-colors ${t.whatsapp ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-650 border-slate-200 dark:border-slate-900'}`}
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 font-medium text-xs font-mono">
                        {new Date(t.lastEdited).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={() => toast.success(`Open editor for ${t.name}`)}>
                          Edit Content
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Live Dispatch Logs */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" /> Outbox Logs
            </CardTitle>
            <CardDescription>Live telemetry stream of outbound communications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Outbox filtering */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <Input 
                placeholder="Search logs..." 
                className="pl-9 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border-slate-200 dark:border-slate-850 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-850 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-350">{log.template}</span>
                        <Badge variant="outline" className="text-[9px] scale-90 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 py-0 text-slate-500 dark:text-slate-400">
                          {log.channel}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{log.recipient}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">{new Date(log.time).toLocaleTimeString()}</span>
                      <div>
                        {log.status === "DELIVERED" ? (
                          <span className="text-[9px] text-green-600 dark:text-green-400 font-bold uppercase flex items-center justify-end gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Delivered
                          </span>
                        ) : (
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase flex items-center justify-end gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-450 dark:text-slate-600">
                  No log telemetry recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
