'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Timeline, TimelineStatus } from '@/components/shared/timeline';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Printer, 
  Truck, 
  User, 
  Package, 
  MapPin,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    }
  });

  // Mock for demo if API fails
  const mockOrder = order || {
    id: id,
    orderNumber: 'ORD-9281-XM',
    status: 'SHIPPED',
    customerName: 'Aravind Sharma',
    customerEmail: 'aravind@example.com',
    customerPhone: '+91 98765 43210',
    addressLine1: '42, Brigade Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    zipCode: '560001',
    totalAmount: 12499,
    gstAmount: 2249,
    createdAt: '2026-05-06T10:00:00Z',
    items: [
      { id: '1', product: { name: 'Ergonomic Office Chair', sku: 'FUR-OFF-01' }, quantity: 1, price: 12499 }
    ],
    shipment: {
      courierName: 'Delhivery',
      trackingNumber: 'DEL1234567890',
      estimatedArrival: '2026-05-09T18:00:00Z'
    }
  };

  const timelineItems = [
    { status: 'CREATED' as TimelineStatus, title: 'Order Placed', description: 'Order successfully created in system', timestamp: 'May 06, 10:00 AM', isCompleted: true, isCurrent: false },
    { status: 'PACKED' as TimelineStatus, title: 'Packed', description: 'Items verified and packed into Box A-2', timestamp: 'May 06, 11:30 AM', isCompleted: true, isCurrent: false },
    { status: 'SHIPPED' as TimelineStatus, title: 'Shipped', description: 'Handed over to Delhivery courier', timestamp: 'May 06, 02:15 PM', isCompleted: true, isCurrent: true },
    { status: 'OUT_FOR_DELIVERY' as TimelineStatus, title: 'Out for Delivery', description: 'Package is with delivery partner', isCompleted: false, isCurrent: false },
    { status: 'DELIVERED' as TimelineStatus, title: 'Delivered', description: 'Signature verification pending', isCompleted: false, isCurrent: false },
  ];

  if (isLoading) return <div>Loading order details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{mockOrder.orderNumber}</h2>
              <StatusBadge status={mockOrder.status} />
            </div>
            <p className="text-muted-foreground">Placed on {new Date(mockOrder.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Print Label
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" /> Download Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">
                        {item.product.sku.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 text-right">
                <p className="text-sm text-muted-foreground">Subtotal: ₹{mockOrder.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">GST (18%): ₹{mockOrder.gstAmount.toLocaleString()}</p>
                <p className="text-xl font-bold text-primary">Total: ₹{(Number(mockOrder.totalAmount) + Number(mockOrder.gstAmount)).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{mockOrder.customerName}</p>
                <p className="text-muted-foreground">{mockOrder.customerEmail}</p>
                <p className="text-muted-foreground">{mockOrder.customerPhone}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{mockOrder.addressLine1}</p>
                <p className="text-muted-foreground">{mockOrder.city}, {mockOrder.state}</p>
                <p className="text-muted-foreground">{mockOrder.zipCode}, India</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Order Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={timelineItems} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Courier</p>
                <p className="font-semibold">{mockOrder.shipment?.courierName || 'Not Assigned'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tracking Number</p>
                <p className="font-mono text-primary font-bold">{mockOrder.shipment?.trackingNumber || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Est. Delivery</p>
                <p className="font-semibold">{mockOrder.shipment?.estimatedArrival ? new Date(mockOrder.shipment.estimatedArrival).toDateString() : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
