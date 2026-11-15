'use client';

import { useState } from 'react';
import { 
  Settings, Sliders, Volume2, Bell, RefreshCw, 
  Smartphone, ShieldAlert, Sparkles, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function StaffSystemSettingsPage() {
  const [scannerMode, setScannerMode] = useState('single');
  const [sensitivity, setSensitivity] = useState(8);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');

  const handleSave = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Saving handheld configurations...',
        success: 'Settings successfully synced to Zebra decoders!',
        error: 'Save failed.'
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Settings className="w-8 h-8 text-indigo-400" />
            Device Configuration
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Optimize scan engines sensitivity, sound signals, and automated document printing preferences.</p>
        </div>
      </div>

      <Card className="border border-slate-850 bg-slate-900/40 p-6 rounded-2xl max-w-xl space-y-6">
        <h4 className="font-bold text-white text-sm">System Parameters & Settings</h4>
        
        <div className="space-y-4 text-xs text-slate-300">
          {/* Scanner Mode */}
          <div className="space-y-2">
            <Label htmlFor="scanner-mode-select" className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Scanner Decoding Mode</Label>
            <Select value={scannerMode} onValueChange={setScannerMode}>
              <SelectTrigger id="scanner-mode-select" className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10 text-indigo-455 font-bold">
                <SelectValue placeholder="Select Scan Mode" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectItem value="single">Single Target (Aisle bin checking)</SelectItem>
                <SelectItem value="continuous">Continuous Scan (Rapid box putaway)</SelectItem>
                <SelectItem value="batch">Batch Buffering (Offline synchronizations)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sensitivity Slider Mock */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-450 tracking-wider">
              <span>SCANNER DECODE SENSITIVITY</span>
              <span className="text-indigo-400 font-mono">{sensitivity}/10 (High Speed)</span>
            </div>
            <input 
              type="range"
              min="1" 
              max="10" 
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 accent-indigo-600 rounded-lg appearance-none cursor-pointer border border-slate-800"
            />
          </div>

          {/* Auto Print labels */}
          <div className="flex justify-between items-center p-3 bg-slate-955 rounded-xl border border-slate-850/60 pt-3">
            <div className="space-y-0.5">
              <h5 className="font-bold text-white">Auto-print labels on packing</h5>
              <p className="text-slate-500 text-[10px]">Automatically dispatch Zebra spool print job when packing is validated.</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>

          {/* Sound Alert Beep */}
          <div className="flex justify-between items-center p-3 bg-slate-955 rounded-xl border border-slate-850/60 pt-3">
            <div className="space-y-0.5">
              <h5 className="font-bold text-white">Scan validation audio alert</h5>
              <p className="text-slate-500 text-[10px]">Play validation beep on barcode sync.</p>
            </div>
            <Switch checked={soundBeep} onCheckedChange={setSoundBeep} />
          </div>

          {/* Auto-refresh select */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="refresh-select" className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Auto-Refresh Task Queue</Label>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger id="refresh-select" className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10 text-white">
                <SelectValue placeholder="Select Refresh Rate" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                <SelectItem value="10">Every 10 seconds (Express tracking)</SelectItem>
                <SelectItem value="30">Every 30 seconds (Recommended)</SelectItem>
                <SelectItem value="60">Every 60 seconds (Network saving)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t border-slate-850 pt-4 flex justify-end">
          <Button onClick={handleSave} className="rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold h-10 px-6">
            Save System Parameters
          </Button>
        </div>
      </Card>
    </div>
  );
}
