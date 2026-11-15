'use client';

import { useState } from "react";
import { 
  Cpu, Plus, Play, ToggleLeft, ToggleRight, Trash2, 
  Settings, Zap, RefreshCw, AlertCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface Rule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  active: boolean;
  executions: number;
  lastExecuted: string;
}

export default function AutomationRulesPage() {
  const queryClient = useQueryClient();

  // Form states
  const [newRuleName, setNewRuleName] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState("Order Created");
  const [selectedCondition, setSelectedCondition] = useState("priority == 'HIGH'");
  const [selectedAction, setSelectedAction] = useState("assign_fastest_packer");

  // Queries
  const { data: rules = [], isLoading: isRulesLoading, refetch: refetchRules, isFetching: isFetchingRules } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const res = await api.get("/automation/rules");
      return res.data;
    }
  });

  const { data: executionLogs = [], isLoading: isLogsLoading, refetch: refetchLogs, isFetching: isFetchingLogs } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const res = await api.get("/automation/logs");
      return res.data;
    }
  });

  // Mutations
  const createRuleMutation = useMutation({
    mutationFn: async (body: { name: string; trigger: string; condition: string; action: string }) => {
      const res = await api.post("/automation/rules", body);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Rule "${data.name}" created and deployed successfully!`);
      setNewRuleName("");
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create rule");
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/automation/rules/${id}/toggle`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Rule ${data.name} is now ${data.active ? 'Active' : 'Deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to toggle rule");
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/automation/rules/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rule deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete rule");
    }
  });

  const dryRunMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/automation/rules/${id}/dry-run`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Dry run evaluated successfully! Actions simulated.");
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["automation-logs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to execute dry run");
    }
  });

  const handleToggleRule = (ruleId: string) => {
    toggleRuleMutation.mutate(ruleId);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) {
      toast.error("Please enter a rule name");
      return;
    }

    createRuleMutation.mutate({
      name: newRuleName,
      trigger: selectedTrigger,
      condition: selectedCondition,
      action: selectedAction,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRuleMutation.mutate(ruleId);
  };

  const handleDryRun = (rule: Rule) => {
    toast.info(`Dry run initiated for rule: ${rule.name}`);
    dryRunMutation.mutate(rule.id);
  };

  const handleRefresh = () => {
    refetchRules();
    refetchLogs();
    toast.success("Automation engine data refreshed");
  };

  const isRefreshing = isFetchingRules || isFetchingLogs;
  const isLoading = isRulesLoading || isLogsLoading;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading automation workflows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Cpu className="w-8 h-8 text-violet-500" />
            No-Code Automation Rules
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Configure event triggers, conditional checks, and automated actions to optimize fulfillment bottlenecks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rules Registry (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>Active Automation Workflows</CardTitle>
              <CardDescription>Rules executed inside the FCOS background engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {rules.length > 0 ? (
                  rules.map((rule: any) => (
                    <div key={rule.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition-colors rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">{rule.id}</span>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{rule.name}</h4>
                          {!rule.active && <Badge variant="secondary" className="scale-90 text-[9px] bg-slate-200 dark:bg-slate-850 text-slate-500 dark:text-slate-400">INACTIVE</Badge>}
                        </div>
                        
                        {/* Flow layout */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">WHEN</span>
                          <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[10px] text-violet-600 dark:text-violet-400">{rule.trigger}</Badge>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">IF</span>
                          <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[10px] text-amber-600 dark:text-amber-400">{rule.condition}</Badge>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">THEN</span>
                          <Badge variant="outline" className="font-mono bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-[10px] text-indigo-600 dark:text-indigo-400">{rule.action}</Badge>
                        </div>

                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase flex items-center gap-3">
                          <span>Executions: <strong className="text-slate-650 dark:text-slate-350">{rule.executions}</strong></span>
                          <span>Last Executed: <strong className="text-slate-650 dark:text-slate-350">{rule.lastExecuted}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-500 dark:text-slate-450 border border-transparent" 
                          onClick={() => handleDryRun(rule)} 
                          title="Test Execution"
                          disabled={dryRunMutation.isPending}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <button 
                          onClick={() => handleToggleRule(rule.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          {rule.active ? (
                            <ToggleRight className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-lg border border-transparent" 
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={deleteRuleMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-slate-450 dark:text-slate-650">
                    No active automation workflows configured.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Execution Logs */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500 animate-pulse" /> Live Execution Ledger
              </CardTitle>
              <CardDescription>Chronological events fired by the automation rule evaluator.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
                {executionLogs.length > 0 ? (
                  executionLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-900 flex items-start gap-3">
                      <span className="text-slate-400 dark:text-slate-600 font-bold shrink-0">{new Date(log.time).toLocaleTimeString()}</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-violet-600 dark:text-violet-400">{log.ruleName}</span>
                          {log.status === "DRY_RUN" && <Badge variant="outline" className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1 py-0 border-slate-200 dark:border-slate-800">DRY_RUN</Badge>}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{log.details}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-450 dark:text-slate-600">
                    No ledger runs triggered yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Builder Panel */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-500" /> Create New Rule
            </CardTitle>
            <CardDescription>Setup an event listener and configure triggers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Rule Title</label>
                <Input 
                  placeholder="e.g. Low stock trigger..." 
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-xs"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">WHEN (Event Trigger)</label>
                <select 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-300 text-sm focus:ring-0 focus:outline-none"
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                >
                  <option>Order Created</option>
                  <option>Order Status Changed</option>
                  <option>Inventory Update</option>
                  <option>SLA Threshold Breached</option>
                  <option>Return QC Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">IF (Expression check)</label>
                <select 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-300 text-sm focus:ring-0 focus:outline-none"
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                >
                  <option>priority == 'HIGH'</option>
                  <option>quantity &lt; minStock</option>
                  <option>timeInPicking &gt; 30m</option>
                  <option>qcResult == 'DAMAGED'</option>
                  <option>customerRole == 'VIP'</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">THEN (Automated Action)</label>
                <select 
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-300 text-sm focus:ring-0 focus:outline-none"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  <option value="assign_fastest_packer">Route to top packer</option>
                  <option value="send_low_stock_notification">Notify Slack channel</option>
                  <option value="reassign_picker_escalated">Reassign with High SLA priority</option>
                  <option value="move_to_bin_quarantine">Assign Quarantine Bin location</option>
                </select>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2 rounded-xl bg-violet-650 hover:bg-violet-750 text-white font-bold border-none"
                disabled={createRuleMutation.isPending}
              >
                Deploy Rule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
