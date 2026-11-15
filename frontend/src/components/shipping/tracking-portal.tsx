import { useShipping } from '@/hooks/use-shipping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface Props {
  orderId: string;
}

export function TrackingPortal({ orderId }: Props) {
  const { track } = useShipping();
  const { data, isLoading } = track(orderId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-slate-500 mt-4">Retrieving tracking live data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Truck className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-widest text-[10px]">
              {data.courierName}
            </Badge>
            <Badge className="bg-emerald-500 text-white border-none uppercase tracking-widest text-[10px]">
              {data.currentStatus}
            </Badge>
          </div>
          <h3 className="text-3xl font-black mb-1">{data.trackingNumber}</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Estimated Delivery: {new Date(data.estimatedDelivery).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 space-y-8 py-4">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
        
        {data.timeline.reverse().map((step: any, idx: number) => (
          <div key={idx} className="relative">
            <div className={`absolute -left-[2.15rem] w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-sm ${idx === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              {step.status === 'DELIVERED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
               step.status === 'OUT_FOR_DELIVERY' ? <MapPin className="w-3.5 h-3.5" /> :
               <Clock className="w-3.5 h-3.5" />}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className={`font-black text-sm uppercase tracking-tight ${idx === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  {step.status.replace(/_/g, ' ')}
                </h4>
                <span className="text-[10px] font-bold text-slate-400">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{step.location}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(step.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full rounded-2xl h-12 font-black gap-2 border-slate-200">
        <ExternalLink className="w-4 h-4" /> Full Tracking Page
      </Button>
    </div>
  );
}
