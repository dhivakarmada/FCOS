import { useLiveOpsStore } from '@/store/live-ops-store';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ShoppingCart, RotateCcw, AlertTriangle } from 'lucide-react';

export function MetricsPanel() {
  const { metrics } = useLiveOpsStore();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-500/5" />
        <CardContent className="p-4 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Velocity</p>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-blue-100">{metrics.eventsPerMinute}</p>
          <p className="text-xs text-blue-400/70 font-medium mt-1">Events / min</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-emerald-500/5" />
        <CardContent className="p-4 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Flow</p>
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-100">{metrics.ordersPerMinute}</p>
          <p className="text-xs text-emerald-400/70 font-medium mt-1">Orders / min</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-amber-500/5" />
        <CardContent className="p-4 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reverse Log</p>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-100">{metrics.returnsPerMinute}</p>
          <p className="text-xs text-amber-400/70 font-medium mt-1">Returns / min</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-rose-500/5" />
        <CardContent className="p-4 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Anomalies</p>
            <AlertTriangle className={`w-4 h-4 ${metrics.anomaliesDetected > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`} />
          </div>
          <p className={`text-3xl font-extrabold ${metrics.anomaliesDetected > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
            {metrics.anomaliesDetected}
          </p>
          <p className="text-xs text-rose-500/70 font-medium mt-1">Detected today</p>
        </CardContent>
      </Card>
    </div>
  );
}
