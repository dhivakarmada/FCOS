'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { Barcode, Loader2, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (barcode: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onResult,
  title = 'Scan Barcode',
  description = 'Use a handheld scanner or type the barcode manually.',
}: BarcodeScannerModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [scannedItems, setScannedItems] = React.useState<string[]>([]);
  const [lastScan, setLastScan] = React.useState<string | null>(null);

  const handleScan = React.useCallback(async (barcode: string) => {
    setIsProcessing(true);
    setLastScan(barcode);
    try {
      await onResult(barcode);
      setScannedItems(prev => [barcode, ...prev].slice(0, 5));
      toast.success(`Scanned: ${barcode}`);
    } catch (error: any) {
      if (error.message !== 'MISSING_CONTEXT') {
        toast.error(error.response?.data?.message || error.message || 'Scan failed');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onResult]);

  useBarcodeScanner({
    onScan: handleScan,
    minChars: 3,
  });

  // Reset session when modal closes
  React.useEffect(() => {
    if (!open) {
      setScannedItems([]);
      setLastScan(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 overflow-hidden border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-primary" />
              {title}
            </div>
            {scannedItems.length > 0 && (
              <Badge className="bg-primary text-primary-foreground rounded-full px-3">{scannedItems.length} Scanned</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className={cn(
            "h-28 w-28 rounded-full border-4 border-dashed flex items-center justify-center transition-all duration-500",
            isProcessing ? "border-primary animate-pulse bg-primary/5" : "border-slate-100"
          )}>
            {isProcessing ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : lastScan ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            ) : (
              <Package className="h-10 w-10 text-slate-300" />
            )}
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isProcessing ? 'Syncing...' : lastScan ? `Confirmed: ${lastScan}` : 'Ready to scan...'}
            </p>
          </div>

          {scannedItems.length > 0 && (
            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Scans</p>
              <div className="space-y-1.5">
                {scannedItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                    <span>{item}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={() => onOpenChange(false)} className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/10">
            Finish Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
