'use client';

import { useState } from 'react';
import { 
  Cpu, Blocks, RotateCw, Database, CheckCircle2, 
  AlertTriangle, AlertOctagon, Terminal, RefreshCw, Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function VendorSystemPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [channels, setChannels] = useState([
    { id: 'CH-SHPF', name: 'Shopify Store', status: 'ONLINE', latency: '48ms', lastSync: '2m ago' },
    { id: 'CH-AMZN', name: 'Amazon US Seller', status: 'ONLINE', latency: '124ms', lastSync: '10m ago' },
    { id: 'CH-WOOC', name: 'WooCommerce', status: 'DEGRADED', latency: '342ms', lastSync: '1h ago' }
  ]);

  const [queues, setQueues] = useState({
    failedJobs: 4,
    retryQueue: 0,
    webhooksDelay: '0.4s'
  });

  const [logs, setLogs] = useState([
    { timestamp: '10:10:02', channel: 'Shopify Store', message: 'Webhook event "orders/create" synced successfully for ORD-9843', level: 'info' },
    { timestamp: '10:08:45', channel: 'WooCommerce', message: 'API connection timeout during stock re-sync - retrying in 5m', level: 'warning' },
    { timestamp: '10:05:12', channel: 'Amazon US', message: 'Relocated inventory counts synced: SKU-TM-01 (150 units) updated', level: 'info' },
    { timestamp: '10:00:18', channel: 'System Hub', message: 'FCOS Webhook handshake complete', level: 'info' }
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Channel sync status synchronized');
    }, 600);
  };

  const handleTriggerSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Initiating Shopify & Amazon inventory sync...',
        success: 'Sync completed! 140 SKUs updated across all channels.',
        error: 'Sync failed.'
      }
    );
  };

  const handleRetryFailed = () => {
    toast.loading('Retrying failed API webhook syncs...');
    setTimeout(() => {
      toast.dismiss();
      setQueues(prev => ({ ...prev, failedJobs: 0 }));
      toast.success('All failed sync jobs retried and resolved successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Blocks className="w-8 h-8 text-indigo-400" />
            Channel Sync Monitor
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Audit active API channels, store synchronizations, webhooks, and failed retry queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold" onClick={handleTriggerSync}>
            <RotateCw className="w-4 h-4" /> Trigger Channel Sync
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: API Channels & Sync (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sales Channels */}
          <Card className="border border-slate-850 bg-slate-900/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-850 bg-slate-955/40">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Sales Channels</h4>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-450 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                <tr>
                  <th className="p-3">Channel Name</th>
                  <th className="p-3">API Latency</th>
                  <th className="p-3">Last Stock Sync</th>
                  <th className="p-3 text-right">Channel Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {channels.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 text-slate-200">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      {c.name}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-400">{c.latency}</td>
                    <td className="p-3 text-slate-350">{c.lastSync}</td>
                    <td className="p-3 text-right">
                      <Badge className={cn(
                        "text-[8px] font-black rounded-full h-4",
                        c.status === 'ONLINE' && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
                        c.status === 'DEGRADED' && "bg-rose-500/10 text-rose-455 border border-rose-500/20 animate-pulse"
                      )}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Sync Queues Info */}
          <Card className="border border-slate-850 bg-slate-900/40 backdrop-blur shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Webhook & Job Queues
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-xs text-slate-350">
              <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div>
                  <h5 className="font-bold text-white">Failed Sync Webhooks</h5>
                  <p className="text-slate-500 text-[10px] mt-0.5">API messages failed during store updates sync.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-rose-455 text-sm">{queues.failedJobs}</span>
                  {queues.failedJobs > 0 && (
                    <Button size="xs" onClick={handleRetryFailed} className="h-7 text-[10px] rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white font-bold">
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <div>
                  <h5 className="font-bold text-white">Webhook response delay</h5>
                  <p className="text-slate-500 text-[10px] mt-0.5">Average time elapsed between storefront event and FCOS updates.</p>
                </div>
                <span className="font-mono font-black text-emerald-450 text-sm">{queues.webhooksDelay}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Webhook Sync Event Log */}
        <div className="space-y-6">
          <Card className="border border-slate-850 bg-slate-950/60 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Channel Webhook Logs
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((lg, idx) => (
                <div key={idx} className="text-[10px] font-mono p-2.5 bg-slate-900/40 rounded border border-slate-850/60 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 font-bold">{lg.timestamp}</span>
                    <Badge className="bg-slate-950 text-slate-450 border border-slate-850 text-[7px] h-3.5 uppercase">{lg.channel}</Badge>
                  </div>
                  <span className={cn(
                    "font-medium mt-1 leading-relaxed",
                    lg.level === 'warning' ? 'text-rose-400' : 'text-slate-350'
                  )}>{lg.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
