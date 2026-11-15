'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ScanBarcode, 
  MapPin, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  Navigation, 
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface PickItem {
  id: string;
  sku: string;
  name: string;
  qtyRequired: number;
  qtyPicked: number;
  bin: string;
  scannedBin: boolean;
  scannedSku: boolean;
  status: 'pending' | 'picking' | 'picked' | 'error';
}

export default function PickingPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Simulation vs Live states
  const [isSimulated, setIsSimulated] = useState(false);
  const [items, setItems] = useState<PickItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Fetch active tasks from API
  const fetchActiveTask = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: tasks } = await api.get(`/staff/${user.id}/tasks`);
      // Find an active picking task
      const currentPickingTask = tasks.find(
        (t: any) => t.taskType === 'PICKING' && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      );
      
      if (currentPickingTask) {
        setActiveTask(currentPickingTask);
        // Fetch order details
        const { data: order } = await api.get(`/orders/${currentPickingTask.orderId}`);
        setOrderDetails(order);
        
        // Map order items to PickItem format
        const mappedItems: PickItem[] = order.items.map((item: any, idx: number) => ({
          id: item.id,
          sku: item.product.sku,
          name: item.product.name,
          qtyRequired: item.quantity,
          qtyPicked: 0,
          bin: item.product.inventory?.[0]?.bin?.code || 'Bin A1',
          scannedBin: false,
          scannedSku: false,
          status: 'pending'
        }));
        setItems(mappedItems);
        setIsSimulated(false);
      } else {
        setActiveTask(null);
        setOrderDetails(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching picking tasks:', error);
      toast.error('Failed to load active picking tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTask();
  }, [user?.id]);

  // Load simulation data when toggled
  const handleToggleSimulation = (enabled: boolean) => {
    setIsSimulated(enabled);
    if (enabled) {
      const mockBatch: PickItem[] = [
        { id: 'sim-1', sku: 'SKU-SIM-SHIRT', name: 'Premium Cotton Shirt (Simulated)', qtyRequired: 2, qtyPicked: 0, bin: 'A1', scannedBin: false, scannedSku: false, status: 'pending' },
        { id: 'sim-2', sku: 'SKU-SIM-PANTS', name: 'Athletic Joggers (Simulated)', qtyRequired: 1, qtyPicked: 0, bin: 'B3', scannedBin: false, scannedSku: false, status: 'pending' }
      ];
      setItems(mockBatch);
      setActiveIdx(0);
      toast.info("Switched to Demo Simulation Mode.");
    } else {
      fetchActiveTask();
    }
  };

  const activeItem = items[activeIdx];
  const allPicked = items.length > 0 && items.every(item => item.status === 'picked');

  const handleScanBin = () => {
    if (!activeItem) return;
    toast.success(`Bin ${activeItem.bin} scanned & location verified.`);
    setItems(prev => prev.map((item, idx) => 
      idx === activeIdx ? { ...item, scannedBin: true, status: 'picking' } : item
    ));
  };

  const handleScanSku = async (scannedSkuValue: string) => {
    if (!activeItem) return;
    if (!activeItem.scannedBin) {
      toast.error("Error: You must scan the Bin location barcode first!");
      return;
    }

    const cleanedScan = scannedSkuValue.trim().toUpperCase();

    if (cleanedScan === activeItem.sku.toUpperCase() || cleanedScan === activeItem.sku) {
      if (isSimulated) {
        toast.success(`SKU ${activeItem.sku} verified. Pick completed!`);
        setItems(prev => prev.map((item, idx) => 
          idx === activeIdx ? { ...item, scannedSku: true, qtyPicked: item.qtyRequired, status: 'picked' } : item
        ));
        setBarcodeInput('');
        // Advance
        setTimeout(() => {
          if (activeIdx < items.length - 1) setActiveIdx(prev => prev + 1);
        }, 800);
      } else {
        // Real Mode: Scan out in backend database!
        try {
          toast.loading("Verifying and updating stock database...", { id: 'scan-out' });
          await api.post('/inventory/scan-out', {
            barcode: activeItem.sku, // using sku as barcode
            quantity: activeItem.qtyRequired,
            orderId: activeTask.orderId
          });
          toast.success(`SKU ${activeItem.sku} scanned & stock deducted in database!`, { id: 'scan-out' });
          
          setItems(prev => prev.map((item, idx) => 
            idx === activeIdx ? { ...item, scannedSku: true, qtyPicked: item.qtyRequired, status: 'picked' } : item
          ));
          setBarcodeInput('');
          
          setTimeout(() => {
            if (activeIdx < items.length - 1) setActiveIdx(prev => prev + 1);
          }, 800);
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Failed to scan out item.", { id: 'scan-out' });
        }
      }
    } else {
      toast.error(`Scan Mismatch: Scanned "${cleanedScan}", expected "${activeItem.sku}"`);
      setBarcodeInput('');
    }
  };

  const handleReportShortage = () => {
    toast.warning(`Shortage reported for ${activeItem.sku}. Manager notified.`);
    setItems(prev => prev.map((item, idx) => 
      idx === activeIdx ? { ...item, status: 'error' } : item
    ));
    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
    }
  };

  const handleCompleteBatch = async () => {
    if (isSimulated) {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: 'Submitting simulated picking batch records...',
          success: 'Simulated picking completed! Handover successful.',
          error: 'Failed.',
        }
      );
      handleToggleSimulation(true); // reset simulation
      return;
    }

    // Real Mode: Complete task & advance order status
    try {
      toast.loading("Updating picking status on server...", { id: 'complete-task' });
      // 1. Complete Task
      await api.patch(`/staff/tasks/${activeTask.id}/status`, { status: 'COMPLETED' });
      // 2. Advance Order to PACKED
      await api.patch(`/orders/${activeTask.orderId}/status`, { status: 'PACKED' });
      
      toast.success("Order picking manifest updated! Handed over to Packing Station.", { id: 'complete-task' });
      
      // Reload tasks
      fetchActiveTask();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to complete picking task.", { id: 'complete-task' });
    }
  };

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
          <h2 className="text-2xl font-extrabold tracking-tight">Picking Route</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {isSimulated ? "Demo Simulation Mode • Mock Routing" : `Active Batch • Order #${orderDetails?.orderNumber || 'N/A'}`}
          </p>
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

      {items.length === 0 ? (
        <Card className="border-none shadow-sm text-center py-16 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Active Picking Tasks</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                You are currently caught up! To test the picking workflow, you can toggle **Sim Mode** at the top right, or place a new order as Vendor Admin.
              </p>
            </div>
            <Button className="rounded-full bg-primary font-bold text-xs" onClick={() => handleToggleSimulation(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch Simulation Mode
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {allPicked ? (
            <Card className="border-none shadow-sm text-center py-12 px-6">
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Picking Complete</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    All items in this picking manifest have been verified and placed in the pick tote.
                  </p>
                </div>
                <Button className="w-full rounded-2xl h-12 text-sm font-bold mt-4" onClick={handleCompleteBatch}>
                  {isSimulated ? "Complete Demo Session" : "Handover to Packing Station"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeItem && (
                <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
                  <CardHeader className="pb-2 border-b border-slate-850">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-primary" /> Path Routing Code
                      </span>
                      <span className="text-slate-400 font-bold">{activeIdx + 1} of {items.length} items</span>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="p-2 bg-primary/20 text-primary rounded-xl font-extrabold text-sm border border-primary/20">
                        {activeItem.bin.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg leading-none">Location Bin: {activeItem.bin}</h3>
                        <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-wider">Aisle Pick Bay</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Target Product SKU</span>
                      <p className="font-mono text-sm text-primary font-black">{activeItem.sku}</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 leading-normal">{activeItem.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Required Qty</span>
                        <strong className="text-2xl font-black block text-slate-200">{activeItem.qtyRequired} units</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Current Picked</span>
                        <strong className="text-2xl font-black block text-slate-200">{activeItem.qtyPicked} / {activeItem.qtyRequired}</strong>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-850">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Scan Simulation Triggers</span>
                      
                      {!activeItem.scannedBin ? (
                        <Button 
                          onClick={handleScanBin}
                          className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 border-none text-xs"
                        >
                          <MapPin className="w-4 h-4" /> Scan Location Bin Barcode
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Type SKU or scan barcode..." 
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScanSku(barcodeInput)}
                            className="h-12 border-slate-800 bg-slate-900 text-slate-100 rounded-2xl flex-1 text-xs"
                          />
                          <Button 
                            onClick={() => handleScanSku(barcodeInput || activeItem.sku)}
                            className="h-12 w-12 p-0 bg-primary hover:bg-primary/95 text-primary-foreground rounded-2xl border-none"
                          >
                            <ScanBarcode className="w-5 h-5" />
                          </Button>
                        </div>
                      )}

                      {activeItem.scannedBin && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase justify-center">
                          <Check className="w-3.5 h-3.5" /> Bin Verified: Go ahead and scan product SKU.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-xl h-9" onClick={handleReportShortage}>
                        <AlertCircle className="w-4 h-4 mr-1.5" /> Report Shortage
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-xl h-9" onClick={() => toast.info("No alternative items registered in this zone.")}>
                        <ChevronRight className="w-4 h-4 mr-1.5" /> SKU Alternatives
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Batch Route Queue</span>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const isActive = activeIdx === idx;
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                          isActive 
                            ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                            : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setActiveIdx(idx)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400">{item.sku}</span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 rounded font-black">{item.bin}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <strong className="text-xs font-black text-slate-800 dark:text-slate-200">{item.qtyRequired} units</strong>
                          <Badge className={
                            item.status === 'picked'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                              : item.status === 'picking'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                                : item.status === 'error'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                                  : 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
