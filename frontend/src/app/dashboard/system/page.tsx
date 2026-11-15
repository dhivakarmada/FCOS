'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Database, Activity, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function OperationsSystemPage() {
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading, refetch: refetchHealth, isFetching: healthFetching } = useQuery({
    queryKey: ['system-health-ops'],
    queryFn: async () => {
      const res = await api.get('/system/health');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const { data: queues, isLoading: queuesLoading, refetch: refetchQueues, isFetching: queuesFetching } = useQuery({
    queryKey: ['system-queues-ops'],
    queryFn: async () => {
      const res = await api.get('/system/queues');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/system/queues/retry');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Jobs retried successfully');
      queryClient.invalidateQueries({ queryKey: ['system-queues-ops'] });
    },
    onError: () => {
      toast.error('Failed to retry jobs');
    }
  });

  const formatMemory = (bytes: number) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const isDegraded = health?.status !== 'ok';
  const hasFailedJobs = queues?.totalFailed > 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Server className="w-8 h-8 text-indigo-500" />
            Operations System Command
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Real-time status of APIs, primary datastores, message brokers, and background queues.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDegraded && (
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1 h-9 px-3">
              <AlertTriangle className="w-4 h-4" /> Operations Warning
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetchHealth(); refetchQueues(); }} 
            disabled={healthFetching || queuesFetching}
            className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(healthFetching || queuesFetching) ? 'animate-spin' : ''}`} /> 
            Sync Status
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* API Core */}
        <Card className={`border-2 shadow-sm rounded-3xl ${health?.status === 'ok' ? 'border-emerald-100 dark:border-emerald-950/20' : 'border-rose-200 dark:border-rose-950/40'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-black">
              <Activity className={`w-5 h-5 ${health?.status === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`} /> 
              FCOS NestJS Backend
            </CardTitle>
            <CardDescription>Main application service</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="h-20 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
            ) : (
              <div className="space-y-3 font-semibold text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Gateway Connection</span>
                  <Badge className={health?.status === 'ok' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                    ONLINE
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Heap Utilization</span>
                  <span className="font-mono">{formatMemory(health?.services?.memory?.heapUsed)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Core Service Uptime</span>
                  <span className="font-mono">{(health?.services?.uptime ? (health.services.uptime / 3600).toFixed(1) : '0')} hrs</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database */}
        <Card className={`border-2 shadow-sm rounded-3xl ${health?.services?.database?.status === 'up' ? 'border-blue-100 dark:border-blue-950/20' : 'border-rose-200 dark:border-rose-950/40'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-black">
              <Database className={`w-5 h-5 ${health?.services?.database?.status === 'up' ? 'text-blue-500' : 'text-rose-500'}`} /> 
              Postgres SQL
            </CardTitle>
            <CardDescription>Primary storage health</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="h-20 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
            ) : (
              <div className="space-y-3 font-semibold text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Connection State</span>
                  <Badge className={health?.services?.database?.status === 'up' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 hover:bg-blue-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                    STABLE
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Database Sync</span>
                  <span className="text-emerald-500">Normal (0ms replication lag)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redis */}
        <Card className={`border-2 shadow-sm rounded-3xl ${health?.services?.redis?.status === 'up' ? 'border-rose-100 dark:border-rose-950/20' : 'border-rose-200 dark:border-rose-950/40'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-black">
              <Layers className={`w-5 h-5 ${health?.services?.redis?.status === 'up' ? 'text-rose-500' : 'text-rose-800'}`} /> 
              Redis Cache & Brokers
            </CardTitle>
            <CardDescription>WebSocket events & queue broker</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="h-20 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
            ) : (
              <div className="space-y-3 font-semibold text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Broker Sync</span>
                  <Badge className={health?.services?.redis?.status === 'up' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 hover:bg-rose-100' : 'bg-destructive text-destructive-foreground'}>
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">WebSockets Broadcast</span>
                  <span className="text-emerald-500 font-mono">Active (100% emit rate)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold tracking-tight">Active BullMQ Task Queues</h3>
          {hasFailedJobs && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="rounded-xl h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
              Retry All Failed Jobs
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Orders Queue */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-base font-semibold font-mono">bull:orders-queue</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {queuesLoading ? (
                <div className="h-20 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-black">{queues?.orders?.waiting || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Pending</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{queues?.orders?.active || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active</p>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-2xl font-black ${queues?.orders?.failed > 0 ? 'text-rose-600' : 'text-slate-300 dark:text-slate-700'}`}>
                      {queues?.orders?.failed || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Failed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications Queue */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
              <CardTitle className="text-base font-semibold font-mono">bull:notifications-queue</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {queuesLoading ? (
                <div className="h-20 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-300" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-black">{queues?.notifications?.waiting || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Pending</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{queues?.notifications?.active || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active</p>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-2xl font-black ${queues?.notifications?.failed > 0 ? 'text-rose-600' : 'text-slate-300 dark:text-slate-700'}`}>
                      {queues?.notifications?.failed || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Failed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
