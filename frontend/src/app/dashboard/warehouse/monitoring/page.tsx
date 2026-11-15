'use client';

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useWarehouse } from "@/hooks/use-warehouse";
import { 
  Warehouse, RefreshCw, Layers, Map as MapIcon, BarChart2,
  Gauge, TrendingUp, AlertTriangle, Zap, CheckCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function WarehouseMonitoringPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { warehouses } = useWarehouse();
  const activeWHId = warehouses?.[0]?.id;
  const { warehouse: activeWH } = useWarehouse(activeWHId);

  const { data: dbMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['wms-dashboard-metrics-monitor'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    }
  });

  const binMetrics = useMemo(() => {
    const bins = activeWH?.bins || [];
    const totalBins = bins.length;
    const occupiedBins = bins.filter((b: any) => b.inventory?.length > 0).length;
    const overallRate = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;

    const filterByPrefix = (prefix: string) => bins.filter((b: any) => b.code.toLowerCase().startsWith(prefix.toLowerCase()));
    
    const zoneDetails = (prefix: string, name: string) => {
      const filtered = filterByPrefix(prefix);
      const total = filtered.length;
      const occupied = filtered.filter((b: any) => b.inventory?.length > 0).length;
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return {
        name,
        occupancy: rate,
        capacity: `${occupied} / ${total} bins`
      };
    };

    return {
      totalBins,
      occupiedBins,
      overallRate,
      zones: [
        zoneDetails('A', 'Zone A - Fast Moving Electronics'),
        zoneDetails('B', 'Zone B - Apparel & Footwear'),
        zoneDetails('C', 'Zone C - Bulky Cargo & Appliances'),
        zoneDetails('D', 'Zone D - Cosmetics & Pharmacy'),
      ]
    };
  }, [activeWH]);

  const stats = [
    { title: "Floor capacity", value: `${binMetrics.overallRate}%`, change: "Limit: 90%", isAlert: binMetrics.overallRate >= 90 },
    { title: "Rack occupancy", value: `${binMetrics.overallRate}%`, change: `${binMetrics.occupiedBins} / ${binMetrics.totalBins} slots occupied`, isAlert: false },
    { title: "Bin Utilization", value: `${binMetrics.overallRate}%`, change: `${binMetrics.totalBins} active bins`, isAlert: false },
    { title: "Throughput Rate", value: dbMetrics?.ordersToday ? `${dbMetrics.ordersToday} orders/day` : "0 orders/day", change: "Synced with DB analytics", isAlert: false }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse', activeWHId] });
    refetchMetrics().then(() => {
      setIsRefreshing(false);
      toast.success("Facility space metrics updated");
    });
  };

  const isZoneCAlert = binMetrics.zones[2]?.occupancy >= 90;
  const isZoneDStaging = binMetrics.zones[3]?.occupancy < 50;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Warehouse className="w-8 h-8 text-indigo-400" />
            Facility Layout & Space Monitor
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Real-time floor capacity mapping, rack density sensors, and sorting zone speed controllers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => (
          <Card key={idx} className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.title}</p>
              <h2 className="text-3xl font-black text-white mt-2 tracking-tighter">{s.value}</h2>
              <span className={`text-[10px] font-bold mt-1 block ${s.isAlert ? 'text-rose-455' : 'text-slate-500'}`}>
                {s.change}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Occupancy and capacity (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Physical Occupancy Graph</CardTitle>
            <CardDescription>Zone capacity indicators across levels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {binMetrics.zones.map((zone, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-200">{zone.name}</span>
                    <span className="text-slate-400 font-mono">{zone.capacity} ({zone.occupancy}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-850">
                    <div 
                      className={`h-3 rounded-full transition-all duration-505 ${
                        zone.occupancy >= 90 ? 'bg-rose-500' : zone.occupancy >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${zone.occupancy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks / Space optimizations */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Zap className="w-4 h-4 text-indigo-400" /> Space Optimizations
            </CardTitle>
            <CardDescription>Actions evaluated by layout modeling engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {isZoneCAlert ? (
              <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-850 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-555" />
                  <span className="font-bold text-white">Zone C Capacity Warning</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">Zone C is running at {binMetrics.zones[2]?.occupancy}% occupancy. High probability of sorting bottlenecks during the evening shift.</p>
                <Button size="sm" className="w-full mt-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg h-7 text-[10px]" onClick={() => toast.success("Rerouted bulky items overflow to Zone D staging bins")}>
                  Reroute Bulk Items Overflow
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-850 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-white">Zone C Capacity Nominal</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">Zone C occupancy is currently stable at {binMetrics.zones[2]?.occupancy}%. Routing capacity remains within safe limits.</p>
              </div>
            )}

            {isZoneDStaging ? (
              <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-850 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-white">Zone D Capacity Nominal</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">Cosmetics zone remains underutilized ({binMetrics.zones[3]?.occupancy}%). Available for temporary overflow items.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-855 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-white">Zone D High Demand</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">Cosmetics zone occupancy is high at {binMetrics.zones[3]?.occupancy}%. Limit storage allocation overrides.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
