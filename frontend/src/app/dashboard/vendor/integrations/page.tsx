'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Blocks, 
  RefreshCw, 
  Settings, 
  Link2, 
  Link2Off, 
  Database, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Cpu, 
  Code
} from "lucide-react";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface IntegrationChannel {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  lastSync: string;
  ordersImported: number;
}

interface WebhookLog {
  id: string;
  event: string;
  source: string;
  status: 'success' | 'failed' | 'ignored';
  timestamp: string;
  latency: string;
}

const initialChannels: IntegrationChannel[] = [
  { id: 'shopify', name: 'Shopify Store', logo: 'S', connected: true, lastSync: '12 mins ago', ordersImported: 1240 },
  { id: 'woocommerce', name: 'WooCommerce Store', logo: 'W', connected: false, lastSync: '-', ordersImported: 0 },
  { id: 'amazon', name: 'Amazon Seller Central', logo: 'A', connected: false, lastSync: '-', ordersImported: 0 },
  { id: 'ebay', name: 'eBay Marketplace', logo: 'E', connected: false, lastSync: '-', ordersImported: 0 },
];

const initialLogs: WebhookLog[] = [
  { id: 'EVT-904', event: 'orders/create', source: 'Shopify', status: 'success', timestamp: '5 mins ago', latency: '142ms' },
  { id: 'EVT-903', event: 'products/update', source: 'Shopify', status: 'success', timestamp: '18 mins ago', latency: '98ms' },
  { id: 'EVT-902', event: 'orders/create', source: 'Shopify', status: 'success', timestamp: '1 hour ago', latency: '180ms' },
  { id: 'EVT-901', event: 'orders/cancelled', source: 'Shopify', status: 'ignored', timestamp: '2 hours ago', latency: '40ms' },
  { id: 'EVT-900', event: 'inventory/adjust', source: 'Shopify', status: 'failed', timestamp: '4 hours ago', latency: '220ms' },
];

