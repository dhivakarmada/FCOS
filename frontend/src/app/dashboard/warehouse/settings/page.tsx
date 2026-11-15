'use client';

import { useState } from "react";
import { 
  Settings, RefreshCw, BarChart2, CheckCircle2, 
  Search, ShieldAlert, Clock, ArrowRight, Save, ToggleLeft, ToggleRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FacilitySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Settings states
  const [settings, setSettings] = useState({
    autoAssignTasks: true,
    batchSizeLimit: 15,
    pathOptimization: true,
    conveyorSpeedLimit: 80,
    shortageBufferCount: 5
  });

  const handleToggle = (field: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field] as any
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Facility operational parameters updated");
    }, 700);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Settings className="w-8 h-8 text-indigo-400" />
            Facility Operations Configuration
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Configure sorting rules, batch assignment parameters, and conveyor throughput limits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-9 gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rules settings (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Fulfillment Routing Rules</CardTitle>
            <CardDescription>Adjust algorithms for sorting and task flows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-xs">
            <div className="space-y-4">
              {/* Auto Assign */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white">Auto-Assign Task Allocator</h4>
                  <p className="text-slate-400 font-medium">Dynamically route pick/pack tasks to closest idle operators.</p>
                </div>
                <button onClick={() => handleToggle("autoAssignTasks")} className="text-slate-400 hover:text-white transition-colors">
                  {settings.autoAssignTasks ? (
                    <ToggleRight className="w-8 h-8 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Path Optimization */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-white">Path-Optimized Picking Maps</h4>
                  <p className="text-slate-400 font-medium">Re-order pick checklists to minimize worker walking distance.</p>
                </div>
                <button onClick={() => handleToggle("pathOptimization")} className="text-slate-400 hover:text-white transition-colors">
                  {settings.pathOptimization ? (
                    <ToggleRight className="w-8 h-8 text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Settings limits */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl self-start">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-indigo-400" /> Capacity Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex justify-between">
                <span>Max Picking Batch Size</span>
                <span className="text-indigo-400 font-mono">{settings.batchSizeLimit} SKUs</span>
              </label>
              <input 
                type="range" min="5" max="30" step="1" 
                className="w-full accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                value={settings.batchSizeLimit} 
                onChange={(e) => setSettings(prev => ({ ...prev, batchSizeLimit: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex justify-between">
                <span>Safety Stock Buffer</span>
                <span className="text-indigo-400 font-mono">{settings.shortageBufferCount} items</span>
              </label>
              <input 
                type="range" min="1" max="20" step="1" 
                className="w-full accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                value={settings.shortageBufferCount} 
                onChange={(e) => setSettings(prev => ({ ...prev, shortageBufferCount: parseInt(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
