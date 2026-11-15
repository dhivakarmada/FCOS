'use client';

import { useState } from "react";
import { 
  Blocks, Search, ArrowLeftRight, 
  Settings, Key, RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface IntegrationItem {
  id: string;
  name: string;
  category: "ecommerce" | "shipping" | "payments" | "communication";
  status: "CONNECTED" | "DISCONNECTED";
  lastSync: string;
  apiEndpoint: string;
}

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  
  // Credentials edit states
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [webhookSecretInput, setWebhookSecretInput] = useState("");

  const queryClient = useQueryClient();

  // Queries
  const { data: integrations = [], isLoading: isIntegrationsLoading, refetch: refetchIntegrations, isFetching: isFetchingIntegrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await api.get("/integrations");
      return res.data;
    }
  });

  const { data: webhookLogs = [], isLoading: isWebhookLogsLoading, refetch: refetchWebhookLogs, isFetching: isFetchingWebhookLogs } = useQuery({
    queryKey: ["integrations-webhook-logs"],
    queryFn: async () => {
      const res = await api.get("/integrations/webhooks/logs");
      return res.data;
    }
  });

  // Mutations
  const toggleConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/integrations/${id}/toggle`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.name} is now ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-webhook-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update integration connection");
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async ({ id, apiKey, webhookSecret }: { id: string; apiKey: string; webhookSecret: string }) => {
      const res = await api.post(`/integrations/${id}/config`, { apiKey, webhookSecret });
      return res.data;
    },
    onSuccess: () => {
      toast.success("API Credentials saved successfully");
      setConfiguringId(null);
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save configuration");
    }
  });

  const handleToggleConnect = (id: string) => {
    toggleConnectionMutation.mutate(id);
  };

  const handleOpenConfig = (item: IntegrationItem) => {
    setConfiguringId(item.id);
    setApiKeyInput("");
    setWebhookSecretInput("");
  };

  const handleSaveConfig = () => {
    if (!configuringId) return;
    saveConfigMutation.mutate({
      id: configuringId,
      apiKey: apiKeyInput,
      webhookSecret: webhookSecretInput,
    });
  };

  const handleRefresh = () => {
    refetchIntegrations();
    refetchWebhookLogs();
    toast.success("Webhook endpoints and sync status refreshed");
  };

  const filteredIntegrations = integrations.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isRefreshing = isFetchingIntegrations || isFetchingWebhookLogs;
  const isLoading = isIntegrationsLoading || isWebhookLogsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading integrations registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Blocks className="w-8 h-8 text-sky-500" />
            Integrations & Webhooks
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Orchestrate sales channels, sync order routes to shipping couriers, and configure webhooks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Integrations Grid (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
            {["all", "ecommerce", "shipping", "payments", "communication"].map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "secondary" : "ghost"}
                onClick={() => setSelectedCategory(cat)}
                size="sm"
                className="rounded-lg text-xs capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredIntegrations.map((item: any) => (
              <Card key={item.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base text-slate-800 dark:text-white">{item.name}</CardTitle>
                    <CardDescription className="text-[10px] font-mono mt-1 text-slate-400 dark:text-slate-500 select-all truncate max-w-[200px]">
                      {item.apiEndpoint}
                    </CardDescription>
                  </div>
                  <Badge className={`rounded-full border text-[9px] py-0 px-2.5 ${
                    item.status === "CONNECTED" 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-850"
                  }`}>
                    {item.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase">
                    <span>Sync Status</span>
                    <span className="text-slate-650 dark:text-slate-350">{item.lastSync}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs rounded-xl h-8 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => handleOpenConfig(item)}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" /> Config
                    </Button>
                    <Button 
                      variant={item.status === "CONNECTED" ? "destructive" : "secondary"} 
                      size="sm" 
                      className="flex-1 text-xs rounded-xl h-8 border-none"
                      onClick={() => handleToggleConnect(item.id)}
                      disabled={toggleConnectionMutation.isPending}
                    >
                      {item.status === "CONNECTED" ? "Disable" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Configurations Drawer / Webhook Log */}
        <div className="space-y-6">
          {/* Configure Drawer */}
          {configuringId && (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur shadow-sm animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-500" /> Credentials Configuration
                </CardTitle>
                <CardDescription>Update parameters for {integrations.find((i: any) => i.id === configuringId)?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">API Key / Token</label>
                  <Input 
                    type="password" 
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter API Key"
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white placeholder:text-slate-405 rounded-lg text-xs" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Webhook Secret Key</label>
                  <Input 
                    type="password" 
                    value={webhookSecretInput}
                    onChange={(e) => setWebhookSecretInput(e.target.value)}
                    placeholder="Enter Webhook Secret"
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white placeholder:text-slate-405 rounded-lg text-xs" 
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="flex-1 text-slate-500 dark:text-slate-400 border border-transparent" onClick={() => setConfiguringId(null)}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-sky-650 hover:bg-sky-750 text-white font-bold border-none" 
                    onClick={handleSaveConfig}
                    disabled={saveConfigMutation.isPending}
                  >
                    Save Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhook Log */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-sky-500" /> Webhook Dispatch Logs
              </CardTitle>
              <CardDescription>Telemetry stream of real-time endpoint triggers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs max-h-[350px] overflow-y-auto pr-1">
              {webhookLogs.length > 0 ? (
                webhookLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-850 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-350">{log.source}</span>
                        <code className="text-[9px] bg-slate-100 dark:bg-slate-900 text-sky-600 dark:text-sky-400 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          {log.event}
                        </code>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.time).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.status === "SUCCESS" ? "text-green-600 bg-green-500/10 border border-green-500/20" : "text-rose-600 bg-rose-500/10 border border-rose-500/20"
                      }`}>
                        HTTP {log.code}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-450 dark:text-slate-650">
                  No webhook dispatches received yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