export default function IntegrationsPage() {
  const [channels, setChannels] = useState<IntegrationChannel[]>(initialChannels);
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs);
  
  // WooCommerce Connect form state
  const [wooUrl, setWooUrl] = useState('');
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');
  const [isWooOpen, setIsWooOpen] = useState(false);

  const handleToggleChannel = (id: string, currentlyConnected: boolean) => {
    if (currentlyConnected) {
      // Disconnect
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: `Disconnecting ${id} channel...`,
          success: () => {
            setChannels(prev => prev.map(c => c.id === id ? { ...c, connected: false, lastSync: '-' } : c));
            return `Successfully disconnected ${id} channel.`;
          },
          error: 'Failed to disconnect channel.',
        }
      );
    } else {
      if (id === 'woocommerce') {
        setIsWooOpen(true);
      } else {
        // Connect others directly with simulation
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1500)),
          {
            loading: `Establishing connection with ${id}...`,
            success: () => {
              setChannels(prev => prev.map(c => c.id === id ? { ...c, connected: true, lastSync: 'Just now' } : c));
              return `FCOS connected to ${id} successfully! Syncing inventory.`;
            },
            error: 'Connection timeout.',
          }
        );
      }
    }
  };

  const handleConnectWoo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wooUrl || !wooKey || !wooSecret) {
      toast.error("Please fill in WooCommerce URL and credential keys.");
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Testing WooCommerce REST API authorization...',
        success: () => {
          setChannels(prev => prev.map(c => c.id === 'woocommerce' ? { ...c, connected: true, lastSync: 'Just now' } : c));
          setIsWooOpen(false);
          setWooUrl('');
          setWooKey('');
          setWooSecret('');
          return 'WooCommerce store integrated! Webhook listener registered.';
        },
        error: 'Authorization failed. Please check Consumer Key.',
      }
    );
  };

  const handleSyncAll = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Syncing catalog quantities & active orders...',
        success: () => {
          const newLog: WebhookLog = {
            id: `EVT-${Math.floor(905 + Math.random() * 100)}`,
            event: 'inventory/force-sync',
            source: 'Manual Sync',
            status: 'success',
            timestamp: 'Just now',
            latency: '345ms'
          };
          setLogs([newLog, ...logs]);
          setChannels(prev => prev.map(c => c.connected ? { ...c, lastSync: 'Just now' } : c));
          return 'FCOS databases synchronized with active integrations.';
        },
        error: 'Failed to sync.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Channel Sync</h2>
          <p className="text-muted-foreground font-medium">Integrate multi-channel storefronts and monitor API webhook logs synced to FCOS fulfillment queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20" onClick={handleSyncAll}>
            <RefreshCw className="w-4 h-4" /> Trigger Global Sync
          </Button>
        </div>
      </div>

      {/* Connection channels grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {channels.map((c) => (
          <Card key={c.id} className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300">
            <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    {c.logo}
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold">{c.name}</CardTitle>
                    <CardDescription className="text-[9px] mt-0.5">
                      {c.connected ? `Syncing active` : 'Disconnected'}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={
                  c.connected 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                }>
                  {c.connected ? 'Active' : 'Offline'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block font-bold uppercase">Orders Imported</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{c.ordersImported}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold uppercase">Last Synchronized</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-250 mt-0.5 block">{c.lastSync}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                <Button 
                  size="xs" 
                  variant={c.connected ? 'outline' : 'default'} 
                  className="w-full rounded-lg text-[10px] font-bold h-7"
                  onClick={() => handleToggleChannel(c.id, c.connected)}
                >
                  {c.connected ? (
                    <span className="flex items-center gap-1 text-red-500"><Link2Off className="w-3 h-3" /> Disconnect</span>
                  ) : (
                    <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Connect Channel</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* API webhook logs */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-md font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Webhook Synchronization Logs
            </CardTitle>
            <CardDescription className="text-xs">Audit database logs auditing webhook transmissions between storefronts and FCOS routing engines.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Event ID</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Trigger Event</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Source</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Latency</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Result</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <TableCell className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 py-3">
                      {log.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">{log.event}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-600 dark:text-slate-400">{log.source}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-550 dark:text-slate-400">{log.latency}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        log.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full'
                          : log.status === 'ignored'
                            ? 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-bold text-[8px] rounded-full'
                            : 'bg-red-500/10 text-red-500 border-red-500/20 font-bold text-[8px] rounded-full'
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium text-slate-400 pr-4">{log.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Webhook Logic Sync Settings
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Configure parameters used to automatically parse incoming API JSON payloads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Webhook Payload Validation</p>
                  <p className="text-[10px] text-slate-400">Authenticate payloads via HMAC signatures</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Secure</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Catalog Quantity Auto-Push</p>
                  <p className="text-[10px] text-slate-400">Push stock adjustments to Shopify in real-time</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Sync Backordered Quantities</p>
                  <p className="text-[10px] text-slate-400">Queue items with out of stock attributes</p>
                </div>
                <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Inactive</Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-850">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Sync API Endpoint</span>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 font-mono text-[10px] border border-slate-850 text-slate-300">
                <Code className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate select-all">https://api.fcos.com/webhooks/shopify/auth_key_v3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WooCommerce Connect Dialog Modal */}
      <Dialog open={isWooOpen} onOpenChange={setIsWooOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
          <form onSubmit={handleConnectWoo}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Database className="w-5 h-5 text-primary" />
                Connect WooCommerce REST API
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter your WooCommerce API URL credentials. Requires Read/Write scopes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Store Base URL</span>
                <Input 
                  placeholder="https://yourstore.com" 
                  value={wooUrl}
                  onChange={(e) => setWooUrl(e.target.value)}
                  className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Consumer Key</span>
                <Input 
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                  value={wooKey}
                  onChange={(e) => setWooKey(e.target.value)}
                  className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-350">Consumer Secret</span>
                <Input 
                  type="password"
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                  value={wooSecret}
                  onChange={(e) => setWooSecret(e.target.value)}
                  className="h-10 border-slate-850 bg-slate-950 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800" onClick={() => setIsWooOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl shadow-lg shadow-primary/20">
                Authorize REST Connection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
