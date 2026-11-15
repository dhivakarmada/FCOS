'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  ArrowRightLeft, 
  Truck, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  Plus,
  RefreshCw,
  MapPin,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface WarehouseAllocation {
  id: string;
  name: string;
  location: string;
  allocatedStock: number;
  maxCapacity: number;
  occupiedVolume: number; // cu.ft
  status: 'active' | 'maintenance' | 'restricted';
}

interface TransferRequest {
  id: string;
  sku: string;
  quantity: number;
  source: string;
  destination: string;
  date: string;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
}

const initialAllocations: WarehouseAllocation[] = [
  { id: 'WH-CA-1', name: 'Oakland Logistics Hub', location: 'Oakland, CA', allocatedStock: 560, maxCapacity: 2000, occupiedVolume: 32.5, status: 'active' },
  { id: 'WH-NJ-1', name: 'Secaucus Fulfillment', location: 'Secaucus, NJ', allocatedStock: 320, maxCapacity: 1500, occupiedVolume: 18.2, status: 'active' },
  { id: 'WH-TX-1', name: 'Austin Distribution Center', location: 'Austin, TX', allocatedStock: 250, maxCapacity: 1200, occupiedVolume: 14.8, status: 'active' }
];

const initialTransfers: TransferRequest[] = [
  { id: 'TRF-001', sku: 'PREM-HD-GRY-M', quantity: 50, source: 'WH-CA-1', destination: 'WH-NJ-1', date: '2026-05-24', status: 'in-transit' },
  { id: 'TRF-002', sku: 'ECO-TEE-BLK-S', quantity: 120, source: 'WH-TX-1', destination: 'WH-CA-1', date: '2026-05-20', status: 'completed' },
  { id: 'TRF-003', sku: 'JOG-ATH-BLK-L', quantity: 30, source: 'WH-CA-1', destination: 'WH-TX-1', date: '2026-05-18', status: 'completed' },
];

export default function WarehousesPage() {
  const [allocations, setAllocations] = useState<WarehouseAllocation[]>(initialAllocations);
  const [transfers, setTransfers] = useState<TransferRequest[]>(initialTransfers);
  
  // Transfer Form State
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('');
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !qty || !source || !dest) {
      toast.error("Please fill in all the transfer request details.");
      return;
    }

    if (source === dest) {
      toast.error("Source and Destination warehouses cannot be the same.");
      return;
    }

    const transferQty = parseInt(qty);
    if (isNaN(transferQty) || transferQty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    // Verify stock availability in source warehouse
    const srcWh = allocations.find(w => w.id === source);
    if (srcWh && srcWh.allocatedStock < transferQty) {
      toast.error(`Insufficient stock at ${srcWh.name}. Available allocated: ${srcWh.allocatedStock} units.`);
      return;
    }

    const newTransfer: TransferRequest = {
      id: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: sku.toUpperCase(),
      quantity: transferQty,
      source,
      destination: dest,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Submitting warehouse transfer request...',
        success: () => {
          // Adjust local allocations to reflect mock reservation
          setAllocations(prev => prev.map(w => {
            if (w.id === source) {
              return { ...w, allocatedStock: w.allocatedStock - transferQty };
            }
            return w;
          }));
          setTransfers([newTransfer, ...transfers]);
          setSku('');
          setQty('');
          return `Transfer request ${newTransfer.id} submitted for approval.`;
        },
        error: 'Failed to submit transfer request.',
      }
    );
  };

  const handleCancelTransfer = (id: string) => {
    const trf = transfers.find(t => t.id === id);
    if (!trf) return;

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Cancelling transfer ${id}...`,
        success: () => {
          // Restore reserved stock
          setAllocations(prev => prev.map(w => {
            if (w.id === trf.source) {
              return { ...w, allocatedStock: w.allocatedStock + trf.quantity };
            }
            return w;
          }));
          setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
          return `Transfer ${id} cancelled. Stock restored.`;
        },
        error: 'Failed to cancel transfer.',
      }
    );
  };

  const getWarehouseName = (id: string) => {
    return allocations.find(w => w.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Warehouse Allocations</h2>
          <p className="text-muted-foreground font-medium">Track your product allocations across regional warehouses and coordinate inter-facility stock transfers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-800" onClick={() => toast.info("Refreshing warehouse sync feeds...")}>
            <RefreshCw className="h-4 w-4" /> Refresh Map
          </Button>
        </div>
      </div>

      {/* Warehouse allocation cards grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {allocations.map((w) => {
          const occupancyPct = Math.round((w.allocatedStock / w.maxCapacity) * 100);
          return (
            <Card key={w.id} className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-sm font-bold">{w.name}</CardTitle>
                      <CardDescription className="text-[10px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {w.location}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={
                    w.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }>
                    {w.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">Allocated Stock</span>
                    <strong className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">{w.allocatedStock} units</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">Occupied Volume</span>
                    <strong className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-1">{w.occupiedVolume} cu.ft</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Warehouse Capacity Occupancy</span>
                    <span className="font-bold">{occupancyPct}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 50 ? 'bg-amber-500' : 'bg-primary'}`} 
                      style={{ width: `${occupancyPct}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase pt-1">
                    <span>0</span>
                    <span>Max {w.maxCapacity} units</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Stock Transfer request Form */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Request Stock Transfer
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Shift stock between regional warehouses to align with local sales trends.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Source Warehouse</span>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                      {allocations.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Destination</span>
                  <Select value={dest} onValueChange={setDest}>
                    <SelectTrigger className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select Dest" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-slate-100">
                      {allocations.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Product SKU Code</span>
                <Input 
                  placeholder="e.g. ECO-TEE-BLK-S" 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="h-10 rounded-xl border-slate-850 bg-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Transfer Quantity</span>
                <Input 
                  type="number"
                  placeholder="e.g. 100" 
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-10 rounded-xl border-slate-850 bg-slate-900 text-xs"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full rounded-xl h-10 shadow-lg shadow-primary/20">
                  Submit Transfer Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transfer Logs Table */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Transfer Operations Logs</CardTitle>
            <CardDescription className="text-xs">Immutable audit of current and past stock transfers across operations hubs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Request ID</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">SKU Code</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Route</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Quantity</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((trf) => (
                  <TableRow key={trf.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <TableCell className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 py-4">
                      {trf.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">{trf.sku}</TableCell>
                    <TableCell className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{trf.source.replace('WH-', '')}</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">{trf.destination.replace('WH-', '')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-extrabold text-slate-900 dark:text-slate-100">{trf.quantity} units</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        trf.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] rounded-full'
                          : trf.status === 'in-transit'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[9px] rounded-full'
                            : trf.status === 'cancelled'
                              ? 'bg-slate-500/10 text-slate-500 border-slate-500/20 font-bold text-[9px] rounded-full'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[9px] rounded-full'
                      }>
                        {trf.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {trf.status === 'pending' ? (
                        <Button size="xs" variant="ghost" className="h-7 text-[10px] rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => handleCancelTransfer(trf.id)}>
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-semibold pr-2">
                          <Clock className="w-3 h-3" /> {trf.date}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
