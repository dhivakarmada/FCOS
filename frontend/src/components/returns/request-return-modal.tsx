'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturns } from '@/hooks/use-returns';
import { useOrders } from '@/hooks/use-orders';
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react';

interface RequestReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

export function RequestReturnModal({ open, onOpenChange, orderId: initialOrderId }: RequestReturnModalProps) {
  const { requestReturn } = useReturns();
  const { orders } = useOrders({ status: 'DELIVERED' });
  
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !reason) return;

    await requestReturn.mutateAsync({ orderId, reason });
    onOpenChange(false);
    setReason('');
    if (!initialOrderId) setOrderId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-500" />
            Request Return
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Initiate a reverse logistics workflow for a delivered order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Target Order</Label>
              {initialOrderId ? (
                <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-bold text-sm">
                  Order ID: {initialOrderId.substring(0, 8).toUpperCase()}
                </div>
              ) : (
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger className="rounded-xl h-11 border-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm font-semibold">
                    <SelectValue placeholder="Select Delivered Order" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                    {orders?.orders?.filter((o: any) => o.status === 'DELIVERED').map((o: any) => (
                      <SelectItem key={o.id} value={o.id} className="rounded-xl py-3">
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="font-bold">{o.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{o.customerName}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {(!orders?.orders || orders.orders.length === 0) && (
                      <div className="p-4 text-center text-xs text-slate-400">No delivered orders available for return</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Reason for Return</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="rounded-xl h-11 border-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm font-semibold">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                  <SelectItem value="DAMAGED" className="rounded-xl">Damaged Item</SelectItem>
                  <SelectItem value="WRONG_ITEM" className="rounded-xl">Wrong Item Received</SelectItem>
                  <SelectItem value="QUALITY_ISSUE" className="rounded-xl">Quality Not as Expected</SelectItem>
                  <SelectItem value="SIZE_MISMATCH" className="rounded-xl">Size/Fit Issue</SelectItem>
                  <SelectItem value="NOT_NEEDED" className="rounded-xl">No Longer Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
              Returns are only eligible within 7 days of delivery. Submitting this request will notify the warehouse for QC inspection.
            </p>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-805 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold px-6 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={requestReturn.isPending || !orderId || !reason}
              className="rounded-xl font-black bg-rose-500 hover:bg-rose-600 text-white px-10 shadow-xl shadow-rose-500/20 h-12"
            >
              {requestReturn.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
