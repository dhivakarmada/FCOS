import { useOrders } from '@/hooks/use-orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Check, Package, Truck, ArrowRight } from 'lucide-react';

export function OrderFulfillmentQueue() {
  const { orders, isLoading, updateOrderStatus } = useOrders();

  const pickingOrders = orders?.orders?.filter((o: any) => o.status === 'CREATED') || [];
  const packingOrders = orders?.orders?.filter((o: any) => o.status === 'PACKED') || [];
  const dispatchOrders = orders?.orders?.filter((o: any) => o.status === 'SHIPPED') || [];

  const handleAction = (id: string, nextStatus: string) => {
    updateOrderStatus.mutate({ id, status: nextStatus });
  };

  const OrderCard = ({ order, actionLabel, nextStatus, icon: Icon, loading }: any) => (
    <div className="p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm space-y-3 hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold font-mono text-sm">{order.orderNumber}</p>
          <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
        </div>
        <Badge variant="outline" className="bg-slate-50" suppressHydrationWarning>
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <Icon className="w-3.5 h-3.5" />
        {actionLabel}
      </div>
      <Button 
        className="w-full h-8 text-xs gap-2" 
        variant="secondary"
        disabled={loading}
        onClick={() => handleAction(order.id, nextStatus)}
      >
        Complete Action <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Picking Queue */}
      <Card className="bg-slate-50 border-none shadow-inner rounded-3xl overflow-hidden">
        <CardHeader className="bg-blue-100/50 pb-4 border-b border-blue-100">
          <CardTitle className="text-sm font-bold flex justify-between items-center text-blue-900">
            <span className="flex items-center gap-2"><Play className="w-4 h-4 text-blue-600" /> Picking Queue</span>
            <Badge className="bg-blue-600">{pickingOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {pickingOrders.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Queue empty</p>}
          {pickingOrders.map((o: any) => (
            <OrderCard 
              key={o.id} 
              order={o} 
              actionLabel="Pick Items" 
              nextStatus="PACKED" 
              icon={Check} 
              loading={updateOrderStatus.isPending} 
            />
          ))}
        </CardContent>
      </Card>

      {/* Packing Queue */}
      <Card className="bg-slate-50 border-none shadow-inner rounded-3xl overflow-hidden">
        <CardHeader className="bg-amber-100/50 pb-4 border-b border-amber-100">
          <CardTitle className="text-sm font-bold flex justify-between items-center text-amber-900">
            <span className="flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" /> Packing Queue</span>
            <Badge className="bg-amber-600 hover:bg-amber-700">{packingOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {packingOrders.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Queue empty</p>}
          {packingOrders.map((o: any) => (
            <OrderCard 
              key={o.id} 
              order={o} 
              actionLabel="Pack & Box" 
              nextStatus="SHIPPED" 
              icon={Package} 
              loading={updateOrderStatus.isPending} 
            />
          ))}
        </CardContent>
      </Card>

      {/* Dispatch Queue */}
      <Card className="bg-slate-50 border-none shadow-inner rounded-3xl overflow-hidden">
        <CardHeader className="bg-purple-100/50 pb-4 border-b border-purple-100">
          <CardTitle className="text-sm font-bold flex justify-between items-center text-purple-900">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-purple-600" /> Dispatch Queue</span>
            <Badge className="bg-purple-600 hover:bg-purple-700">{dispatchOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {dispatchOrders.length === 0 && <p className="text-center text-slate-400 text-sm py-8">Queue empty</p>}
          {dispatchOrders.map((o: any) => (
            <OrderCard 
              key={o.id} 
              order={o} 
              actionLabel="Ready for Handover" 
              nextStatus="OUT_FOR_DELIVERY" 
              icon={Truck} 
              loading={updateOrderStatus.isPending} 
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
