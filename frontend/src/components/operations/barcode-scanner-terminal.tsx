import { useState, useEffect, useRef } from 'react';
import { useBarcode, BarcodeActionType } from '@/hooks/use-barcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanBarcode, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export function BarcodeScannerTerminal() {
  const [code, setCode] = useState('');
  const [actionType, setActionType] = useState<BarcodeActionType>('STOCK_IN');
  const [warehouseId, setWarehouseId] = useState('wh_1'); // Default for demo
  const [binId, setBinId] = useState('bin_1'); // Default for demo
  const [orderId, setOrderId] = useState('');
  const [lastScan, setLastScan] = useState<{ status: 'success' | 'error', message: string, time: Date } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { scanBarcode, isLoading } = useBarcode();

  // Keep focus on input for physical scanner
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        inputRef.current?.focus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const playBeep = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); // Low buzz
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Audio beep failed', e);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    scanBarcode.mutate(
      { code, actionType, warehouseId, binId, orderId: orderId || undefined },
      {
        onSuccess: (data) => {
          playBeep('success');
          setLastScan({ status: 'success', message: `Processed: ${data.product?.sku || code}`, time: new Date() });
          setCode('');
        },
        onError: (err: any) => {
          playBeep('error');
          setLastScan({ status: 'error', message: err.response?.data?.message || 'Scan Failed', time: new Date() });
          setCode('');
        }
      }
    );
  };

  return (
    <Card className="shadow-lg border-none bg-slate-900 text-slate-100 rounded-3xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <CardHeader className="border-b border-slate-800 p-6 relative z-10">
        <CardTitle className="text-xl flex items-center gap-3 text-white">
          <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
            <ScanBarcode className="w-6 h-6" />
          </div>
          RF Terminal Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 relative z-10 space-y-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Operation Mode</Label>
              <Select value={actionType} onValueChange={(v: BarcodeActionType) => setActionType(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white font-medium h-12">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="STOCK_IN">STOCK IN (Restock)</SelectItem>
                  <SelectItem value="STOCK_OUT">STOCK OUT (Pick)</SelectItem>
                  <SelectItem value="DISPATCH">DISPATCH (Ship)</SelectItem>
                  <SelectItem value="RETURN_VERIFY">RETURN VERIFY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(actionType === 'DISPATCH' || actionType === 'RETURN_VERIFY') && (
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Order ID (Context)</Label>
                <Input 
                  placeholder="Scan or type Order ID" 
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono h-12"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              Scan Barcode <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
            </Label>
            <Input 
              ref={inputRef}
              autoFocus
              placeholder="Waiting for scanner input..." 
              value={code} 
              onChange={e => setCode(e.target.value)}
              className="bg-slate-950 border-slate-800 text-green-400 font-mono text-2xl h-16 px-6 tracking-widest ring-offset-slate-900 focus-visible:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="hidden">Submit</button>
        </form>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 min-h-[100px] flex flex-col justify-center">
          {lastScan ? (
            <div className={`flex items-start gap-3 ${lastScan.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lastScan.status === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" /> : <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />}
              <div>
                <p className="font-mono text-lg font-bold">{lastScan.message}</p>
                <p className="text-slate-500 text-xs">{lastScan.time.toLocaleTimeString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-slate-600 gap-2 font-medium">
              <Activity className="w-5 h-5 animate-pulse" /> Ready for scan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
