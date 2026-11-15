'use client';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { BarcodeScannerTerminal } from '@/components/operations/barcode-scanner-terminal';
import { OrderFulfillmentQueue } from '@/components/operations/order-fulfillment-queue';
import { StaffTaskBoard } from '@/components/operations/staff-task-board';
import { LiveActivityFeed } from '@/components/operations/live-activity-feed';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Box, PlayCircle, Truck, Users } from 'lucide-react';

export default function OperationsDashboardPage() {
  // Fetch high-level KPIs for the top section
  const { data: analytics } = useQuery({
    queryKey: ['warehouse-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-extrabold tracking-tight">Operations Command Center</h2>
          <p className="text-muted-foreground font-medium">Live warehouse execution, RF scanning, and dispatch routing.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-700"><Box className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Stock</p>
              <p className="text-2xl font-extrabold">{analytics?.inventory?.totalStock || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700"><PlayCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Picks</p>
              <p className="text-2xl font-extrabold">{analytics?.orders?.pendingOrders || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-700"><Truck className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Dispatch</p>
              <p className="text-2xl font-extrabold">{analytics?.shipping?.pendingShipments || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Staff</p>
              <p className="text-2xl font-extrabold">{analytics?.staff?.activeCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <BarcodeScannerTerminal />
          <OrderFulfillmentQueue />
        </div>
        <div className="space-y-6 flex flex-col">
          <div className="flex-1 min-h-[350px]">
            <LiveActivityFeed />
          </div>
          <div className="flex-1 min-h-[350px]">
            <StaffTaskBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
