import { useState, useEffect } from 'react';
import { useShipping } from '@/hooks/use-shipping';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, IndianRupee, Star, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  orderId: string;
  onClose: () => void;
}

export function CourierSelector({ orderId, onClose }: Props) {
  const { calculate, assignCourier } = useShipping();
  const [couriers, setCouriers] = useState<any[]>([]);

  useEffect(() => {
    calculate.mutateAsync(orderId).then(setCouriers);
  }, [orderId]);

  const handleAssign = async (courierName: string) => {
    await assignCourier.mutateAsync({ orderId, courierName });
    onClose();
  };

  if (calculate.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-slate-500">Calculating optimal routes & costs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-black text-sm uppercase tracking-widest text-slate-500">Available Couriers</h4>
        {couriers.length > 0 && (
          <span className="text-xs font-bold text-slate-400">Weight: {couriers[0].totalWeight}kg</span>
        )}
      </div>

      <div className="grid gap-3">
        {couriers.map((courier, idx) => (
          <Card 
            key={courier.courierName} 
            className={`border-2 cursor-pointer group hover:border-primary/50 ${idx === 0 ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100 dark:border-slate-800'}`}
            onClick={() => handleAssign(courier.courierName)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${idx === 0 ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Truck className={`w-6 h-6 ${idx === 0 ? 'text-primary' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 dark:text-white">{courier.courierName}</h5>
                    {idx === 0 && (
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5 border-none">Optimal</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <Clock className="w-3 h-3" /> {courier.estimatedDays} days
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <Star className="w-3 h-3 text-amber-500" /> 4.8
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end text-xl font-black text-slate-900 dark:text-white">
                  <IndianRupee className="w-4 h-4" />
                  {courier.estimatedCost}
                </div>
                <Button 
                  size="sm" 
                  className={`mt-2 rounded-xl h-8 px-4 font-bold ${idx === 0 ? 'bg-primary hover:bg-primary/90' : 'bg-slate-900 hover:bg-slate-800'}`}
                  disabled={assignCourier.isPending}
                >
                  {assignCourier.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Assign'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Logistics Guarantee</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-500/70 mt-1">
            All shipments are insured up to ₹5,000. Real-time tracking will be activated immediately upon assignment.
          </p>
        </div>
      </div>
    </div>
  );
}
