'use client';

import { useState } from 'react';
import { 
  Cpu, Radio, RefreshCw, CheckCircle2, ShieldCheck, 
  AlertTriangle, Terminal, Wifi, Smartphone, Printer, Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function StaffSystemPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);

  const [deviceStats, setDeviceStats] = useState({
    model: 'Zebra TC26 Handheld Terminal',
    battery: '84%',
    wifiSignal: 'STRONG',
    latency: '8ms',
    scannerStatus: 'ONLINE',
    printerStatus: 'ONLINE'
  });

  const [logs, setLogs] = useState([
    { time: '10:25:01', message: 'Laser decoding engine checked - status Nominal', level: 'info' },
    { time: '10:24:45', message: 'Local print spooler linked: Printer PRN-01', level: 'info' },
    { time: '10:22:12', message: 'Network handshake response: 8ms (Strong)', level: 'info' },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Device status synchronized');
    }, 600);
  };

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsResult(null);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setDiagnosticsResult({
        network: 'PASS (8ms latency)',
        laser: 'PASS (ZT-Laser Engine OK)',
        printer: 'PASS (ZT-Thermal linked)',
        batteryHealth: '94% (Good)'
      });
      toast.success('Self-diagnostics completed: Handheld device is fully operational!');
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Cpu className="w-8 h-8 text-indigo-400" />
            Device Diagnostics
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Audit handheld terminal connections, laser scanners, and printer connectivity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
          </Button>
          <Button 
            className="h-9 gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold" 
            onClick={handleRunDiagnostics}
            disabled={diagnosticsRunning}
          >
            <Smartphone className="w-4 h-4" /> {diagnosticsRunning ? 'Running Self-Check...' : 'Run Self-Check'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Diagnostics & Stats (ColSpan 2) */}
        <div className="md:col-span-2 space-y-6">
          {/* Uptime and hardware stats */}
          <Card className="border border-slate-850 bg-slate-900/40 backdrop-blur shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-850">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" /> Handheld Terminal Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid gap-4 grid-cols-2 text-xs text-slate-350">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Device Model</span>
                <p className="font-bold text-white mt-0.5">{deviceStats.model}</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Battery Level</span>
                <p className="font-bold text-white mt-0.5">{deviceStats.battery} (Charging)</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Network Connection</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-455" />
                  <span className="font-bold text-white">{deviceStats.wifiSignal} ({deviceStats.latency})</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Connected Scanner</span>
                <p className="font-bold text-white mt-0.5">{deviceStats.scannerStatus}</p>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Self-Check results */}
          {diagnosticsResult && (
            <Card className="border border-indigo-500 bg-slate-900/30 p-5 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-455" /> Self-Diagnostics Log Summary
              </h4>
              <div className="grid gap-3 grid-cols-2 text-xs text-slate-350">
                <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-lg">
                  <span>Network Sync Status:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-455 border border-emerald-500/25 text-[8px]">{diagnosticsResult.network}</Badge>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-lg">
                  <span>Z-Laser Engine Status:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-455 border border-emerald-500/25 text-[8px]">{diagnosticsResult.laser}</Badge>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-lg">
                  <span>Thermal Printer Spooler:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-455 border border-emerald-500/25 text-[8px]">{diagnosticsResult.printer}</Badge>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950/50 rounded-lg">
                  <span>Battery Chemistry:</span>
                  <Badge className="bg-emerald-500/10 text-emerald-455 border border-emerald-500/25 text-[8px]">{diagnosticsResult.batteryHealth}</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Console/Logs */}
        <div className="space-y-6">
          <Card className="border border-slate-850 bg-slate-955/60 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Device Handshake Console
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {logs.map((lg, idx) => (
                <div key={idx} className="text-[10px] font-mono p-2 bg-slate-900/40 rounded border border-slate-850/60 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">{lg.time}</span>
                  <span className="text-slate-350">{lg.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
