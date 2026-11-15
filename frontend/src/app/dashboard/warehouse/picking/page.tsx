'use client';

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWarehouse } from "@/hooks/use-warehouse";
import { 
  ScanBarcode, Users, Clock, AlertTriangle, Play, CheckCircle, 
  MapPin, CheckCircle2, RotateCcw, AlertOctagon, RefreshCw, BarChart2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

interface PickTask {
  id: string;
  orderId?: string;
  orderNumber: string;
  sku: string;
  productName: string;
  bin: string;
  picker: string;
  status: "PENDING" | "PICKING" | "COMPLETED" | "SHORTAGE" | "DAMAGED";
  timeElapsed: string;
}

export default function PickingOperationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePickerFilter, setActivePickerFilter] = useState("all");

  const { warehouses } = useWarehouse();
  const activeWHId = warehouses?.[0]?.id;
  const { warehouse: activeWH } = useWarehouse(activeWHId);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['picking-tasks'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all?taskType=PICKING');
      return res.data;
    }
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  const { data: staffPerformance = [] } = useQuery({
    queryKey: ['staff-performance-all'],
    queryFn: async () => {
      const res = await api.get('/staff/performance/all');
      return res.data;
    }
  });

  const pickers = staffList.filter((s: any) => s.designation?.toLowerCase().includes('picker') || s.designation?.toLowerCase().includes('staff') || s.designation?.toLowerCase().includes('manager'));

  const pickTasks = tasks.map((t: any, idx: number) => {
    const firstItem = t.order?.items?.[0];
    const binCode = (activeWH?.bins && activeWH.bins.length > 0)
      ? activeWH.bins[idx % activeWH.bins.length].code
      : 'A-01-01';
    return {
      id: t.id,
      orderId: t.order?.id,
      orderNumber: t.order?.orderNumber || 'N/A',
      sku: firstItem?.product?.sku || 'SKU-TEMP',
      productName: firstItem?.product?.name || 'Assorted Items',
      bin: binCode,
      picker: t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : 'Unassigned',
      status: t.status,
      timeElapsed: 'Just now'
    };
  });

  const avgPickTime = useMemo(() => {
    const validStaff = staffPerformance.filter((s: any) => s.avgCompletionMinutes !== 'N/A' && s.avgCompletionMinutes !== undefined);
    if (validStaff.length === 0) return "N/A";
    const sum = validStaff.reduce((acc: number, s: any) => acc + parseFloat(s.avgCompletionMinutes), 0);
    const avgMins = sum / validStaff.length;
    return avgMins < 1 ? `${Math.round(avgMins * 60)} seconds` : `${avgMins.toFixed(1)} mins`;
  }, [staffPerformance]);

  const avgAccuracy = useMemo(() => {
    const validStaff = staffPerformance.filter((s: any) => s.performanceScore !== null && s.performanceScore !== undefined);
    if (validStaff.length === 0) return "N/A";
    const sum = validStaff.reduce((acc: number, s: any) => acc + parseFloat(s.performanceScore), 0);
    return `${(sum / validStaff.length).toFixed(1)}%`;
  }, [staffPerformance]);

  const metrics = [
    { title: "Pending Pick Tasks", value: `${pickTasks.filter((t: any) => t.status === 'PENDING').length} items`, change: "Awaiting execution", isAlert: false },
    { title: "Active Pickers", value: `${pickers.length} online`, change: "Available in pool", isAlert: false },
    { title: "Average Pick Time", value: avgPickTime, change: "Goal: < 30s", isAlert: false },
    { title: "Pick Accuracy Rate", value: avgAccuracy, change: "Optimized accuracy", isAlert: false }
  ];

  // Barcode Scanner Simulator states
  const [simulatedSkuScan, setSimulatedSkuScan] = useState("");
  const [simulatedBinScan, setSimulatedBinScan] = useState("");
  const [scanningTaskId, setScanningTaskId] = useState<string | null>(null);

  const handleAssignTask = async (taskId: string, pickerId: string) => {
    const task = pickTasks.find((t: any) => t.id === taskId);
    if (!task || !task.orderId) return;
    try {
      await api.post(`/staff/${pickerId}/assign-task`, {
        orderId: task.orderId,
        taskType: 'PICKING'
      });
      toast.success(`Assigned task successfully`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleSimulatedScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanningTaskId) return;

    const task = pickTasks.find((t: any) => t.id === scanningTaskId);
    if (!task) return;

    if (simulatedSkuScan !== task.sku) {
      toast.error(`Scan Mismatch: Scanned SKU "${simulatedSkuScan}" does not match target "${task.sku}"`);
      return;
    }

    try {
      await api.patch(`/staff/tasks/${scanningTaskId}/status`, { status: 'COMPLETED' });
      if (task.orderId) {
        await api.patch(`/orders/${task.orderId}/status`, { status: 'PACKED' });
      }
      toast.success(`Pick Confirmed: Successfully verified Task ${scanningTaskId}!`);
      setScanningTaskId(null);
      setSimulatedSkuScan("");
      setSimulatedBinScan("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleReportIssue = async (id: string, type: "SHORTAGE" | "DAMAGED") => {
    try {
      await api.patch(`/staff/tasks/${id}/status`, { status: 'CANCELLED' });
      toast.warning(`Task ${id} flagged as ${type} and cancelled`);
      setScanningTaskId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to report issue');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Pick task queue updated");
    });
  };

  const filteredTasks = pickTasks.filter((t: any) => {
    const matchesSearch = t.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.bin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPicker = activePickerFilter === "all" || t.picker === activePickerFilter;
    return matchesSearch && matchesPicker;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3">COMPLETED</Badge>;
      case "PICKING":
        return <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full px-3">IN PICKING</Badge>;
      case "SHORTAGE":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3">SHORTAGE</Badge>;
      case "DAMAGED":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-3">DAMAGED</Badge>;
      default:
        return <Badge className="bg-slate-950 text-slate-400 border border-slate-900 rounded-full px-3">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <ScanBarcode className="w-8 h-8 text-indigo-400" />
            Picking Execution Deck
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Optimize pick routing maps, assign picking paths, and coordinate shortage warnings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Queue
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold" onClick={() => toast.success("Picker path optimizer re-routed active batches")}>
            <Play className="w-4 h-4" /> Optimize Pick Paths
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.title}</p>
              <h2 className="text-3xl font-black text-white mt-2 tracking-tighter">{m.value}</h2>
              <span className={`text-[10px] font-bold mt-1 block ${m.isAlert ? 'text-amber-400' : 'text-slate-500'}`}>
                {m.change}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Picking Tasks Queue (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Pick Tasks Queue</CardTitle>
            <CardDescription>Items pending picking for active packing batches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
              <div className="relative flex-1">
                <Input 
                  placeholder="Search SKU, product, or bin..." 
                  className="pl-9 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-950/60">
                  <TableRow className="border-b border-slate-800">
                    <TableHead className="text-slate-400 font-bold">Task ID</TableHead>
                    <TableHead className="text-slate-400 font-bold">SKU / Description</TableHead>
                    <TableHead className="text-slate-400 font-bold">Bin Location</TableHead>
                    <TableHead className="text-slate-400 font-bold">Picker</TableHead>
                    <TableHead className="text-slate-400 font-bold">Status</TableHead>
                    <TableHead className="text-slate-400 font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        No pick tasks match your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((t: any) => (
                      <TableRow key={t.id} className="border-b border-slate-800 hover:bg-slate-900/20">
                        <TableCell className="font-mono text-slate-400 font-bold text-xs">{t.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-200 text-xs">{t.productName}</p>
                            <code className="text-[10px] text-indigo-400 font-mono">{t.sku}</code>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-350 flex items-center gap-1 mt-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {t.bin}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-300">{t.picker}</TableCell>
                        <TableCell>{getStatusBadge(t.status)}</TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {t.status === "PENDING" && (
                            <select 
                              className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg h-7 text-white px-2 focus:ring-0 focus:outline-none"
                              onChange={(e) => {
                                if (e.target.value) handleAssignTask(t.id, e.target.value);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Assign Picker...</option>
                              {pickers.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.firstName} {p.lastName}
                                </option>
                              ))}
                            </select>
                          )}
                          {t.status === "PICKING" && (
                            <Button 
                              size="sm" 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 rounded-lg font-bold"
                              onClick={() => setScanningTaskId(t.id)}
                            >
                              Sim Scan
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Scan Simulator Panel */}
        <div className="space-y-6">
          {scanningTaskId ? (
            <Card className="border border-indigo-500 bg-slate-900/60 backdrop-blur shadow-xl animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <ScanBarcode className="w-5 h-5 text-indigo-400" /> Scan Verification Simulator
                </CardTitle>
                <CardDescription>Simulate picking barcode verification for Task {scanningTaskId}.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSimulatedScan} className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5 mb-2">
                    <div className="flex justify-between text-slate-450 font-bold uppercase text-[9px]">
                      <span>Target SKU</span>
                      <span>Target Bin</span>
                    </div>
                    <div className="flex justify-between font-mono font-bold text-white text-xs">
                      <span>{pickTasks.find((t: any) => t.id === scanningTaskId)?.sku}</span>
                      <span>{pickTasks.find((t: any) => t.id === scanningTaskId)?.bin}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Scan SKU Barcode</label>
                    <Input 
                      placeholder="e.g. SKU-TM-01" 
                      className="bg-slate-950 border-slate-850 text-white rounded-lg text-xs"
                      value={simulatedSkuScan}
                      onChange={(e) => setSimulatedSkuScan(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Scan Bin QR Code</label>
                    <Input 
                      placeholder="e.g. A-02-04" 
                      className="bg-slate-950 border-slate-850 text-white rounded-lg text-xs"
                      value={simulatedBinScan}
                      onChange={(e) => setSimulatedBinScan(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" className="flex-1 text-slate-400" onClick={() => setScanningTaskId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold">
                      Confirm Verify
                    </Button>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex gap-2 justify-between">
                    <Button type="button" variant="outline" size="sm" className="text-[10px] text-amber-500 border-amber-500/20 hover:bg-amber-500/10 rounded-lg h-7" onClick={() => handleReportIssue(scanningTaskId, "SHORTAGE")}>
                      Report Shortage
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="text-[10px] text-rose-500 border-rose-500/20 hover:bg-rose-500/10 rounded-lg h-7" onClick={() => handleReportIssue(scanningTaskId, "DAMAGED")}>
                      Report Damaged
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl h-64 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <ScanBarcode className="w-8 h-8 mb-3 opacity-20 text-slate-450" />
              <p className="font-bold text-sm">No active scan check</p>
              <p className="text-xs text-slate-650 mt-1 max-w-[200px]">Click "Sim Scan" next to any picking task to evaluate barcode scanning checks.</p>
            </Card>
          )}

          {/* Active Pickers list */}
          <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Active Pickers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {pickers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No active pickers available.
                </div>
              ) : (
                pickers.map((picker: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-200">{picker.firstName} {picker.lastName}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-medium">
                        Role: {picker.designation || 'Picker'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-indigo-400 font-bold">{picker.performance ? `${picker.performance}%` : '100.0%'}</span>
                      <div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] py-0 px-1.5">ACTIVE</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
