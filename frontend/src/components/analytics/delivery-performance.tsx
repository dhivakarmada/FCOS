import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  data: any;
  isLoading: boolean;
}

export function DeliveryPerformance({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl col-span-1" />;
  }

  return (
    <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900 col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          Delivery Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-8">
        
        <div className="space-y-6 mt-4">
          
          {/* Success Rate */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                Success Rate
              </p>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.deliverySuccessRate}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full" 
                style={{ width: `${Math.min(100, Number(data.deliverySuccessRate))}%` }} 
              />
            </div>
          </div>

          {/* On-Time Rate */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> 
                On-Time SLA
              </p>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.onTimeDeliveryRate}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full" 
                style={{ width: `${Math.min(100, Number(data.onTimeDeliveryRate))}%` }} 
              />
            </div>
          </div>

        </div>

        <div className="mt-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 flex items-center justify-between border border-indigo-100 dark:border-indigo-500/20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Avg Delivery Time</p>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-300">
              {data.avgDeliveryDays} <span className="text-sm font-bold text-indigo-500/70">Days</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">In Hours</p>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
              {data.avgDeliveryHours}h
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
