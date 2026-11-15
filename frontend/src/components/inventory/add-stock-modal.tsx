'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { useWarehouse } from '@/hooks/use-warehouse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Barcode, AlertTriangle } from 'lucide-react';
import { BarcodeScannerModal } from '../logistics/barcode-scanner-modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductId?: string;
}

export function AddStockModal({ open, onOpenChange, initialProductId }: AddStockModalProps) {
  const { products, updateStock, scanIn } = useInventory();
  const { warehouses } = useWarehouse();
  
  const [isScanMode, setIsScanMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedBinId, setSelectedBinId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('Stock Inbound');

  // Sync initialProductId when it changes
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  // Auto-select first warehouse when warehouses list is loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const selectedWarehouse = warehouses?.find((w: any) => w.id === selectedWarehouseId);

  // Auto-select first bin when warehouse changes
  useEffect(() => {
    if (selectedWarehouse && selectedWarehouse.bins && selectedWarehouse.bins.length > 0) {
      const isValid = selectedWarehouse.bins.some((b: any) => b.id === selectedBinId);
      if (!isValid) {
        setSelectedBinId(selectedWarehouse.bins[0].id);
      }
    } else {
      setSelectedBinId('');
    }
  }, [selectedWarehouse, selectedBinId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedWarehouseId || !selectedBinId || quantity <= 0) return;

    await updateStock.mutateAsync({
      productId: selectedProductId,
      warehouseId: selectedWarehouseId,
      binId: selectedBinId,
      change: quantity,
      type: 'INBOUND',
      reason,
    });

    onOpenChange(false);
    resetForm();
  };

  const handleScanResult = async (barcode: string) => {
    if (!selectedWarehouseId || !selectedBinId) {
      toast.error('Please select warehouse and bin before scanning');
      throw new Error('MISSING_CONTEXT');
    }

    await scanIn.mutateAsync({
      barcode,
      quantity: 1,
      warehouseId: selectedWarehouseId,
      binId: selectedBinId,
      reason: 'Batch Scan Inbound'
    });
  };

  const resetForm = () => {
    setSelectedProductId('');
    setSelectedWarehouseId('');
    setSelectedBinId('');
    setQuantity(0);
    setReason('Stock Inbound');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Inbound Stock
              </DialogTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("rounded-xl gap-2", isScanMode && "bg-primary text-primary-foreground border-primary")}
                onClick={() => setIsScanMode(true)}
              >
                <Barcode className="w-4 h-4" /> Scan Mode
              </Button>
            </div>
            <DialogDescription className="font-medium text-slate-500">
              Add physical stock to an existing product in a specific warehouse bin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {(!warehouses || warehouses.length === 0) && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No Warehouses Registered</p>
                  <p className="font-medium text-rose-750/80 mt-0.5">Please register a warehouse and provision bins on the Warehouse menu first.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Warehouse</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {warehouses?.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bin</Label>
                <Select 
                  value={selectedBinId} 
                  onValueChange={setSelectedBinId}
                  disabled={!selectedWarehouseId}
                >
                  <SelectTrigger className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold">
                    <SelectValue placeholder="Bin #" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {selectedWarehouse?.bins?.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold">
                  <SelectValue placeholder="Choose a SKU..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {products?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-bold">{p.sku}</span>
                        <span className="text-[10px] opacity-60">{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-bold"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(e.target.value === '' ? 0 : parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</Label>
                <Input
                  placeholder="Batch # / PO #"
                  className="rounded-xl bg-muted/60 dark:bg-muted/40 border-none h-11 font-semibold"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateStock.isPending || !selectedBinId || !selectedProductId}
                className="rounded-xl font-black bg-primary px-8 shadow-xl shadow-primary/20"
              >
                {updateStock.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Confirm Inbound'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal 
        open={isScanMode} 
        onOpenChange={setIsScanMode} 
        onResult={handleScanResult}
        title="Inbound Batch Scanning"
        description="Select a warehouse/bin first, then scan items to instantly inbound them."
      />
    </>
  );
}
