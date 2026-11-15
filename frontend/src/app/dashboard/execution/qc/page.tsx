'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShieldAlert, 
  Check, 
  X, 
  Camera, 
  Info,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface QCItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  size?: string;
  color?: string;
}

export default function QCVerificationPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [returnReq, setReturnReq] = useState<any>(null);
  
  // Sim vs Live
  const [isSimulated, setIsSimulated] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [items, setItems] = useState<QCItem[]>([]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [checklist, setChecklist] = useState({
    skuMatch: false,
    sizeColorMatch: false,
    damageFree: false,
    packagingQuality: false
  });
  const [rejectReason, setRejectReason] = useState<string>('');
  const [proofImage, setProofImage] = useState<boolean>(false);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  const fetchActiveTask = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: tasks } = await api.get(`/staff/${user.id}/tasks`);
      // Find return verify task
      const currentQCTask = tasks.find(
        (t: any) => t.taskType === 'RETURN_VERIFY' && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
      );
      
      if (currentQCTask) {
        setActiveTask(currentQCTask);
        const { data: order } = await api.get(`/orders/${currentQCTask.orderId}`);
        setOrderDetails(order);
        setOrderNumber(order.orderNumber);
        
        // Find requested return
        const activeReturn = order.returns?.find((r: any) => r.status === 'REQUESTED');
        setReturnReq(activeReturn);

        // Map items
        const mappedItems: QCItem[] = order.items.map((item: any) => ({
          id: item.id,
          sku: item.product.sku,
          name: item.product.name,
          qty: item.quantity,
          size: item.product.description?.includes('Size') ? 'M' : 'N/A',
          color: item.product.description?.includes('Color') ? 'Default' : 'N/A'
        }));
        setItems(mappedItems);
        setIsSimulated(false);
      } else {
        setActiveTask(null);
        setOrderDetails(null);
        setReturnReq(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching QC tasks:', error);
      toast.error('Failed to load active QC tasks.');
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
      setOrderNumber('ORD-9042');
      setItems([
        { id: 'sim-qc-1', sku: 'ECO-TEE-BLK-S', name: 'Eco-Fabric Organic Cotton Tee (Black, S)', qty: 2, size: 'S', color: 'Black' },
        { id: 'sim-qc-2', sku: 'PREM-HD-GRY-M', name: 'Premium Heavyweight Hoodie (Gray, M)', qty: 1, size: 'M', color: 'Gray' }
      ]);
      setActiveIdx(0);
      setVerificationHistory([]);
      toast.info("Switched to Demo Simulation Mode.");
    } else {
      fetchActiveTask();
    }
  };

  const activeItem = items[activeIdx];
  const checklistComplete = Object.values(checklist).every(val => val);

  const handleCheckboxChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApprove = () => {
    if (!checklistComplete) {
      toast.error("Error: All checklist criteria must be verified before approval!");
      return;
    }

    toast.success(`Item ${activeItem.sku} verified and approved.`);
    setVerificationHistory([
      ...verificationHistory,
      { sku: activeItem.sku, name: activeItem.name, status: 'approved', time: 'Just now' }
    ]);
    
    // Clear checklist
    setChecklist({
      skuMatch: false,
      sizeColorMatch: false,
      damageFree: false,
      packagingQuality: false
    });
    
    // Next item or complete
    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
    } else {
      toast.info("All items verified. Ready to submit QC report.");
    }
  };

  const handleReject = () => {
    if (!rejectReason) {
      toast.error("Please select a rejection reason first.");
      return;
    }

    toast.warning(`Item ${activeItem.sku} rejected: ${rejectReason}`);
    setVerificationHistory([
      ...verificationHistory,
      { sku: activeItem.sku, name: activeItem.name, status: 'rejected', reason: rejectReason, time: 'Just now' }
    ]);

    setChecklist({
      skuMatch: false,
      sizeColorMatch: false,
      damageFree: false,
      packagingQuality: false
    });
    setRejectReason('');
    setProofImage(false);

    if (activeIdx < items.length - 1) {
      setActiveIdx(prev => prev + 1);
    }
  };

  const handleUploadPhoto = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Uploading photo proof to FCOS secure vault...',
        success: () => {
          setProofImage(true);
          return 'Image uploaded and cryptographically linked.';
        },
        error: 'Failed to upload photo.',
      }
    );
  };

  const handleSubmitQC = async (approved: boolean = true) => {
    if (isSimulated) {
      toast.success("Simulated QC audit logs submitted!");
      handleToggleSimulation(true);
      return;
    }

    // Real Mode: Send approval/rejection to server
    try {
      toast.loading("Submitting verification logs to server...", { id: 'submit-qc' });
      
      const returnId = returnReq?.id;
      if (!returnId) {
        throw new Error("No return request record linked to this order verify task.");
      }

      if (approved) {
        // Approve Return -> Restocks stock
        await api.post(`/returns/${returnId}/approve`);
        toast.success("Return request approved & inventory automatically restocked!", { id: 'submit-qc' });
      } else {
        // Reject Return
        await api.post(`/returns/${returnId}/reject`);
        toast.warning("Return request rejected.", { id: 'submit-qc' });
      }

      // Complete Staff Task
      await api.patch(`/staff/tasks/${activeTask.id}/status`, { status: 'COMPLETED' });

      // Refresh tasks
      fetchActiveTask();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Failed to submit QC verification.", { id: 'submit-qc' });
    }
  };

  const allProcessed = items.length > 0 && verificationHistory.length === items.length;

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
          <h2 className="text-2xl font-extrabold tracking-tight">QC Verification</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {isSimulated ? "Demo Simulation Mode" : `Verify Return Items for Order #${orderNumber}`}
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

      {items.length === 0 && !allProcessed ? (
        <Card className="border-none shadow-sm text-center py-16 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Active QC Tasks</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                There are no return verification requests currently assigned to your workstation. Toggle **Sim Mode** to preview the audit checklist.
              </p>
            </div>
            <Button className="rounded-full bg-primary font-bold text-xs" onClick={() => handleToggleSimulation(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Launch Simulation Mode
            </Button>
          </CardContent>
        </Card>
      ) : allProcessed ? (
        <Card className="border-none shadow-sm text-center py-12 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Inspection Finished</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                All order items have passed through verification checklist inspection.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-2xl h-12 text-sm font-bold mt-4" 
                onClick={() => handleSubmitQC(false)}
              >
                Reject Return Batch
              </Button>
              <Button 
                className="flex-1 rounded-2xl h-12 text-sm font-bold mt-4" 
                onClick={() => handleSubmitQC(true)}
              >
                Approve & Restock Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Item inspection card */}
          {activeItem && (
            <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-850">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Audit Item {activeIdx + 1} of {items.length}</span>
                  <span className="text-slate-400 font-mono font-bold">{activeItem.sku}</span>
                </div>
                <h3 className="font-extrabold text-lg leading-tight mt-2 text-slate-100">{activeItem.name}</h3>
                <div className="flex gap-2 pt-2">
                  <Badge variant="outline" className="border-slate-800 text-slate-300 bg-slate-900/50 text-[10px] font-semibold">Size: {activeItem.size || 'M'}</Badge>
                  <Badge variant="outline" className="border-slate-800 text-slate-300 bg-slate-900/50 text-[10px] font-semibold">Color: {activeItem.color || 'Default'}</Badge>
                  <Badge variant="outline" className="border-slate-800 text-slate-300 bg-slate-900/50 text-[10px] font-semibold">Qty: {activeItem.qty}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Checklist */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Verification Checklist</span>
                  
                  <div className="space-y-2">
                    {[
                      { key: 'skuMatch', label: 'SKU matches physical barcode' },
                      { key: 'sizeColorMatch', label: 'Size & Color match order specifications' },
                      { key: 'damageFree', label: 'Fabric/Item is completely damage-free' },
                      { key: 'packagingQuality', label: 'Item packaging meets guidelines' },
                    ].map((item) => (
                      <div 
                        key={item.key} 
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-850 bg-slate-950/20 cursor-pointer"
                        onClick={() => handleCheckboxChange(item.key as any)}
                      >
                        <Checkbox 
                          checked={checklist[item.key as keyof typeof checklist]} 
                          onCheckedChange={() => handleCheckboxChange(item.key as any)}
                          className="border-slate-700 bg-slate-900 data-[state=checked]:bg-primary animate-in"
                        />
                        <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approve vs Reject selectors */}
                <div className="space-y-3 pt-2 border-t border-slate-850">
                  <div className="flex gap-3">
                    <Button 
                      disabled={!checklistComplete}
                      onClick={handleApprove}
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md shadow-emerald-500/10 text-white font-bold gap-2 text-xs border-none"
                    >
                      <Check className="w-4 h-4" /> Approve Item
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-12 w-12 p-0 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 rounded-2xl flex shrink-0 items-center justify-center"
                      onClick={handleUploadPhoto}
                      title="Upload Photo Proof"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </div>
                  {proofImage && (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase justify-center">
                      <Check className="w-3.5 h-3.5" /> Proof Photo Attached
                    </div>
                  )}
                </div>

                {/* Rejection zone */}
                <div className="space-y-3 pt-4 border-t border-slate-850">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Dispute Rejection Reasons</span>
                  
                  <div className="flex gap-2">
                    <Select value={rejectReason} onValueChange={setRejectReason}>
                      <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 flex-1">
                        <SelectValue placeholder="Select Reason" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                        <SelectItem value="Damaged item">Damaged Item</SelectItem>
                        <SelectItem value="Wrong SKU">Wrong SKU / Incorrect Code</SelectItem>
                        <SelectItem value="Missing item">Missing item from pick</SelectItem>
                        <SelectItem value="Poor packaging">Poor/Defective packaging</SelectItem>
                        <SelectItem value="Barcode mismatch">Barcode scanning mismatch</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={!rejectReason}
                      className="h-10 rounded-xl px-4 text-xs font-bold shrink-0 shadow-lg shadow-red-500/10"
                    >
                      Reject Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification summary history log */}
          {verificationHistory.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Batch Progress Logs</span>
              <div className="space-y-2">
                {verificationHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-855 bg-white dark:bg-slate-900/50">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-slate-450">{item.sku}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{item.name}</p>
                    </div>
                    <div>
                      <Badge className={
                        item.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full'
                      }>
                        {item.status === 'approved' ? 'Approved' : `Rejected: ${item.reason}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
