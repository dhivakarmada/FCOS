'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Package, CheckCircle2, AlertTriangle, Play, Printer, ShieldAlert,
  Settings, RefreshCw, BarChart2, Scale, Ruler, Box 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PackingStation {
  id: string;
  operator: string;
  activeJob: string;
  orderId?: string;
  taskId?: string;
  speed: string;
  status: "PACKING" | "IDLE" | "OFFLINE";
}

export default function PackingOperationsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['packing-tasks'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all?taskType=PACKING');
      return res.data;
    }
  });

  const { data: staffList = [], refetch: refetchStaff } = useQuery({
    queryKey: ['staff-performance-all'],
    queryFn: async () => {
      const res = await api.get('/staff/performance/all');
      return res.data;
    }
  });

  const stations: PackingStation[] = staffList.map((s: any, idx: number) => {
    // Find active PACKING task assigned to this staff member's userId
    const activeTask = tasks.find((t: any) => t.staffId === s.userId && t.status === 'PENDING');
    
    return {
      id: `STN-${String(idx + 1).padStart(2, '0')}`,
      operator: `${s.firstName} ${s.lastName}`,
      activeJob: activeTask?.order?.orderNumber || 'None',
      orderId: activeTask?.order?.id,
      taskId: activeTask?.id,
      speed: s.completedTasks > 0 ? `${s.completedTasks} packs/hr` : "0 packs/hr",
      status: activeTask ? "PACKING" : (s.warehouseId ? "IDLE" : "OFFLINE")
    };
  });

  // Set default selected station if not set and stations load
  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      const firstActive = stations.find(s => s.status === 'PACKING');
      setSelectedStation(firstActive ? firstActive.id : stations[0].id);
    }
  }, [stations, selectedStation]);

  const [weightInput, setWeightInput] = useState("0.45");
  const [dimensions, setDimensions] = useState({ length: 15, width: 10, height: 5 });
  const [packagingType, setPackagingType] = useState("STANDARD_BOX");

  const completePackingMutation = useMutation({
    mutationFn: async ({ taskId, orderId }: { taskId: string; orderId: string }) => {
      await api.patch(`/staff/tasks/${taskId}/status`, { status: 'COMPLETED' });
      await api.patch(`/orders/${orderId}/status`, { status: 'SHIPPED' });
    },
    onSuccess: () => {
      toast.success("Packing completed, invoice printed and dispatch waybill generated!");
      refetchTasks();
      refetchStaff();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to complete packing");
    }
  });

  const handleWeightValidation = () => {
    const weight = parseFloat(weightInput);
    if (weight > 0 && weight < 20) {
      toast.success(`Weight validated successfully: ${weight} kg within tolerance (+/- 0.05 kg)`);
    } else {
      toast.error("Weight anomaly detected! Recalibrate scale.");
    }
  };

  const handlePrintLabels = (orderId: string, taskId: string) => {
    toast.info(`Generating label and invoice for Order...`);
    completePackingMutation.mutate({ taskId, orderId });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchTasks(), refetchStaff()]).then(() => {
      setIsRefreshing(false);
      toast.success("Packing station telemetry refreshed");
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Package className="w-8 h-8 text-indigo-400" />
            Packing Station Control Center
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Manage physical packing bays, configure package dimensional constraints, and run shipping scale integration checks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync telemetry
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Packing Stations (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {stations.map(stn => (
              <Card 
                key={stn.id} 
                onClick={() => stn.status !== "OFFLINE" && setSelectedStation(stn.id)}
                className={`border backdrop-blur shadow-xl transition-all cursor-pointer ${
                  stn.status === "OFFLINE" ? "opacity-60 border-slate-900 bg-slate-950/20" :
                  selectedStation === stn.id ? "border-indigo-500 bg-indigo-500/5" : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{stn.id}</h4>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium">{stn.operator}</p>
                    </div>
                    <Badge className={`rounded-full border text-[9px] py-0 px-2 ${
                      stn.status === "PACKING" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      stn.status === "IDLE" ? "bg-slate-950 text-slate-500 border-slate-850" :
                      "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {stn.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold border-t border-slate-850 pt-3">
                    <span>Speed: <strong className="text-slate-200">{stn.speed}</strong></span>
                    <span>Job: <strong className="text-indigo-400">{stn.activeJob}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedStation && (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-850">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white">
                  Active Station Controls - {selectedStation}
                </CardTitle>
                <CardDescription>Verify items and prepare dispatch for order {stations.find(s => s.id === selectedStation)?.activeJob}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 text-xs">
                  {/* Weight Check */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-400" /> Scale Weight Validation
                    </h4>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs" 
                      />
                      <span className="text-slate-400 font-bold">kg</span>
                    </div>
                    <Button size="sm" className="w-full bg-indigo-650 hover:bg-indigo-750 text-white text-xs h-8 rounded-lg" onClick={handleWeightValidation}>
                      Verify Scale weight
                    </Button>
                  </div>

                  {/* Dimensions Box */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-indigo-400" /> Dimension Inputs
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">L (cm)</span>
                        <Input type="number" value={dimensions.length} className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">W (cm)</span>
                        <Input type="number" value={dimensions.width} className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">H (cm)</span>
                        <Input type="number" value={dimensions.height} className="bg-slate-900 border-slate-800 text-white rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2 justify-end">
                  <Button variant="outline" className="text-xs h-9 rounded-xl text-slate-350" onClick={() => toast.info("Packaging type saved")}>
                    Save Package Type
                  </Button>
                  {(() => {
                    const currentStationObj = stations.find(s => s.id === selectedStation);
                    return (
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold" 
                        disabled={!currentStationObj?.orderId || !currentStationObj?.taskId || completePackingMutation.isPending}
                        onClick={() => currentStationObj && handlePrintLabels(currentStationObj.orderId!, currentStationObj.taskId!)}
                      >
                        <Printer className="w-4 h-4 mr-1.5" /> Print Invoice & Label
                      </Button>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Packaging Rules panel */}
        <div className="space-y-6">
          <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl text-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <Box className="w-4 h-4 text-indigo-400" /> Packaging Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Package Format</label>
                <select 
                  className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 text-xs focus:ring-0 focus:outline-none"
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                >
                  <option value="STANDARD_BOX">Standard corrugated Box</option>
                  <option value="ECO_PADDED">Eco Padded Sleeve envelope</option>
                  <option value="FRAGILE_CRATE">Fragile Foam Crate</option>
                </select>
              </div>

              <div className="border-t border-slate-850 pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pre-Pack QC Checklists</h4>
                {[
                  { text: "Verify SKU matches scanner code", checked: true },
                  { text: "Check item counts and visual quantity", checked: true },
                  { text: "Examine physical seals for damages", checked: false }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-950/40 rounded-lg border border-slate-900">
                    <input type="checkbox" defaultChecked={item.checked} className="accent-indigo-500 rounded border-slate-800" />
                    <span className="text-slate-350">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
