import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: any[];
  isLoading: boolean;
}

export function InventoryIntelligence({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return <div className="h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl col-span-1 lg:col-span-2" />;
  }

  // Only show critical items (e.g., less than 14 days of stock remaining)
  const criticalItems = data.filter((item) => item.daysRemaining <= 14).sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900 col-span-1 lg:col-span-2 flex flex-col">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Predictive Stock Intelligence
          </CardTitle>
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-none">
            {criticalItems.length} Critical Actions
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col h-full min-h-0">
        <ScrollArea className="h-[300px] flex-1">
          {criticalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
              <Package className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Inventory Levels Healthy</p>
              <p className="text-sm mt-1">Based on current velocity, no items will stock out in the next 14 days.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Product / SKU</th>
                  <th className="px-6 py-3 font-medium text-right">Velocity (Daily)</th>
                  <th className="px-6 py-3 font-medium text-right">Prediction</th>
                  <th className="px-6 py-3 font-medium text-right">Action Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {criticalItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-200">{item.name}</p>
                      <p className="text-xs font-mono text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      ~{item.avgDailySales}/day
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.daysRemaining <= 3 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md text-xs">
                          <AlertTriangle className="w-3 h-3" /> {item.daysRemaining} days left
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md text-xs">
                          {item.daysRemaining} days left
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-500">+{item.suggestedRestockQuantity} units</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
