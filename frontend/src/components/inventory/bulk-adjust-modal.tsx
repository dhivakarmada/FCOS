'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Minus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface BulkAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export function BulkAdjustModal({ open, onOpenChange, selectedProducts, onSuccess }: BulkAdjustModalProps) {
  const queryClient = useQueryClient();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  const [bins, setBins] = useState<any[]>([]);
  const [selectedBinId, setSelectedBinId] = useState<string>('');
  
  const [adjustType, setAdjustType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  // Fetch warehouses
  useEffect(() => {
    if (open) {
      api.get('/warehouses')
        .then(({ data }) => {
          setWarehouses(data);
          if (data.length > 0) {
            setSelectedWarehouseId(data[0].id);
          }
        })
        .catch(() => {
          toast.error('Failed to load warehouses');
        });
    }
  }, [open]);

  // Fetch bins when warehouse changes
  useEffect(() => {
    if (selectedWarehouseId) {
      api.get(`/warehouses/${selectedWarehouseId}/bins`)
        .then(({ data }) => {
          setBins(data);
          if (data.length > 0) {
            setSelectedBinId(data[0].id);
          } else {
            setSelectedBinId('');
          }
        })
        .catch(() => {
          toast.error('Failed to load bins for warehouse');
        });
    } else {
      setBins([]);
      setSelectedBinId('');
    }
  }, [selectedWarehouseId]);

  const handleAdjust = async () => {
    if (!selectedWarehouseId) {
      toast.error('Please select a warehouse');
      return;
    }
    if (!selectedBinId) {
      toast.error('Please select a bin or provision bins in Warehouse management');
      return;
    }
    if (changeAmount <= 0) {
      toast.error('Please specify a positive change amount');
      return;
    }

    setIsPending(true);
    try {
      const finalChange = adjustType === 'INBOUND' ? changeAmount : -changeAmount;
      
      // Perform stock updates in parallel for selected products
      const promises = selectedProducts.map((p) => {
        return api.post('/inventory/stock/update', {
          productId: p.id,
          warehouseId: selectedWarehouseId,
          binId: selectedBinId,
          change: finalChange,
          type: adjustType,
          reason: reason || `Bulk adjustment of selected items`,
        });
      });

      await Promise.all(promises);
      
      toast.success(`Successfully adjusted stock for ${selectedProducts.length} items.`);
      onSuccess();
      onOpenChange(false);

      // Invalidate queries to refresh WMS state
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk stock adjustment failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-500" /> Bulk Stock Adjustment
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Apply stock changes to {selectedProducts.length} selected product SKUs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Warehouse</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bin Location</Label>
              <Select value={selectedBinId} onValueChange={setSelectedBinId} disabled={bins.length === 0}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-slate-850 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder={bins.length === 0 ? "No bins available" : "Select Bin"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
                  {bins.map((bin) => (
                    <SelectItem key={bin.id} value={bin.id}>
                      {bin.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Action</Label>
              <div className="flex rounded-xl bg-slate-50 dark:bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setAdjustType('INBOUND')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-all ${
                    adjustType === 'INBOUND' 
                      ? 'bg-white dark:bg-slate-900 shadow text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Inbound
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUTBOUND')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1 transition-all ${
                    adjustType === 'OUTBOUND' 
                      ? 'bg-white dark:bg-slate-900 shadow text-rose-600 dark:text-rose-455' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Outbound
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Quantity Change</Label>
              <Input
                type="number"
                min="1"
                placeholder="100"
                value={changeAmount || ''}
                onChange={(e) => setChangeAmount(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Reason / Reference</Label>
            <Input
              placeholder="Bulk cyclic stock count adjustment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <DialogFooter className="pt-6 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdjust}
            disabled={isPending || changeAmount <= 0}
            className={`rounded-xl font-black px-8 shadow-xl text-white ${
              adjustType === 'INBOUND'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            }`}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Apply Adjustments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
