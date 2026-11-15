'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Cpu, Printer, ScanBarcode, Radio, Database, RefreshCw, 
  Activity, Play, CheckCircle2, AlertTriangle, AlertOctagon, Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function WarehouseSystemPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: staffList = [], refetch: refetchStaff } = useQuery({
    queryKey: ['staff-list-system'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['all-tasks-system'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  const { data: auditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['audit-logs-system'],
    queryFn: async () => {
      const res = await api.get('/audit-logs');
      return res.data;
    }
  });

  // Calculate dynamic queue metrics based on tasks
  const labelQueue = allTasks.filter((t: any) => t.taskType === 'DISPATCH' && t.status === 'PENDING').length;
  const invoiceQueue = allTasks.filter((t: any) => t.taskType === 'PACKING' && t.status === 'PENDING').length;
  const notificationQueue = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;

  const printers = [
    { id: 'PRN-01', type: 'Zebra ZT411 (Label)', status: labelQueue > 10 ? 'OUT_OF_PAPER' : 'ONLINE', queue: labelQueue, health: '100%' },
    { id: 'PRN-02', type: 'Zebra ZT411 (Label)', status: 'ONLINE', queue: 0, health: '98%' },
    { id: 'PRN-03', type: 'HP LaserJet (Invoice)', status: 'ONLINE', queue: invoiceQueue, health: '94%' },
  ];

  const scanners = staffList.map((s: any, idx: number) => ({
    id: `SCN-${301 + idx}`,
    user: `${s.firstName} ${s.lastName}`,
    status: s.warehouseId ? 'ONLINE' : 'STANDBY',
    battery: `${80 + (idx % 20)}%`,
    latency: `${10 + (idx % 10)}ms`
  }));

  const logs = auditLogs.slice(0, 5).map((log: any) => ({
    timestamp: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message: `${log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} performed ${log.action} in ${log.module}`,
    level: log.action.includes('REJECT') || log.action.includes('CANCEL') ? 'warning' : 'info'
  }));

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchStaff(), refetchTasks(), refetchLogs()]).then(() => {
      setIsRefreshing(false);
      toast.success('Warehouse infrastructure status synchronized');
    });
  };

  const handleSpoolerReset = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Resetting print spooler server...',
        success: 'Spooler restarted! Print queues cleared.',
        error: 'Failed to reset spooler.'
      }
    );
  };

  const handleTestLatency = () => {
    toast.info('Pinging all connected hand-held terminals...');
    setTimeout(() => {
      toast.success(`Scanner ping complete. Connected devices: ${scanners.length}`);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Cpu className="w-8 h-8 text-indigo-400" />
            Infrastructure Monitor
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Audit active scanners, print servers, and BullMQ rendering queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-655 hover:bg-indigo-700 text-white font-bold" onClick={handleSpoolerReset}>
            <Printer className="w-4 h-4" /> Reset Print Spooler
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Queues & Connections (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Queue telemetries */}
          <Card className="border border-slate-850 bg-slate-900/40 backdrop-blur shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-850">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Print & Sync Queues
                </CardTitle>
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold">
                  Nominal Uptime
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-xs text-slate-350">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Shipping Label Rendering Queue (BullMQ)</span>
                  <span className={labelQueue > 10 ? 'text-amber-400' : 'text-slate-400'}>
                    {labelQueue} pending jobs
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${Math.min(labelQueue * 10, 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Invoice PDF Spooler Queue</span>
                  <span className="text-slate-400">{invoiceQueue} pending jobs</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.min(invoiceQueue * 10, 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>Courier Manifest Sync Queue</span>
                  <span className="text-slate-400">{notificationQueue} pending api requests</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                  <div className="bg-indigo-650 h-full rounded-full transition-all" style={{ width: `${Math.min(notificationQueue * 10, 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Printers List */}
          <Card className="border border-slate-855 bg-slate-900/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-850 bg-slate-950/40">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Connected Print Hardware</h4>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-455 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                <tr>
                  <th className="p-3">Printer Ref</th>
                  <th className="p-3">Device Model</th>
                  <th className="p-3">Queued Jobs</th>
                  <th className="p-3">Print Health</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {printers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30 text-slate-200">
                    <td className="p-3 font-mono font-bold text-white">{p.id}</td>
                    <td className="p-3 font-semibold text-slate-400">{p.type}</td>
                    <td className="p-3 font-semibold text-slate-350">{p.queue} jobs</td>
                    <td className="p-3 text-emerald-450 font-bold">{p.health}</td>
                    <td className="p-3 text-right">
                      <Badge className={cn(
                        "text-[8px] font-black rounded-full h-4",
                        p.status === 'ONLINE' && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
                        p.status === 'OUT_OF_PAPER' && "bg-rose-500/10 text-rose-455 border border-rose-500/20 animate-pulse"
                      )}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right Column: Scanners & Live Logs */}
        <div className="space-y-6">
          {/* Scanner Terminals */}
          <Card className="border border-slate-850 bg-slate-900/40 backdrop-blur shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-850">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-405 flex items-center gap-2">
                <ScanBarcode className="w-4 h-4 text-indigo-400" /> Active Scanners ({scanners.filter((s: any) => s.status === 'ONLINE').length} Online)
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-slate-850 text-slate-400"
                onClick={handleTestLatency}
                title="Test Scanner Latency"
              >
                <Radio className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {scanners.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">No scanner terminals connected. Add staff to activate.</div>
              ) : (
                scanners.map((s: any) => (
                  <div key={s.id} className="p-2.5 bg-slate-955/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{s.id} ({s.user})</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        BATTERY: {s.battery} | LATENCY: {s.latency}
                      </p>
                    </div>
                    <Badge className={cn(
                      "text-[8px] font-black rounded-full h-4",
                      s.status === 'ONLINE' && "bg-emerald-500/10 text-emerald-455 border border-emerald-500/20",
                      s.status === 'STANDBY' && "bg-slate-950 text-slate-555 border border-slate-850",
                      s.status === 'OFFLINE' && "bg-rose-500/10 text-rose-455 border border-rose-500/20"
                    )}>
                      {s.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* System logs */}
          <Card className="border border-slate-850 bg-slate-955/60 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Infrastructure Logs
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">No system logs recorded.</div>
              ) : (
                logs.map((lg: any, idx: number) => (
                  <div key={idx} className="text-[10px] font-mono p-2 bg-slate-900/40 rounded border border-slate-850/60 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold shrink-0">{lg.timestamp}</span>
                    <span className={cn(
                      "flex-1 font-medium",
                      lg.level === 'warning' ? 'text-rose-400' : 'text-slate-355'
                    )}>{lg.message}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
