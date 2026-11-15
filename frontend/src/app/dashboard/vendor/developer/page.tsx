'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Code, 
  Key, 
  RefreshCw, 
  Terminal, 
  Layers, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Copy,
  Plus,
  Trash2,
  Play
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
}

interface WebhookLog {
  id: string;
  event: string;
  responseCode: number | null;
  responseBody: string | null;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempts: number;
  createdAt: string;
  endpoint: { url: string };
}

export default function DeveloperPortal() {
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created']);
  const [activeTab, setActiveTab] = useState<'api' | 'webhooks'>('api');

  // Queries
  const { data: keys, isLoading: isKeysLoading } = useQuery({
    queryKey: ['developer-keys'],
    queryFn: async () => {
      const res = await api.get('/developer/keys');
      return res.data;
    }
  });

  const { data: endpoints = [], isLoading: isEndpointsLoading } = useQuery<WebhookEndpoint[]>({
    queryKey: ['developer-endpoints'],
    queryFn: async () => {
      const res = await api.get('/developer/webhooks');
      return res.data;
    }
  });

  const { data: logs = [], isLoading: isLogsLoading } = useQuery<WebhookLog[]>({
    queryKey: ['developer-webhook-logs'],
    queryFn: async () => {
      const res = await api.get('/developer/webhooks/logs');
      return res.data;
    }
  });

  // Mutations
  const rotateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/developer/keys/rotate');
      return res.data;
    },
    onSuccess: () => {
      toast.success('API keys rotated! Please update your SDK credentials.');
      queryClient.invalidateQueries({ queryKey: ['developer-keys'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to rotate keys');
    }
  });

  const createEndpointMutation = useMutation({
    mutationFn: async (payload: { url: string; events: string[] }) => {
      const res = await api.post('/developer/webhooks', payload);
      return res.data;
    },
    onSuccess: () => {
      setNewUrl('');
      toast.success('Webhook endpoint registered successfully.');
      queryClient.invalidateQueries({ queryKey: ['developer-endpoints'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register endpoint');
    }
  });

  const deleteEndpointMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/developer/webhooks/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Endpoint removed from registry.');
      queryClient.invalidateQueries({ queryKey: ['developer-endpoints'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove endpoint');
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/developer/webhooks/${id}/test`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'SUCCESS') {
        toast.success(`Mock dispatch SUCCESS: HTTP ${data.responseCode}`);
      } else {
        toast.error(`Mock dispatch FAILED: HTTP ${data.responseCode} (Retry queued in Redis/BullMQ)`);
      }
      queryClient.invalidateQueries({ queryKey: ['developer-webhook-logs'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Trigger failed');
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleToggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleCreateEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    createEndpointMutation.mutate({ url: newUrl, events: selectedEvents });
  };

  const isLoading = isKeysLoading || isEndpointsLoading || isLogsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading FCOS API Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Code className="w-8 h-8 text-primary" />
            Developer Center
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Manage API credentials, configure webhook delivery endpoints, and inspect event queues.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <Button 
          variant={activeTab === 'api' ? 'default' : 'ghost'} 
          className="h-10 rounded-t-xl rounded-b-none border-b-2 border-transparent px-6 font-bold text-xs"
          onClick={() => setActiveTab('api')}
        >
          <Key className="w-4 h-4 mr-2" /> API & SDK Integration
        </Button>
        <Button 
          variant={activeTab === 'webhooks' ? 'default' : 'ghost'} 
          className="h-10 rounded-t-xl rounded-b-none border-b-2 border-transparent px-6 font-bold text-xs"
          onClick={() => setActiveTab('webhooks')}
        >
          <Activity className="w-4 h-4 mr-2" /> Webhooks Center
        </Button>
      </div>

      {/* Tab Content: API keys & SDK */}
      {activeTab === 'api' && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Credentials Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Authorization Keys</CardTitle>
                  <CardDescription>Use keys to authorize HTTP/REST or SDK order updates.</CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px]">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Active
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <span className="font-sans font-bold text-slate-400 block uppercase tracking-widest text-[9px]">API Key (Bearer)</span>
                  <div className="flex gap-2">
                    <Input readOnly value={keys?.apiKey || ''} className="h-10 bg-slate-50 dark:bg-slate-950 font-mono text-xs rounded-xl" />
                    <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 h-10 w-10 p-0" onClick={() => handleCopy(keys?.apiKey || '')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-sans font-bold text-slate-400 block uppercase tracking-widest text-[9px]">API Secret</span>
                  <div className="flex gap-2">
                    <Input readOnly type="password" value={keys?.apiSecret || ''} className="h-10 bg-slate-50 dark:bg-slate-950 font-mono text-xs rounded-xl" />
                    <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 h-10 w-10 p-0" onClick={() => handleCopy(keys?.apiSecret || '')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                  <Button variant="destructive" onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending} className="rounded-xl font-bold text-xs h-9">
                    {rotateMutation.isPending ? 'Rotating...' : 'Rotate API Keys'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SDK Code Snippets */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> FCOS Node.js SDK Implementation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="p-6 overflow-x-auto text-[10px] leading-relaxed text-indigo-300 font-mono">
{`// 1. Install SDK package
// npm install fcos-sdk

const FcosClient = require('fcos-sdk');

const fcos = new FcosClient({
  apiKey: "${keys?.apiKey || 'fcos_live_...'}",
  apiSecret: "••••••••••••••••"
});

// 2. Normalization Engine call for Checkout
const order = await fcos.orders.create({
  orderNumber: "ORD-CUSTOM-001",
  customer: {
    name: "Virat Kohli",
    email: "virat@fcos.com"
  },
  items: [
    { productId: "prod_clk2984knd", quantity: 2 }
  ],
  shipping: {
    addressLine1: "Chinnaswamy Stadium",
    city: "Bangalore",
    zipCode: "560001"
  }
});

console.log('Order normalized & queued:', order.id);`}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Quick Docs sidebar */}
          <div className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl text-xs">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> REST API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 border-l-2 border-primary pl-3">
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-200">POST /api/v1/orders</span>
                  <p className="text-[10px] text-slate-500">Normalize and submit a new order entity.</p>
                </div>
                <div className="space-y-2 border-l-2 border-primary pl-3">
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-200">POST /api/v1/inventory/sync</span>
                  <p className="text-[10px] text-slate-500">Verify and adjust live stock levels.</p>
                </div>
                <div className="space-y-2 border-l-2 border-primary pl-3">
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-200">GET /api/v1/orders/:id/track</span>
                  <p className="text-[10px] text-slate-500">Query courier tracking waybills.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content: Webhooks Endpoint List & logs */}
      {activeTab === 'webhooks' && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Create endpoint Form & List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle>Register Webhook Endpoint</CardTitle>
                <CardDescription>Setup URLs to receive FCOS events asynchronously.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEndpoint} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-400 block uppercase tracking-widest text-[9px]">Endpoint URL</span>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://yourserver.com/webhooks/fcos" 
                        value={newUrl} 
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="h-10 bg-slate-50 dark:bg-slate-950 text-xs rounded-xl"
                      />
                      <Button type="submit" disabled={createEndpointMutation.isPending} className="rounded-xl h-10 px-6 font-bold">
                        <Plus className="w-4 h-4 mr-1" /> Add Endpoint
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 block uppercase tracking-widest text-[9px]">Select Subscription Events</span>
                    <div className="grid grid-cols-2 gap-2 font-sans font-semibold">
                      {['order.created', 'order.updated', 'order.cancelled', 'inventory.low', 'shipment.shipped', 'shipment.delivered'].map(evt => (
                        <div key={evt} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                          <Checkbox checked={selectedEvents.includes(evt)} onCheckedChange={() => handleToggleEvent(evt)} />
                          <span>{evt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* List endpoints */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle>Registered Webhook Connections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-950/60">
                    <TableRow>
                      <TableHead className="text-xs font-black uppercase text-slate-400">Target Endpoint URL</TableHead>
                      <TableHead className="text-xs font-black uppercase text-slate-400">Events Subscribed</TableHead>
                      <TableHead className="text-xs font-black uppercase text-slate-400 text-center">Simulation</TableHead>
                      <TableHead className="text-xs font-black uppercase text-slate-400 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoints.map((ep) => (
                      <TableRow key={ep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <TableCell className="font-mono text-xs font-bold truncate max-w-[200px] select-all">
                          {ep.url}
                        </TableCell>
                        <TableCell className="space-y-1">
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {ep.events.map(ev => (
                              <Badge key={ev} variant="outline" className="text-[8px] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850">
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => testWebhookMutation.mutate(ep.id)}
                            disabled={testWebhookMutation.isPending}
                            className="rounded-lg h-7 font-bold text-[10px] text-primary"
                          >
                            <Play className="w-3 h-3 mr-1" /> Dispatch Test
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            onClick={() => deleteEndpointMutation.mutate(ep.id)}
                            disabled={deleteEndpointMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 h-7 w-7 p-0 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Webhook logs stream */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Delivery Logs History
              </CardTitle>
              <CardDescription>BullMQ webhook retries and dispatch queues status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-[10px] max-h-[500px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-850 dark:text-slate-350 truncate max-w-[150px]">{log.endpoint.url}</span>
                    <Badge className={
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px]'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px]'
                    }>
                      {log.status === 'SUCCESS' ? `HTTP ${log.responseCode}` : `HTTP ${log.responseCode} (Failed)`}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <code className="text-indigo-400">{log.event}</code>
                    <span>Attempts: {log.attempts}</span>
                  </div>
                  {log.status === 'FAILED' && (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-2 rounded text-[8px] text-rose-400 font-sans">
                      Retry queued inside Redis/BullMQ queue engine. Next attempt in 15 seconds.
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
