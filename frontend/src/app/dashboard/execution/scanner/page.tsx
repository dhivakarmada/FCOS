'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ScanBarcode, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  Clock, 
  Smartphone,
  Zap,
  Radio
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';

interface ScanLog {
  id: string;
  scannedCode: string;
  type: 'SKU' | 'Location Bin' | 'Courier Label' | 'Unknown';
  status: 'valid' | 'invalid';
  timestamp: string;
  details: string;
}

export default function ScannerPage() {
  const [logs, setLogs] = useState<ScanLog[]>([]); // Cleared initial dummy history
  const [scanInput, setScanInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const code = scanInput.trim().toUpperCase();
    setScanning(true);

    let type: 'SKU' | 'Location Bin' | 'Courier Label' | 'Unknown' = 'Unknown';
    let status: 'valid' | 'invalid' = 'invalid';
    let details = 'Code not found in warehouse registry.';

    try {
      // 1. Check if SKU exists in product database
      try {
        const { data: product } = await api.get(`/inventory/products/${code}`);
        if (product) {
          type = 'SKU';
          status = 'valid';
          const stock = product.inventory?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
          details = `Product SKU Verified: "${product.name}". Total stock: ${stock} units.`;
        }
      } catch (err) {
        // Not a product, continue checks
      }

      // 2. Check if Location Bin exists
      if (status === 'invalid') {
        const { data: warehouses } = await api.get('/warehouses');
        let foundBin: any = null;
        let foundWHName = '';
        
        for (const wh of warehouses) {
          const bin = wh.bins?.find((b: any) => b.code.toUpperCase() === code || b.code === code);
          if (bin) {
            foundBin = bin;
            foundWHName = wh.name;
            break;
          }
        }

        if (foundBin) {
          type = 'Location Bin';
          status = 'valid';
          details = `Location Bin verified in facility "${foundWHName}".`;
        }
      }

      // 3. Check if Courier / Order number
      if (status === 'invalid') {
        const { data: ordersData } = await api.get('/orders');
        const orders = ordersData.orders || [];
        const order = orders.find(
          (o: any) => o.orderNumber === code || o.shipment?.trackingNumber === code
        );

        if (order) {
          type = 'Courier Label';
          status = 'valid';
          details = `Handover tracking verified for Order ${order.orderNumber}. Courier: ${order.shipment?.courierName || 'Delhivery'}`;
        }
      }

      // Audio feedback
      if (soundEnabled) {
        if (status === 'valid') {
          toast.success(`[BEEP] Scanned: ${code}`);
        } else {
          toast.error(`[BUZZ] Invalid code: ${code}`);
        }
      } else {
        if (status === 'valid') {
          toast.success(`Scanned: ${code}`);
        } else {
          toast.error(`Invalid: ${code}`);
        }
      }

      const newLog: ScanLog = {
        id: `SC-${Math.floor(100 + Math.random() * 900)}`,
        scannedCode: code,
        type,
        status,
        timestamp: 'Just now',
        details
      };

      setLogs(prev => [newLog, ...prev]);
    } catch (error) {
      console.error(error);
      toast.error('Scanner connectivity error.');
    } finally {
      setScanning(false);
      setScanInput('');
    }
  };

  const handleClearHistory = () => {
    setLogs([]);
    toast.info("Scan history logs cleared.");
  };

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Handheld Scanner</h2>
          <p className="text-xs text-muted-foreground font-medium">Instant barcode validation terminal</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
          Laser Active
        </Badge>
      </div>

      {/* Fullscreen Camera Finder Mockup */}
      <Card className="border-none shadow-sm bg-slate-950 text-white rounded-3xl overflow-hidden relative h-56 flex flex-col justify-between p-4">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />

        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-red-500 shadow shadow-red-500/80 animate-pulse" />

        <div className="flex items-center justify-between z-10 text-[9px] font-black uppercase text-slate-400">
          <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Zebra Terminal</span>
          <span className="flex items-center gap-1"><Radio className="w-3.5 h-3.5 text-primary animate-pulse" /> Camera Feed Active</span>
        </div>

        <div className="flex items-center justify-center z-10 flex-1">
          <p className="text-[10px] text-slate-400 text-center max-w-[200px] leading-relaxed">
            Position any product SKU barcode, bin label, or courier tracking tag within the scanner box.
          </p>
        </div>

        <div className="flex justify-between items-center z-10 pt-2 border-t border-slate-800">
          <span className="text-[9px] font-black text-slate-450 uppercase">Flashlight</span>
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => {
              setFlashEnabled(!flashEnabled);
              toast.info(`Flashlight ${!flashEnabled ? 'On' : 'Off'}`);
            }}
            className={`h-7 w-7 p-0 rounded-full border border-slate-800 hover:bg-slate-900 ${flashEnabled ? 'bg-primary text-primary-foreground border-none' : 'text-slate-400'}`}
          >
            <Zap className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      {/* Manual Input form */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleBarcodeSubmit} className="space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 pl-0.5 tracking-wider block">Manual Key-in Code</span>
            <div className="flex gap-2">
              <Input 
                placeholder="Type barcode or SKU code (e.g. SKU-OMNI-SHIRT-E4XM7)..." 
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                disabled={scanning}
                className="h-11 border-slate-200 dark:border-slate-800 bg-transparent text-xs rounded-2xl flex-1 animate-in"
              />
              <Button type="submit" disabled={scanning} className="h-11 w-11 p-0 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground border-none">
                <ScanBarcode className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Device preferences */}
      <Card className="border-none shadow-sm p-4 space-y-4">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-0.5 tracking-wider block">Terminal Preferences</span>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Audio Feedback Beep</p>
            <p className="text-[9px] text-slate-400">Beep on valid or invalid scans</p>
          </div>
          <div className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">Vibration Haptic Feedback</p>
            <p className="text-[9px] text-slate-400">Vibrate on scanner trigger events</p>
          </div>
          <Switch checked={vibrateEnabled} onCheckedChange={setVibrateEnabled} />
        </div>
      </Card>

      {/* Scan history logs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Scan History Logs</span>
          {logs.length > 0 && (
            <Button variant="ghost" size="xs" className="h-7 text-[10px] rounded-lg text-rose-500 hover:bg-rose-50" onClick={handleClearHistory}>
              Clear Logs
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="py-12 border border-dashed rounded-3xl text-center space-y-2 text-slate-400 dark:text-slate-600">
              <ScanBarcode className="w-8 h-8 mx-auto" />
              <p className="text-xs font-semibold">No recent scans logged</p>
              <p className="text-[10px] max-w-[200px] mx-auto text-slate-400/80">Logs build up automatically as you scan barcodes.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                  log.status === 'valid' 
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]' 
                    : 'border-rose-500/30 bg-rose-500/[0.02]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-450">{log.scannedCode}</span>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-bold text-[8px] py-0.5 px-1.5 rounded-full uppercase">{log.type}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1">{log.details}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" /> {log.timestamp}
                  </span>
                  <Badge className={
                    log.status === 'valid'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full mt-1 block'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[8px] rounded-full mt-1 block'
                  }>
                    {log.status === 'valid' ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
