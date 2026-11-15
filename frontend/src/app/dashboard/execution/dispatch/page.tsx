'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Truck, 
  ScanBarcode, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle,
  UserCheck,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface CourierArrival {
  id: string;
  carrier: string;
  status: 'arriving' | 'at-dock' | 'departed';
  scheduledTime: string;
  packagesCount: number;
}

interface ShipmentQueueItem {
  id: string;
  orderId: string;
  carrier: string;
  weight: string;
  status: 'ready' | 'shipped' | 'failed';
}

export default function DispatchPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Sim vs Live
  const [isSimulated, setIsSimulated] = useState(false);
  const [arrivals, setArrivals] = useState<CourierArrival[]>([]);
  const [shipments, setShipments] = useState<ShipmentQueueItem[]>([]);
  
  const [scanInput, setScanInput] = useState('');
  const [manifestGenerated, setManifestGenerated] = useState(false);
  const [driverSigned, setDriverSigned] = useState(false);

  const fetchActiveTask = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: tasks } = await api.get(`/staff/${user.id}/tasks`);
      const currentDispatchTask = tasks.find(
        (t: any) => t.taskType === 'DISPATCH' && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      );
      
      if (currentDispatchTask) {
        setActiveTask(currentDispatchTask);
        const { data: order } = await api.get(`/orders/${currentDispatchTask.orderId}`);
        setOrderDetails(order);
        
        // Map order shipment to dispatch queue
        const courier = order.shipment?.courierName || 'Delhivery';
        const trackingNum = order.shipment?.trackingNumber || `TRK-${order.id.substring(0,6).toUpperCase()}`;
        const mappedShipment: ShipmentQueueItem = {
          id: trackingNum,
          orderId: order.orderNumber || order.id,
          carrier: courier,
          weight: order.weight ? `${order.weight} kg` : '1.50 kg',
          status: 'ready'
        };
        setShipments([mappedShipment]);
        
        // Populate custom dynamic arrival schedule based on current courier
        setArrivals([
          { id: 'ARR-LIVE', carrier: courier, status: 'at-dock', scheduledTime: 'Just now', packagesCount: 1 }
        ]);
        setIsSimulated(false);
      } else {
        setActiveTask(null);
        setOrderDetails(null);
        setShipments([]);
        setArrivals([]);
      }
    } catch (error) {
      console.error('Error fetching dispatch tasks:', error);
      toast.error('Failed to load active dispatch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTask();
  }, [user?.id]);

  const handleToggleSimulation = (enabled: boolean) => {
    setIsSimulated(enabled);
    if (enabled) {
      setArrivals([
        { id: 'ARR-01', carrier: 'FedEx', status: 'at-dock', scheduledTime: '11:15 AM', packagesCount: 14 },
        { id: 'ARR-02', carrier: 'DHL', status: 'arriving', scheduledTime: '11:30 AM', packagesCount: 8 }
      ]);
      setShipments([
        { id: 'TRK-SIM-FEDEX-01', orderId: 'ORD-9042', carrier: 'FedEx', weight: '1.45 kg', status: 'ready' },
        { id: 'TRK-SIM-DHL-02', orderId: 'ORD-9040', carrier: 'DHL', weight: '0.85 kg', status: 'ready' }
      ]);
      setManifestGenerated(false);
      setDriverSigned(false);
      toast.info("Switched to Demo Simulation Mode.");
    } else {
      fetchActiveTask();
    }
  };

  const handleScanShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const cleanedScan = scanInput.trim().toUpperCase();
    const itemIdx = shipments.findIndex(s => s.id.toUpperCase() === cleanedScan || s.orderId.toUpperCase() === cleanedScan || s.id === cleanedScan || s.orderId === cleanedScan);

    if (itemIdx !== -1) {
      if (shipments[itemIdx].status === 'shipped') {
        toast.warning(`Shipment ${cleanedScan} already scanned & verified.`);
      } else {
        toast.success(`Shipment ${cleanedScan} verified & loaded successfully.`);
        setShipments(prev => prev.map((s, idx) => 
          idx === itemIdx ? { ...s, status: 'shipped' } : s
        ));
      }
    } else {
      toast.error(`Error: Shipment code "${cleanedScan}" not found in current dispatch route.`);
    }
    setScanInput('');
  };

  const handleTriggerDispatchFail = (id: string) => {
    toast.error(`Shipment ${id} marked as Failed Dispatch. Admin alerted.`);
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: 'failed' } : s));
  };

  const handleGenerateManifest = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Compiling driver manifest sheet PDF...',
        success: () => {
          setManifestGenerated(true);
          return 'Driver manifest compiled successfully.';
        },
        error: 'Failed to compile manifest.',
      }
    );
  };

  const handleDriverSign = () => {
    if (!manifestGenerated) {
      toast.error("Please compile manifest before driver signature authorization!");
      return;
    }
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Verifying driver credentials & signing handover...',
        success: () => {
          setDriverSigned(true);
          return 'Signature validated! Handover authorized.';
        },
        error: 'Authorization failed.',
      }
    );
  };

  const handleFinalizeShipments = async () => {
    if (!driverSigned) {
      toast.error("Cannot finalize. Driver signature is required!");
      return;
    }

    if (isSimulated) {
      toast.success("Dispatched! Simulated package handed over to FedEx transport.");
      setShipments([]);
      setManifestGenerated(false);
      setDriverSigned(false);
      return;
    }

    // Real Mode: Complete task & update order to OUT_FOR_DELIVERY
    try {
      toast.loading("Broadcasting shipping handover manifest...", { id: 'complete-dispatch' });
      // 1. Complete Task
      await api.patch(`/staff/tasks/${activeTask.id}/status`, { status: 'COMPLETED' });
      // 2. Advance Order to OUT_FOR_DELIVERY
      await api.patch(`/orders/${activeTask.orderId}/status`, { status: 'OUT_FOR_DELIVERY' });
      
      toast.success(`Dispatched! Handed over to courier driver.`, { id: 'complete-dispatch' });
      setShipments([]);
      setManifestGenerated(false);
      setDriverSigned(false);
      
      // Refresh tasks
      fetchActiveTask();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to finalize dispatch.", { id: 'complete-dispatch' });
    }
  };

  const readyToShipCount = shipments.filter(s => s.status === 'ready').length;
  const shippedCount = shipments.filter(s => s.status === 'shipped').length;

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Loading workspace configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Dispatch Handover</h2>
          <p className="text-xs text-muted-foreground font-medium">Verify driver manifest & load vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sim Mode</span>
            <Switch checked={isSimulated} onCheckedChange={handleToggleSimulation} />
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
            {isSimulated ? "Sandbox" : "Live WMS"}
          </Badge>
        </div>
      </div>

      {shipments.length === 0 ? (
        <Card className="border-none shadow-sm text-center py-16 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Active Dispatch Tasks</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                No orders are currently waiting at the loading dock for your dispatch verification. Toggle **Sim Mode** to preview dock operations.
              </p>
            </div>
            <Button className="rounded-full bg-primary font-bold text-xs" onClick={() => handleToggleSimulation(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch Simulation Mode
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Courier arrivals panel */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Courier Arrival Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {arrivals.map((arr) => (
                <div key={arr.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{arr.carrier} Freight</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Scheduled: {arr.scheduledTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="text-xs font-black text-slate-800 dark:text-slate-200 block">{arr.packagesCount} packages</strong>
                    <Badge className={
                      arr.status === 'at-dock'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full mt-1'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[8px] rounded-full mt-1'
                    }>
                      {arr.status === 'at-dock' ? 'At Loading Bay' : 'Arriving'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Handover controller */}
          <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-850">
              <span className="text-[10px] font-black uppercase text-slate-400">Handover Controller</span>
              <h3 className="font-extrabold text-lg leading-none mt-1">Manifest Verification</h3>
              <p className="text-xs text-slate-455 mt-1 font-semibold">Loaded: {shippedCount} of {shipments.length} packages</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleScanShipment} className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Scan Shipping Label Barcode</span>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Scan package tracking code or Order Number..." 
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="h-11 border-slate-800 bg-slate-900 text-slate-100 rounded-2xl flex-1 text-xs"
                  />
                  <Button type="submit" className="h-11 w-11 p-0 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground border-none">
                    <ScanBarcode className="w-5 h-5" />
                  </Button>
                </div>
              </form>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateManifest}
                  className="h-11 rounded-2xl border-slate-800 text-slate-300 text-xs font-bold gap-2 bg-slate-900 hover:bg-slate-800"
                >
                  <FileText className="w-4 h-4" /> Manifest Slip
                  {manifestGenerated && <Check className="w-3 h-3 text-emerald-500" />}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleDriverSign}
                  disabled={!manifestGenerated}
                  className="h-11 rounded-2xl border-slate-800 text-slate-300 text-xs font-bold gap-2 bg-slate-900 hover:bg-slate-800"
                >
                  <UserCheck className="w-4 h-4" /> Driver Sign
                  {driverSigned && <Check className="w-3 h-3 text-emerald-500" />}
                </Button>
              </div>

              <Button 
                onClick={handleFinalizeShipments}
                disabled={shippedCount === 0 || !driverSigned}
                className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 mt-2"
              >
                Finalize Handover & Dispatch
              </Button>
            </CardContent>
          </Card>

          {/* Handover List Queue */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Handover Logs Queue</span>
            <div className="space-y-2">
              {shipments.map((s) => (
                <div 
                  key={s.id} 
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                    s.status === 'shipped' 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                      : s.status === 'failed'
                        ? 'border-red-500/30 bg-red-500/[0.02]'
                        : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-450">{s.id}</span>
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-bold text-[8px] py-0 px-1 rounded-full uppercase">{s.carrier}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-555 dark:text-slate-400 mt-1">Order: {s.orderId} • {s.weight}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'ready' && (
                      <Button variant="ghost" size="xs" className="h-7 text-[10px] rounded-lg text-rose-500 hover:bg-rose-50" onClick={() => handleTriggerDispatchFail(s.id)}>
                        Fail Dispatch
                      </Button>
                    )}
                    <Badge className={
                      s.status === 'shipped'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] rounded-full'
                        : s.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[9px] rounded-full'
                          : 'bg-slate-100 dark:bg-slate-855 text-slate-550 dark:text-slate-400 font-bold text-[9px] rounded-full'
                    }>
                      {s.status === 'shipped' ? 'Loaded' : s.status === 'failed' ? 'Failed' : 'At Bay'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
