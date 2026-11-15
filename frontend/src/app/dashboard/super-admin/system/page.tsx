'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, Cpu, Activity, Database, RefreshCw, 
  Terminal, ShieldCheck, Zap, Network, Layers
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar 
} from 'recharts';
import { toast } from "sonner";

export default function SystemHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  
  // Fake telemetry generation
  const [telemetry, setTelemetry] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial historical data
    const data = [];
    const count = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : 48;
    const now = new Date();
    
    for (let i = count; i > 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000);
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.round(25 + Math.random() * 45),
        memory: Math.round(58 + Math.random() * 12),
        dbLatency: Math.round(2 + Math.random() * 4),
        apiLatencyP95: Math.round(15 + Math.random() * 25),
        apiLatencyP99: Math.round(45 + Math.random() * 85),
      });
    }
    setTelemetry(data);
  }, [timeRange]);

  // Live telemetry tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newTick = {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.round(25 + Math.random() * 45),
        memory: Math.round(58 + Math.random() * 12),
        dbLatency: Math.round(2 + Math.random() * 4),
        apiLatencyP95: Math.round(15 + Math.random() * 25),
        apiLatencyP99: Math.round(45 + Math.random() * 85),
      };
      setTelemetry(prev => [...prev.slice(1), newTick]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Telemetry cache refreshed successfully");
    }, 800);
  };

  const getSystemStatus = () => {
    const avgCpu = telemetry.reduce((sum, item) => sum + item.cpu, 0) / telemetry.length || 0;
    if (avgCpu > 85) return 'CRITICAL';
    if (avgCpu > 70) return 'WARNING';
    return 'HEALTHY';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Cpu className="w-8 h-8 text-rose-500" />
            Infrastructure Telemetry & Health
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Super-admin platform cluster loads, memory telemetry, DB query metrics, and network latency.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`h-9 px-3 border-none text-white ${
            getSystemStatus() === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}>
            <ShieldCheck className="w-4 h-4 mr-1.5" /> SYSTEM {getSystemStatus()}
          </Badge>
          
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
            {(['1h', '6h', '24h'] as const).map((r) => (
              <Button 
                key={r}
                variant={timeRange === r ? 'default' : 'ghost'} 
                onClick={() => setTimeRange(r)}
                className="h-7 text-xs font-bold px-3 rounded-lg"
              >
                {r}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> 
            Sync
          </Button>
        </div>
      </div>

      {/* Grid: Overview Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active API Containers</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">4 Nodes</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">All in ready status</p>
            </div>
            <Network className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg CPU Load</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">
                {telemetry.length ? Math.round(telemetry[telemetry.length - 1].cpu) : 0}%
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Threshold: 80% limit</p>
            </div>
            <Cpu className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Postgres Latency</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">
                {telemetry.length ? telemetry[telemetry.length - 1].dbLatency : 0} ms
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Target: &lt; 5ms check</p>
            </div>
            <Database className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Latency (p99)</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">
                {telemetry.length ? telemetry[telemetry.length - 1].apiLatencyP99 : 0} ms
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Target: &lt; 200ms check</p>
            </div>
            <Activity className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CPU & Memory Chart */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-rose-500" /> CPU & Memory Usage %
            </CardTitle>
            <CardDescription>Real-time node telemetry averages</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                  <Area type="monotone" name="CPU (%)" dataKey="cpu" stroke="#f43f5e" strokeWidth={2} fill="url(#colorCpu)" />
                  <Area type="monotone" name="Memory (%)" dataKey="memory" stroke="#3b82f6" strokeWidth={2} fill="url(#colorMem)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* API Response Latency Chart */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> API Latency Percentiles (ms)
            </CardTitle>
            <CardDescription>HTTP/REST request latency telemetry</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                  <Line type="monotone" name="p95 Latency" dataKey="apiLatencyP95" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" name="p99 Latency" dataKey="apiLatencyP99" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Database Query Latency */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> Postgres Query Read/Write Latency (ms)
            </CardTitle>
            <CardDescription>Direct SQL response telemetry</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetry.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                  <Bar dataKey="dbLatency" name="SQL Latency (ms)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Container Node Instance Health */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Cluster Containers Status
            </CardTitle>
            <CardDescription>Kubernetes deployment node clusters status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  fcos-api-pod-1
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>CPU: 34%</span>
                  <span>Mem: 452MB</span>
                  <Badge className="bg-emerald-500/10 border-emerald-800 text-emerald-500 text-[8px] h-4">Active</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  fcos-api-pod-2
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>CPU: 28%</span>
                  <span>Mem: 489MB</span>
                  <Badge className="bg-emerald-500/10 border-emerald-800 text-emerald-500 text-[8px] h-4">Active</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  fcos-worker-pod-1
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>CPU: 42%</span>
                  <span>Mem: 812MB</span>
                  <Badge className="bg-emerald-500/10 border-emerald-800 text-emerald-500 text-[8px] h-4">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
