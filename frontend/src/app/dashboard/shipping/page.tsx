'use client';

import { useShipping } from '@/hooks/use-shipping';
import { useShippingStore } from '@/store/shipping-store';
import { ShipmentStats } from '@/components/shipping/shipment-stats';
import { ShipmentList } from '@/components/shipping/shipment-list';
import { CourierSelector } from '@/components/shipping/courier-selector';
import { TrackingPortal } from '@/components/shipping/tracking-portal';
import { LogisticsAnalytics } from '@/components/shipping/logistics-analytics';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Truck, MapPin } from 'lucide-react';

export default function ShippingDashboardPage() {
  const { shipments, isLoading } = useShipping();
  const { selectedOrder, setSelectedOrder, trackingOrder, setTrackingOrder } = useShippingStore();

  const selectedOrderData = Array.isArray(shipments) ? shipments.find(s => s.id === selectedOrder) : null;
  const trackingOrderData = Array.isArray(shipments) ? shipments.find(s => s.id === trackingOrder) : null;

  return (
    <div className="flex flex-col pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Shipping & Logistics</h1>
          <p className="text-slate-500 font-medium mt-1">Manage couriers, track shipments, and monitor delivery SLA.</p>
        </div>
      </div>

      <ShipmentStats shipments={shipments} />

      <ShipmentList shipments={shipments} />

      {/* Courier Assignment Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-950 p-6 overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <SheetTitle className="text-2xl font-black tracking-tight">Assign Courier</SheetTitle>
            <SheetDescription className="text-slate-500 font-medium">
              Calculate shipping rates and assign a delivery partner for Order #{selectedOrderData?.orderNumber}.
            </SheetDescription>
          </SheetHeader>
          
          {selectedOrder && (
            <CourierSelector 
              orderId={selectedOrder} 
              onClose={() => setSelectedOrder(null)} 
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Tracking Sheet */}
      <Sheet open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-950 p-6 overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-white">
              <MapPin className="w-6 h-6" />
            </div>
            <SheetTitle className="text-2xl font-black tracking-tight">Track Shipment</SheetTitle>
            <SheetDescription className="text-slate-500 font-medium">
              Real-time delivery status and location history for Order #{trackingOrderData?.orderNumber}.
            </SheetDescription>
          </SheetHeader>
          
          {trackingOrder && (
            <TrackingPortal orderId={trackingOrder} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
