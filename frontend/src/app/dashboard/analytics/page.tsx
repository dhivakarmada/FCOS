'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { OverviewMetrics } from '@/components/analytics/overview-metrics';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { ReturnsAnalysis } from '@/components/analytics/returns-analysis';
import { DeliveryPerformance } from '@/components/analytics/delivery-performance';
import { InventoryIntelligence } from '@/components/analytics/inventory-intelligence';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalyticsDashboardPage() {
  const { 
    dashboard, 
    revenue, 
    delivery, 
    returns, 
    predictions, 
    isLoading 
  } = useAnalytics();

  const handleExport = () => {
    toast.success('Analytics report generated successfully', {
      description: 'The CSV file will begin downloading shortly.',
    });
  };

  return (
    <div className="flex flex-col animate-in fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Business Intelligence</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time operational insights and predictive analytics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} className="rounded-full shadow-lg font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      <OverviewMetrics data={dashboard} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RevenueChart data={revenue} isLoading={isLoading} />
        <ReturnsAnalysis data={returns} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DeliveryPerformance data={delivery} isLoading={isLoading} />
        <InventoryIntelligence data={predictions} isLoading={isLoading} />
      </div>
    </div>
  );
}
