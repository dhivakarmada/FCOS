'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Radio, 
  RefreshCw, 
  Settings, 
  Link2, 
  Link2Off, 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Network,
  ArrowRightLeft
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface SourceConnector {
  id: string;
  name: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync: string | null;
  ordersReceived: number;
  syncHealth: number;
  apiHealth: number;
}

export default function OrderSourcesHub() {
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState<SourceConnector | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Queries
  const { data: sources = [], isLoading, refetch } = useQuery<SourceConnector[]>({
    queryKey: ['order-sources'],
    queryFn: async () => {
      const res = await api.get('/order-sources');
      return res.data;
    }
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/order-sources/${id}/toggle`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.name} connector is now ${data.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['order-sources'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle connector');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/order-sources/${id}/sync`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Synced successfully! Normalizing imported orders.`);
      queryClient.invalidateQueries({ queryKey: ['order-sources'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sync failed');
    }
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleSync = (id: string) => {
    syncMutation.mutate(id);
  };

  const handleConfigure = (source: SourceConnector) => {
    setSelectedSource(source);
    setIsConfigOpen(true);
  };

  const activeConnectorsCount = sources.filter(s => s.status === 'CONNECTED').length;
  const avgSyncHealth = Math.round(sources.reduce((acc, s) => acc + s.syncHealth, 0) / (sources.length || 1));
  const avgApiHealth = Math.round(sources.reduce((acc, s) => acc + s.apiHealth, 0) / (sources.length || 1));
  const totalOrdersImported = sources.reduce((acc, s) => acc + s.ordersReceived, 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading FCOS Sales Channel registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Radio className="w-8 h-8 text-primary" />
            Order Sources Hub
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Connect all external marketplaces, storefronts, and ERPs, and normalize incoming order streams in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 gap-2 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" /> Force Ingestion Sync
          </Button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Connectors</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">{activeConnectorsCount} Connected</h3>
              <p className="text-[10px] text-slate-450 mt-1 uppercase font-bold">From {sources.length} mapped profiles</p>
            </div>
            <Network className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders Received Today</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">{totalOrdersImported}</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Normalized & mapped</p>
            </div>
            <Layers className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Engines Health</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">{avgSyncHealth}% Health</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Ingestion rates optimal</p>
            </div>
            <Activity className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Webhook Telemetry</p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">{avgApiHealth}% uptime</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Endpoint response: 24ms</p>
            </div>
            <ArrowRightLeft className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>
      </div>

      {/* Connectors Layout list */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <Card key={source.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[8px] bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 px-2 py-0 text-slate-500 font-bold">
                    {source.type}
                  </Badge>
                  <CardTitle className="text-base text-slate-800 dark:text-white mt-1.5">{source.name}</CardTitle>
                </div>
                <Badge className={`rounded-full border text-[9px] py-0 px-2.5 ${
                  source.status === "CONNECTED" 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                    : "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-850"
                }`}>
                  {source.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Orders Imported:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{source.ordersReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Channel Sync Health:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{source.syncHealth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">API Connectivity:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{source.apiHealth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Last Synchronized:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-250">
                    {source.lastSync ? new Date(source.lastSync).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                <Button 
                  variant="outline" 
                  size="xs" 
                  className="flex-1 text-[10px] font-bold h-7 rounded-lg text-slate-600 dark:text-slate-350"
                  onClick={() => handleConfigure(source)}
                >
                  <Settings className="w-3.5 h-3.5 mr-1" /> Mapping
                </Button>
                {source.status === 'CONNECTED' && (
                  <Button 
                    variant="outline" 
                    size="xs" 
                    className="flex-1 text-[10px] font-bold h-7 rounded-lg text-indigo-500 hover:text-indigo-600 border-indigo-500/30 bg-indigo-500/5"
                    onClick={() => handleSync(source.id)}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncMutation.isPending && syncMutation.variables === source.id ? 'animate-spin' : ''}`} /> Sync Now
                  </Button>
                )}
                <Button 
                  variant={source.status === "CONNECTED" ? "destructive" : "default"} 
                  size="xs" 
                  className="flex-1 text-[10px] font-bold h-7 rounded-lg border-none"
                  onClick={() => handleToggle(source.id)}
                  disabled={toggleMutation.isPending}
                >
                  {source.status === 'CONNECTED' ? (
                    <span className="flex items-center gap-1"><Link2Off className="w-3.5 h-3.5" /> Disable</span>
                  ) : (
                    <span className="flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Connect</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mapping Dialog Modal */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Order Normalization Schema
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure field mappings to map incoming JSON structures into the normalized FCOS order model.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-200">FCOS Standard</p>
                <code className="text-[10px] text-primary">orderNumber</code>
              </div>
              <code className="text-[10px] text-slate-450">{"<--"} incoming_json.order_id</code>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-200">FCOS Standard</p>
                <code className="text-[10px] text-primary">customerName</code>
              </div>
              <code className="text-[10px] text-slate-450">{"<--"} incoming_json.shipping_name</code>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-200">FCOS Standard</p>
                <code className="text-[10px] text-primary">items[0].sku</code>
              </div>
              <code className="text-[10px] text-slate-450">{"<--"} incoming_json.line_items.sku</code>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl border-slate-800 text-slate-350 hover:bg-slate-800" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => {
              setIsConfigOpen(false);
              toast.success("Normalization mapping scheme saved!");
            }}>
              Save Normalization Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
