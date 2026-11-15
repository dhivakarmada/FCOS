'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RotateCcw, 
  ScanBarcode, 
  Camera, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Archive,
  Ban,
  FileImage,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ReturnItem {
  id: string;
  orderId: string;
  sku: string;
  name: string;
  reason: string;
  status: 'Received' | 'QC Pending' | 'Approved' | 'Rejected' | 'Restocked' | 'Damaged';
}

const initialReturns: ReturnItem[] = [
  { id: 'RET-5501', orderId: 'ORD-8812', sku: 'ECO-TEE-BLK-S', name: 'Eco-Fabric Organic Cotton Tee (Black, S)', reason: 'Wrong Size ordered', status: 'QC Pending' },
  { id: 'RET-5502', orderId: 'ORD-8798', sku: 'PREM-HD-GRY-M', name: 'Premium Heavyweight Hoodie (Gray, M)', reason: 'Item felt too heavy', status: 'QC Pending' },
];

export default function ReturnsProcessingPage() {
  const [returnsList, setReturnsList] = useState<ReturnItem[]>(initialReturns);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scanInput, setScanInput] = useState('');
  const [grade, setGrade] = useState<'restock' | 'damaged' | 'rtv'>('restock');
  const [proofImage, setProofImage] = useState(false);
  const [processingDone, setProcessingDone] = useState(false);

  const activeReturn = returnsList[activeIdx];

  const handleScanReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const cleanedScan = scanInput.trim().toUpperCase();
    const itemIdx = returnsList.findIndex(r => r.id === cleanedScan || r.orderId === cleanedScan || r.sku === cleanedScan);

    if (itemIdx !== -1) {
      setActiveIdx(itemIdx);
      setProcessingDone(false);
      toast.success(`Return item ${returnsList[itemIdx].id} loaded for inspection.`);
    } else {
      toast.error(`Error: Return tracking label "${cleanedScan}" not found.`);
    }
    setScanInput('');
  };

  const handleUploadPhoto = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Uploading return damage verification photo...',
        success: () => {
          setProofImage(true);
          return 'Damage proof photo attached to return history.';
        },
        error: 'Failed to upload photo.',
      }
    );
  };

  const handleFinalizeReturn = () => {
    if (!activeReturn) return;

    const statusMap: Record<string, 'Restocked' | 'Damaged' | 'Rejected'> = {
      restock: 'Restocked',
      damaged: 'Damaged',
      rtv: 'Rejected' // Return to vendor/rejected
    };

    const targetStatus = statusMap[grade];

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Filing inspection report and restocking items...',
        success: () => {
          setReturnsList(prev => prev.map((r, idx) => 
            idx === activeIdx ? { ...r, status: targetStatus } : r
          ));
          setProcessingDone(true);
          setProofImage(false);
          return `Return ${activeReturn.id} processed successfully: Marked as ${targetStatus}.`;
        },
        error: 'Failed to process return.',
      }
    );
  };

  const allProcessed = returnsList.every(r => r.status !== 'QC Pending');

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Returns Desk</h2>
          <p className="text-xs text-muted-foreground font-medium">Scan returned packages & check item quality</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
          Reverse Logistics
        </Badge>
      </div>

      {/* Return Scan Form */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleScanReturn} className="flex gap-2">
            <Input 
              placeholder="Scan Return Label Barcode (RET-xxxx)..." 
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="h-11 border-slate-200 dark:border-slate-800 bg-transparent text-xs rounded-2xl flex-1"
            />
            <Button type="submit" className="h-11 w-11 p-0 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground border-none">
              <ScanBarcode className="w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {allProcessed ? (
        <Card className="border-none shadow-sm text-center py-12 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Returns Cleared</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No pending reverse logistics items in your queue. Ready to receive new arrivals.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active inspection console */}
          {activeReturn && !processingDone && (
            <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-850">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450 font-bold">Return Reference: {activeReturn.id}</span>
                  <Badge variant="outline" className="border-slate-800 text-slate-300 bg-slate-900/50 text-[9px] uppercase font-bold">
                    Reason: {activeReturn.reason}
                  </Badge>
                </div>
                <h3 className="font-extrabold text-lg leading-none mt-2">{activeReturn.name}</h3>
                <p className="text-[10px] text-slate-450 mt-1 font-semibold">Associated Order: {activeReturn.orderId}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                {/* Condition grading */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Grading & Classification</span>
                  <Select value={grade} onValueChange={(val: any) => setGrade(val)}>
                    <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                      <SelectItem value="restock">Grade A: Restock to inventory</SelectItem>
                      <SelectItem value="damaged">Grade C: Damaged (Quarantine)</SelectItem>
                      <SelectItem value="rtv">Grade D: Mismatch / Return to Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Photo upload trigger */}
                <div className="space-y-3 pt-2 border-t border-slate-850">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Attach Condition Proof Photo</span>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUploadPhoto}
                      className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 border border-slate-800 text-xs"
                    >
                      <Camera className="w-4 h-4" /> Take / Upload Quality Photo
                    </Button>
                  </div>

                  {proofImage && (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase justify-center">
                      <Check className="w-3.5 h-3.5" /> Condition Proof attached
                    </div>
                  )}
                </div>

                {/* Finalize return */}
                <div className="pt-2 border-t border-slate-850">
                  <Button 
                    onClick={handleFinalizeReturn}
                    className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20"
                  >
                    Confirm & File Returns Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Returns list log */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Returned Items Logs</span>
            <div className="space-y-2">
              {returnsList.map((item, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                      isActive 
                        ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                        : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                    onClick={() => {
                      setActiveIdx(idx);
                      setProcessingDone(false);
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-slate-450">{item.id}</span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Order: {item.orderId}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{item.name}</p>
                    </div>
                    <div>
                      <Badge className={
                        item.status === 'Restocked' || item.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full'
                          : item.status === 'Damaged' || item.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[8px] rounded-full'
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
    </div>
  );
}
