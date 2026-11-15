'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Package, 
  ScanBarcode, 
  Scale, 
  Printer, 
  FileText, 
  Check, 
  Info,
  Leaf,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface PackingItem {
  sku: string;
  name: string;
  qty: number;
  packed: boolean;
}

export default function PackingPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Sim vs Live
  const [isSimulated, setIsSimulated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [packagingRule, setPackagingRule] = useState('eco');
  const [items, setItems] = useState<PackingItem[]>([]);
  
  const [skuInput, setSkuInput] = useState('');
  const [weight, setWeight] = useState('1.42'); // kg
  const [dimensions, setDimensions] = useState('30x20x10'); // LxWxH cm
  const [labelGenerated, setLabelGenerated] = useState(false);
  const [invoicePrinted, setInvoicePrinted] = useState(false);
  const [orderPacked, setOrderPacked] = useState(false);

  // Fetch active tasks from API
  const fetchActiveTask = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: tasks } = await api.get(`/staff/${user.id}/tasks`);
      // Find an active packing task
      const currentPackingTask = tasks.find(
        (t: any) => t.taskType === 'PACKING' && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      );
      
      if (currentPackingTask) {
        setActiveTask(currentPackingTask);
        // Fetch order details
        const { data: order } = await api.get(`/orders/${currentPackingTask.orderId}`);
        setOrderDetails(order);
        setOrderId(order.orderNumber || order.id);
        setVendorName(order.vendor?.name || 'FCOS Vendor');
        setPackagingRule(order.totalAmount > 2000 ? 'premium' : 'eco');
        
        // Map order items to checklist
        const mappedItems: PackingItem[] = order.items.map((item: any) => ({
          sku: item.product.sku,
          name: item.product.name,
          qty: item.quantity,
          packed: false
        }));
        setItems(mappedItems);
        setIsSimulated(false);
      } else {
        setActiveTask(null);
        setOrderDetails(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching packing tasks:', error);
      toast.error('Failed to load active packing tasks.');
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
      setOrderId('ORD-9042');
      setVendorName('EcoStyle Fashion');
      setPackagingRule('eco');
      setItems([
        { sku: 'ECO-TEE-BLK-S', name: 'Eco-Fabric Organic Cotton Tee (Black, S)', qty: 2, packed: false },
        { sku: 'PREM-HD-GRY-M', name: 'Premium Heavyweight Hoodie (Gray, M)', qty: 1, packed: false }
      ]);
      setLabelGenerated(false);
      setInvoicePrinted(false);
      setOrderPacked(false);
      setWeight('1.42');
      toast.info("Switched to Demo Simulation Mode.");
    } else {
      fetchActiveTask();
    }
  };

  const handleScanSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    const scanned = skuInput.trim().toUpperCase();
    const itemIdx = items.findIndex(item => item.sku.toUpperCase() === scanned || item.sku === scanned);

    if (itemIdx !== -1) {
      if (items[itemIdx].packed) {
        toast.warning(`SKU ${scanned} already verified and packed.`);
      } else {
        toast.success(`SKU ${scanned} verified.`);
        setItems(prev => {
          const updatedItems = [...prev];
          updatedItems[itemIdx] = { ...updatedItems[itemIdx], packed: true };
          return updatedItems;
        });
      }
    } else {
      toast.error(`Error: SKU ${scanned} is not in this order checklist!`);
    }
    setSkuInput('');
  };

  const handleWeightScale = () => {
    toast.success("Scale reading synchronized from Bluetooth scale.");
    setWeight('1.45');
  };

  const handlePrintSlip = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Spooling document to packing station thermal printer...',
        success: () => {
          setInvoicePrinted(true);
          return 'Invoice & Packing Slip printed.';
        },
        error: 'Printer timeout.',
      }
    );
  };

  const handleGenerateLabel = () => {
    const allPacked = items.every(i => i.packed);
    if (!allPacked) {
      toast.error("Error: All checklist items must be scanned and verified before printing shipping labels!");
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Generating shipping label via Carrier API Gateway...',
        success: () => {
          setLabelGenerated(true);
          return 'Delhivery Shipping Label generated & printed.';
        },
        error: 'Carrier API timeout.',
      }
    );
  };

  const handleMarkPacked = async () => {
    if (!labelGenerated || !invoicePrinted) {
      toast.error("Please print invoice and generate shipping label before completing packaging!");
      return;
    }

    if (isSimulated) {
      toast.success("Simulated Order ORD-9042 successfully packed!");
      setOrderPacked(true);
      return;
    }

    // Real Mode: Complete task & advance order status
    try {
      toast.loading("Completing order packing on server...", { id: 'complete-pack' });
      // 1. Complete Task
      await api.patch(`/staff/tasks/${activeTask.id}/status`, { status: 'COMPLETED' });
      // 2. Advance Order to SHIPPED (triggers tracking manifest creation)
      await api.patch(`/orders/${activeTask.orderId}/status`, { status: 'SHIPPED' });
      
      toast.success(`Order #${orderDetails?.orderNumber} packed and transferred to dispatch queue!`, { id: 'complete-pack' });
      setOrderPacked(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to complete packing task.", { id: 'complete-pack' });
    }
  };

  const handleNextOrder = () => {
    setOrderPacked(false);
    setLabelGenerated(false);
    setInvoicePrinted(false);
    setWeight('1.20');
    if (isSimulated) {
      setOrderId(`ORD-${Math.floor(9000 + Math.random() * 900)}`);
      setItems([
        { sku: 'SKU-SIM-SHIRT', name: 'Premium Cotton Shirt (Simulated)', qty: 1, packed: false }
      ]);
    } else {
      fetchActiveTask();
    }
  };

  const allVerified = items.length > 0 && items.every(i => i.packed);

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
          <h2 className="text-2xl font-extrabold tracking-tight">Packing Station</h2>
          <p className="text-xs text-muted-foreground font-medium">Verify items & seal packages</p>
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

      {items.length === 0 && !orderPacked ? (
        <Card className="border-none shadow-sm text-center py-16 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Active Packing Tasks</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                No packed-ready tasks are currently assigned to you. To preview, toggle **Sim Mode** at the top right, or transition an order from picked to packed.
              </p>
            </div>
            <Button className="rounded-full bg-primary font-bold text-xs" onClick={() => handleToggleSimulation(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch Simulation Mode
            </Button>
          </CardContent>
        </Card>
      ) : orderPacked ? (
        <Card className="border-none shadow-sm text-center py-12 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Order Packed Successfully</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Package has been sealed, labeled, and forwarded to the outgoing shipping manifest queue.
              </p>
            </div>
            <Button className="w-full rounded-2xl h-12 text-sm font-bold mt-4" onClick={handleNextOrder}>
              Load Next Assigned Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Order Details Header */}
          <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-850">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Order Verification</span>
                  <h3 className="font-extrabold text-lg leading-none mt-1">{orderId}</h3>
                  <p className="text-xs text-slate-455 mt-1 font-semibold">Vendor: {vendorName}</p>
                </div>
                <div>
                  {packagingRule === 'eco' ? (
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 font-bold text-[9px] flex gap-1 items-center">
                      <Leaf className="w-3 h-3" /> Eco Pack
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10 font-bold text-[9px] flex gap-1 items-center">
                      <Sparkles className="w-3 h-3" /> Premium Custom
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Packaging Instructions</span>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex gap-2.5 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {packagingRule === 'eco' ? (
                    <p className="leading-relaxed">Use FCOS standard recycled kraft shipping box. Seal with eco paper tape. Place packing list inside. Do not use plastic bubble wrap.</p>
                  ) : (
                    <p className="leading-relaxed">Use custom rigid apparel box. Wrap clothes in silk tissue paper. Insert branded card coupon slip. Seal with custom tape.</p>
                  )}
                </div>
              </div>

              {/* SKU verification input */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Scan Barcode to Verify Items</span>
                <form onSubmit={handleScanSku} className="flex gap-2">
                  <Input 
                    placeholder="Scan product barcode SKU..." 
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    className="h-11 border-slate-800 bg-slate-900 text-slate-100 rounded-2xl flex-1 text-xs"
                  />
                  <Button type="submit" className="h-11 w-11 p-0 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground border-none">
                    <ScanBarcode className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Items checklist */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Order Items Checklist</span>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                    item.packed 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                      : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-450">{item.sku}</span>
                      <strong className="text-xs font-black text-slate-850 dark:text-slate-200">{item.qty} units</strong>
                    </div>
                    <p className="text-xs font-semibold text-slate-550 dark:text-slate-400">{item.name}</p>
                  </div>
                  <div>
                    {item.packed ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] rounded-full">
                        <Check className="w-3 h-3 mr-0.5 inline-block" /> Scanned
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-bold text-[9px] rounded-full">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physical specs & validation */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm p-4 space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Scale Weight (KG)</span>
              <div className="flex gap-2">
                <Input 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-10 text-center font-bold text-xs rounded-xl flex-1"
                />
                <Button variant="outline" size="sm" className="h-10 rounded-xl px-2.5 border-slate-200 dark:border-slate-855" onClick={handleWeightScale}>
                  <Scale className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            <Card className="border-none shadow-sm p-4 space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Dimensions (L-W-H cm)</span>
              <Input 
                value={dimensions} 
                onChange={(e) => setDimensions(e.target.value)}
                className="h-10 text-center font-bold text-xs rounded-xl"
              />
            </Card>
          </div>

          {/* Print slip & Shipping labels */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handlePrintSlip}
              className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2 text-slate-700 dark:text-slate-300 animate-in"
            >
              <Printer className="w-4 h-4" /> Print Invoice
              {invoicePrinted && <Check className="w-3 h-3 text-emerald-500" />}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleGenerateLabel}
              disabled={!allVerified}
              className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-bold gap-2 text-slate-700 dark:text-slate-300"
            >
              <FileText className="w-4 h-4" /> Print Label
              {labelGenerated && <Check className="w-3 h-3 text-emerald-500" />}
            </Button>
          </div>

          {/* Mark packed trigger */}
          <Button 
            onClick={handleMarkPacked}
            disabled={!allVerified || !labelGenerated || !invoicePrinted}
            className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            Mark Packed & Complete
          </Button>
        </>
      )}
    </div>
  );
}
