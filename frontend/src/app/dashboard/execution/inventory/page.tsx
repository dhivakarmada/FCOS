'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Warehouse, 
  ScanBarcode, 
  MapPin, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface InventoryTask {
  id: string;
  type: 'Replenishment' | 'Cycle Count' | 'Bin Transfer' | 'Audit';
  sku: string;
  qtyTarget: number;
  qtyAudited?: number;
  sourceLocation: string;
  destLocation?: string;
  status: 'pending' | 'active' | 'completed' | 'mismatch';
}

const initialTasks: InventoryTask[] = [
  { id: 'INV-T-01', type: 'Replenishment', sku: 'ECO-TEE-BLK-S', qtyTarget: 100, sourceLocation: 'Bulk Storage Z-4', destLocation: 'Pick Bin B-12', status: 'pending' },
  { id: 'INV-T-02', type: 'Cycle Count', sku: 'PREM-HD-GRY-M', qtyTarget: 42, sourceLocation: 'Pick Bin C-08', status: 'pending' },
  { id: 'INV-T-03', type: 'Bin Transfer', sku: 'JOG-ATH-BLK-L', qtyTarget: 15, sourceLocation: 'Pick Bin A-24', destLocation: 'Pick Bin B-03', status: 'pending' },
];

export default function InventoryOperationsPage() {
  const [tasks, setTasks] = useState<InventoryTask[]>(initialTasks);
  const [activeIdx, setActiveIdx] = useState(0);
  const [scannedLocation, setScannedLocation] = useState(false);
  const [countInput, setCountInput] = useState('');
  
  const activeTask = tasks[activeIdx];

  const handleScanLocation = () => {
    if (!activeTask) return;
    toast.success(`Location ${activeTask.sourceLocation} verified.`);
    setScannedLocation(true);
    setTasks(prev => prev.map((t, idx) => 
      idx === activeIdx ? { ...t, status: 'active' } : t
    ));
  };

  const handleVerifyCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countInput.trim() || !activeTask) return;

    const count = parseInt(countInput);
    if (isNaN(count) || count < 0) {
      toast.error("Please enter a valid count quantity.");
      return;
    }

    if (count === activeTask.qtyTarget) {
      toast.success("Inventory count verified. Perfect match.");
      setTasks(prev => prev.map((t, idx) => 
        idx === activeIdx ? { ...t, status: 'completed', qtyAudited: count } : t
      ));
    } else {
      toast.warning(`Inventory discrepancy! Expected ${activeTask.qtyTarget}, counted ${count}.`);
      setTasks(prev => prev.map((t, idx) => 
        idx === activeIdx ? { ...t, status: 'mismatch', qtyAudited: count } : t
      ));
    }

    setCountInput('');
    setScannedLocation(false);
    
    // Auto-advance
    setTimeout(() => {
      if (activeIdx < tasks.length - 1) {
        setActiveIdx(prev => prev + 1);
      }
    }, 1000);
  };

  const handleReportDiscrepancy = () => {
    toast.error(`Stock discrepancy reported for SKU ${activeTask?.sku}. Admin notified.`);
    setTasks(prev => prev.map((t, idx) => 
      idx === activeIdx ? { ...t, status: 'mismatch', qtyAudited: 0 } : t
    ));
    if (activeIdx < tasks.length - 1) {
      setActiveIdx(prev => prev + 1);
    }
  };

  const handleReloadTasks = () => {
    toast.info("Re-checking inventory operations task assignment queue...");
    setTasks(initialTasks.map(t => ({ ...t, status: 'pending', qtyAudited: undefined })));
    setActiveIdx(0);
    setScannedLocation(false);
  };

  const allCompleted = tasks.every(t => t.status === 'completed' || t.status === 'mismatch');

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Inventory Ops</h2>
          <p className="text-xs text-muted-foreground font-medium">Replenishments, transfers & cycle counts</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
          Standard Route
        </Badge>
      </div>

      {allCompleted ? (
        <Card className="border-none shadow-sm text-center py-12 px-6">
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tasks Batch Completed</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                All inventory replenishment and audit check routes are verified. Settle logs to pull next assignment list.
              </p>
            </div>
            <Button className="w-full rounded-2xl h-12 text-sm font-bold mt-4" onClick={handleReloadTasks}>
              Pull New Inventory Tasks Queue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Inventory Task Card */}
          {activeTask && (
            <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-850">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450 font-bold">Task {activeIdx + 1} of {tasks.length}</span>
                  <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10 font-bold text-[8px] px-1.5 py-0 uppercase">
                    {activeTask.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2.5 bg-primary/20 text-primary rounded-xl">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-none">{activeTask.sku}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                      Location: {activeTask.sourceLocation}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Route specifics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-950/45 rounded-2xl border border-slate-850">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Source Point</span>
                    <strong className="text-xs font-bold block text-slate-200 mt-0.5">{activeTask.sourceLocation}</strong>
                  </div>
                  {activeTask.destLocation ? (
                    <div className="p-3.5 bg-slate-950/45 rounded-2xl border border-slate-850">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Destination Point</span>
                      <strong className="text-xs font-bold block text-primary mt-0.5">{activeTask.destLocation}</strong>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-950/45 rounded-2xl border border-slate-850">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Target Level</span>
                      <strong className="text-xs font-bold block text-slate-200 mt-0.5">{activeTask.qtyTarget} units</strong>
                    </div>
                  )}
                </div>

                {/* Handheld Scan triggers */}
                <div className="space-y-3 pt-2 border-t border-slate-850">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Verify Location barcode</span>
                  
                  {!scannedLocation ? (
                    <Button 
                      onClick={handleScanLocation}
                      className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 border-none text-xs"
                    >
                      <MapPin className="w-4 h-4" /> Scan Location Tag Checksum
                    </Button>
                  ) : (
                    <form onSubmit={handleVerifyCount} className="flex gap-2">
                      <Input 
                        type="number"
                        placeholder="Count quantity in bin..." 
                        value={countInput}
                        onChange={(e) => setCountInput(e.target.value)}
                        className="h-11 border-slate-800 bg-slate-900 text-slate-100 rounded-2xl flex-1 text-xs"
                      />
                      <Button type="submit" className="h-11 w-11 p-0 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground border-none">
                        <Check className="w-5 h-5" />
                      </Button>
                    </form>
                  )}

                  {scannedLocation && (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase justify-center">
                      <Check className="w-3.5 h-3.5" /> Location check Verified. Input counted stock.
                    </div>
                  )}
                </div>

                {/* Alert buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-xl h-9" onClick={handleReportDiscrepancy}>
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Discrepancy
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-xl h-9" onClick={() => toast.info("Flagging block status...")}>
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Block Bin Space
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active list stack */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Remaining Routes list</span>
            <div className="space-y-2">
              {tasks.map((t, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <div 
                    key={t.id} 
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                      isActive 
                        ? 'border-primary bg-primary/[0.03] dark:bg-primary/[0.015]' 
                        : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                    onClick={() => setActiveIdx(idx)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-slate-450">{t.sku}</span>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-bold text-[8px] py-0.5 px-1.5 rounded-full uppercase">{t.type}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1">Loc: {t.sourceLocation}</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-xs font-black text-slate-700 dark:text-slate-350">{t.qtyTarget} units</strong>
                      <Badge className={
                        t.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                          : t.status === 'mismatch'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                            : t.status === 'active'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                              : 'bg-slate-500/10 text-slate-550 border-slate-500/20 font-bold text-[8px] rounded-full mt-1.5 block'
                      }>
                        {t.status === 'mismatch' ? 'discrepancy' : t.status}
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
