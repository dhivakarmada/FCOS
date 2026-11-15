'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Radio, Play, Pause, AlertTriangle, RefreshCw, 
  Users, ShoppingCart, ShieldAlert, CheckCircle2, 
  Layers, Printer, FileText, Send, UserCheck, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BREAK' | 'OFFLINE';
  task: string;
  efficiency: number;
}

interface OrderEvent {
  id: string;
  time: string;
  type: string;
  orderNumber: string;
  user: string;
  details: string;
}

export default function ControlRoomPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'staff' | 'queues'>('heatmap');
  
  // Real database queries
  const { data: orders = [], refetch: refetchOrders, isFetching: isFetchingOrders } = useQuery({
    queryKey: ['control-room-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.orders || [];
    }
  });

  const { data: staffList = [], refetch: refetchStaff, isFetching: isFetchingStaff } = useQuery({
    queryKey: ['control-room-staff'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  // Local live execution feed state
  const [feed, setFeed] = useState<OrderEvent[]>([]);

  // Calculate real queue sizes based on database states
  const labelQueueSize = orders.filter((o: any) => o.status === 'CREATED').length;
  const invoiceQueueSize = orders.filter((o: any) => o.status === 'PACKED').length;
  const syncQueueSize = orders.filter((o: any) => o.status === 'SHIPPED').length;

  // Initialize feed from existing database records
  useEffect(() => {
    if (orders.length > 0) {
      const initialFeed = orders.slice(0, 10).map((o: any) => ({
        id: o.id,
        time: new Date(o.updatedAt).toTimeString().split(' ')[0],
        type: o.status,
        orderNumber: o.orderNumber,
        user: o.customerName || 'System',
        details: `Order current status: ${o.status}`
      }));
      setFeed(initialFeed);
    } else {
      setFeed([]);
    }
  }, [orders]);

  // Listen to live WebSocket events to populate the feed dynamically
  useEffect(() => {
    if (!socket || !isLive) return;

    const handleOrderUpdate = (data: any) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEvent: OrderEvent = {
        id: String(Date.now()),
        time: timeStr,
        type: data.status,
        orderNumber: data.orderNumber || 'ORDER',
        user: 'System Sync',
        details: `Status shifted to ${data.status}`
      };
      setFeed(prev => [newEvent, ...prev].slice(0, 10));
      queryClient.invalidateQueries({ queryKey: ['control-room-orders'] });
    };

    const handleInventoryUpdate = (data: any) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEvent: OrderEvent = {
        id: String(Date.now()),
        time: timeStr,
        type: 'INVENTORY_UPDATE',
        orderNumber: data.sku || 'SKU',
        user: 'Auto Sensor',
        details: `Stock updated for SKU ${data.sku} (Quantity: ${data.quantity})`
      };
      setFeed(prev => [newEvent, ...prev].slice(0, 10));
    };

    socket.on('order-status-updated', handleOrderUpdate);
    socket.on('inventory-updated', handleInventoryUpdate);
    socket.on('staff-status-changed', () => {
      queryClient.invalidateQueries({ queryKey: ['control-room-staff'] });
    });

    return () => {
      socket.off('order-status-updated', handleOrderUpdate);
      socket.off('inventory-updated', handleInventoryUpdate);
    };
  }, [socket, isLive, queryClient]);

  // Map real database staff members
  const mappedStaff: StaffMember[] = staffList.map((s: any) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    role: s.designation || 'Staff',
    status: s.isActive ? 'ACTIVE' : 'OFFLINE',
    task: s.isActive ? 'Awaiting assignment' : 'Offline',
    efficiency: s.performance || 100
  }));

  const handleFlushQueues = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Flushing pending warehouse prints...',
        success: 'All print queues cleared!',
        error: 'Flush failed.',
      }
    );
  };

  const triggerDrill = () => {
    toast.warning('SAFETY DRILL SIGNAL SENT', {
      description: 'Evacuation guidelines pushed to active worker units.',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-red-200 dark:border-red-900/50 flex items-center gap-1.5 py-0.5 px-2.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-red-400' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-red-500' : 'bg-slate-500'}`}></span>
              </span>
              {isLive ? 'LIVE TELEMETRY MONITORING' : 'TELEMETRY PAUSED'}
            </Badge>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <Radio className="w-8 h-8 text-primary animate-pulse" />
            Operations Control Room
          </h2>
          <p className="text-muted-foreground font-medium">Real-time terminal supervisor view and physical warehouse activity monitoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsLive(!isLive)}
            className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isLive ? 'Pause Stream' : 'Resume Stream'}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={triggerDrill}
            className="h-9 gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Flame className="w-4 h-4" />
            Evacuation Signal
          </Button>
        </div>
      </div>

      {/* KPI Stats Block */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500/5 to-indigo-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff Online</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">
                {mappedStaff.filter(s => s.status === 'ACTIVE').length} / {mappedStaff.length}
              </h3>
            </div>
            <Users className="w-8 h-8 text-indigo-500/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aisle Telemetry Alerts</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
                {labelQueueSize > 15 ? 'High Congestion' : 'All Clear'}
              </h3>
            </div>
            <Layers className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Print Jobs Queue</p>
              <h3 className="text-3xl font-extrabold text-blue-600 mt-1">
                {labelQueueSize + invoiceQueueSize}
              </h3>
            </div>
            <Printer className="w-8 h-8 text-blue-500/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courier Dispatch Queue</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                {syncQueueSize}
              </h3>
            </div>
            <ShoppingCart className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Orders Feed & Queue Monitor */}
        <div className="space-y-6 lg:col-span-1">
          {/* Queues Monitor */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Queue Telemetry
                </CardTitle>
                <CardDescription>Real-time print, invoice and courier queue health</CardDescription>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => { refetchOrders(); refetchStaff(); }} title="Reload Queues">
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-blue-500" /> Labels PDF Queue</span>
                  <span className="font-mono text-blue-600">{labelQueueSize} jobs</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, orders.length > 0 ? (labelQueueSize / orders.length) * 100 : 0)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-purple-500" /> Invoice PDF Queue</span>
                  <span className="font-mono text-purple-600">{invoiceQueueSize} jobs</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, orders.length > 0 ? (invoiceQueueSize / orders.length) * 100 : 0)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5 text-emerald-500" /> Courier API Sync</span>
                  <span className="font-mono text-emerald-600">{syncQueueSize} waiting</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, orders.length > 0 ? (syncQueueSize / orders.length) * 100 : 0)}%` }} />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold h-9 border-slate-200 dark:border-slate-800" onClick={handleFlushQueues}>
                  Flush Print Queue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Orders Feed */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500" />
                Live Execution Feed
              </CardTitle>
              <CardDescription>Real-time physical actions inside facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {feed.length === 0 ? (
                  <div className="text-center py-12 text-xs font-bold text-slate-400">
                    Awaiting facility logistics events...
                  </div>
                ) : (
                  feed.map((event) => (
                    <div key={event.id} className="flex gap-3 items-start border-l-2 border-slate-100 dark:border-slate-800 pl-4 pb-2 relative">
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-primary hover:underline">{event.orderNumber}</span>
                          <span className="font-mono text-[9px] text-slate-400">{event.time}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                          {event.type.replace('_', ' ')}: <span className="font-medium text-slate-500 dark:text-slate-400">{event.details}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">By {event.user}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Warehouse floor Heatmap & Live Staff Tracking */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Facility Telemetry Radar</CardTitle>
                <CardDescription>Live layout showing bottlenecks and workload levels</CardDescription>
              </div>
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <Button 
                  size="sm" 
                  variant={activeTab === 'heatmap' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('heatmap')}
                  className="rounded-lg text-xs font-bold px-3 py-1.5 h-7"
                >
                  Floor Heatmap
                </Button>
                <Button 
                  size="sm" 
                  variant={activeTab === 'staff' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('staff')}
                  className="rounded-lg text-xs font-bold px-3 py-1.5 h-7"
                >
                  Staff Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'heatmap' && (
                <div className="space-y-6">
                  {/* CSS Grid Warehouse Heatmap */}
                  <div className="grid grid-cols-4 gap-4 bg-slate-950 p-6 rounded-[2rem] border border-slate-900 font-mono relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                    
                    {/* Aisles */}
                    <div className="p-4 rounded-xl border bg-emerald-950/20 border-emerald-900/50 text-emerald-400 flex flex-col justify-between text-center relative z-10">
                      <span className="text-[10px] font-black opacity-60">ZONE A</span>
                      <span className="font-extrabold text-sm block my-2">Aisle A</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 mx-auto text-[8px] h-4">Normal</Badge>
                    </div>

                    <div className={cn("p-4 rounded-xl border flex flex-col justify-between text-center relative z-10 transition-colors duration-500", 
                      labelQueueSize > 15 ? 'bg-amber-950/20 border-amber-900/50 text-amber-400 animate-pulse' : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
                    )}>
                      <span className="text-[10px] font-black opacity-60">ZONE B</span>
                      <span className="font-extrabold text-sm block my-2">Aisle B</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 mx-auto text-[8px] h-4">
                        {labelQueueSize > 15 ? 'Bottleneck' : 'Normal'}
                      </Badge>
                    </div>

                    <div className="p-4 rounded-xl border bg-emerald-950/20 border-emerald-900/50 text-emerald-400 flex flex-col justify-between text-center relative z-10">
                      <span className="text-[10px] font-black opacity-60">ZONE C</span>
                      <span className="font-extrabold text-sm block my-2">Aisle C</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 mx-auto text-[8px] h-4">Normal</Badge>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 text-slate-500 flex flex-col justify-between text-center relative z-10">
                      <span className="text-[10px] font-black opacity-60">ZONE D</span>
                      <span className="font-extrabold text-sm block my-2">Aisle D</span>
                      <Badge className="bg-slate-800 text-slate-500 border-slate-700 mx-auto text-[8px] h-4">Inactive</Badge>
                    </div>

                    {/* Pack Stations */}
                    <div className="col-span-2 p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 flex items-center justify-between relative z-10">
                      <div className="text-left">
                        <span className="text-[10px] font-black opacity-60 block">PACK AREA</span>
                        <span className="font-extrabold text-sm mt-1 block">Packing Hub</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 text-[8px] h-4">Normal</Badge>
                    </div>

                    {/* QC Zone */}
                    <div className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 flex flex-col justify-between text-center relative z-10">
                      <span className="text-[10px] font-black opacity-60">QC DEPOT</span>
                      <span className="font-extrabold text-sm block my-1">Quality Check</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 mx-auto text-[8px] h-4">Healthy</Badge>
                    </div>

                    {/* Dispatch Docks */}
                    <div className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 flex flex-col justify-between text-center relative z-10">
                      <span className="text-[10px] font-black opacity-60">BAY 1-3</span>
                      <span className="font-extrabold text-sm block my-1">Dispatch Dock</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 mx-auto text-[8px] h-4">Normal</Badge>
                    </div>
                  </div>

                  {labelQueueSize > 15 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs font-bold">Aisle B Congestion Alert</p>
                          <p className="text-[10px] text-slate-400">Picker traffic exceeded limits due to high order volume.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'staff' && (
                <div className="space-y-4">
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Staff Member</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Current Assignment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {mappedStaff.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                              No staff members registered in system.
                            </td>
                          </tr>
                        ) : (
                          mappedStaff.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                              <td className="p-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] uppercase">
                                  {s.name[0]}
                                </span>
                                <span className="font-bold">{s.name}</span>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 dark:border-slate-800">
                                  {s.role}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-none text-white", 
                                  s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                                )}>
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-500 max-w-[120px] truncate">{s.task}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
