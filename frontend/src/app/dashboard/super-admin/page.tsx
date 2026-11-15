'use client';

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSocket } from "@/hooks/use-socket";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, Package, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDashboardPage() {
  const socket = useSocket();
  const [feed, setFeed] = useState<any[]>([]);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['super-admin-kpis'],
    queryFn: async () => {
      const res = await api.get('/system/kpis');
      return res.data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!socket) return;

    const handleLiveFeed = (data: any) => {
      setFeed(prev => [data, ...prev].slice(0, 50)); // Keep last 50 events
    };

    socket.on('live-feed', handleLiveFeed);

    return () => {
      socket.off('live-feed', handleLiveFeed);
    };
  }, [socket]);

  const getEventIcon = (event: string) => {
    if (event.includes('alert')) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    if (event.includes('success') || event.includes('delivered')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (event.includes('inventory')) return <Package className="w-4 h-4 text-blue-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getEventColor = (event: string) => {
    if (event.includes('alert')) return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100';
    if (event.includes('inventory')) return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100';
    return 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Activity className="w-8 h-8 text-red-500" />
          Control Tower
        </h2>
        <p className="text-muted-foreground font-medium mt-1">Live Global Operations & Platform Health.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Vendors" 
          value={isLoading ? "..." : kpis?.totalVendors?.toString() || "0"} 
          icon={Building2} 
          description="Active on platform"
        />
        <KPICard 
          title="Global Orders" 
          value={isLoading ? "..." : kpis?.totalOrders?.toLocaleString() || "0"} 
          icon={Package} 
          description="All time volume"
        />
        <KPICard 
          title="Platform Revenue" 
          value={isLoading ? "..." : `₹${kpis?.totalRevenue?.toLocaleString() || "0"}`} 
          icon={Activity} 
          description="Total GMV delivered"
          iconClassName="bg-green-500/10 text-green-600 group-hover:bg-green-600"
        />
        <KPICard 
          title="Global RTO %" 
          value={isLoading ? "..." : `${kpis?.returnRate || "0"}%`} 
          icon={AlertTriangle} 
          description="System-wide returns"
          className={Number(kpis?.returnRate) > 5 ? "bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/50" : ""}
          iconClassName={Number(kpis?.returnRate) > 5 ? "bg-red-500/10 text-red-600 group-hover:bg-red-600" : ""}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" /> Live Operations Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {feed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 animate-spin mb-4 opacity-20" />
                  <p>Listening for real-time events...</p>
                </div>
              ) : (
                feed.map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border ${getEventColor(item.event)} transition-colors`}>
                    <div className="mt-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm">
                      {getEventIcon(item.event)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{item.event}</p>
                        <span className="text-xs text-muted-foreground">{format(new Date(item.timestamp), 'HH:mm:ss')}</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
                        {JSON.stringify(item.payload)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              System Console
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-2 text-green-400">
              <p>{'>'} WSS Connection Established</p>
              <p>{'>'} Subscribed to super_admin_room</p>
              <p className="animate-pulse">{'>'} Awaiting broadcast packets...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
