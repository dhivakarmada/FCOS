import { Card, CardContent } from '@/components/ui/card';
import { Package, DollarSign, Target, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  data: any;
  isLoading: boolean;
}

export function OverviewMetrics({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Revenue */}
      <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-white dark:bg-slate-900">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className="w-16 h-16" />
        </div>
        <CardContent className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Revenue (30d)</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {formatCurrency(data.monthlyRevenue || 0)}
            </h3>
          </div>
          {/* Trend will be dynamic in future */}
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-white dark:bg-slate-900">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Package className="w-16 h-16 text-blue-500" />
        </div>
        <CardContent className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Orders (Today)</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {data.ordersToday || 0}
            </h3>
            <span className="text-slate-400 font-medium mb-1 line-through opacity-50">{Math.floor((data.ordersToday || 0) * 0.8)}</span>
          </div>
          {/* Trend will be dynamic in future */}
        </CardContent>
      </Card>

      {/* Active Returns */}
      <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-white dark:bg-slate-900">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <RotateCcw className="w-16 h-16 text-amber-500" />
        </div>
        <CardContent className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Active Returns</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500">
              {data.activeReturns || 0}
            </h3>
          </div>
          {/* Trend will be dynamic in future */}
        </CardContent>
      </Card>

      {/* Delivery Target */}
      <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Target className="w-16 h-16" />
        </div>
        <CardContent className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-200 mb-2">Fulfillment Target</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black">
              {Math.min(100, Math.round(((data.totalOrders - data.pendingShipments) / (data.totalOrders || 1)) * 100))}%
            </h3>
          </div>
          <div className="mt-4 w-full bg-black/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              style={{ width: `${Math.min(100, Math.round(((data.totalOrders - data.pendingShipments) / (data.totalOrders || 1)) * 100))}%` }} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
