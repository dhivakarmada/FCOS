import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Props {
  shipments: any[];
}

export function ShipmentStats({ shipments }: Props) {
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'SHIPPED' || s.status === 'OUT_FOR_DELIVERY').length,
    delivered: shipments.filter(s => s.status === 'DELIVERED').length,
    delayed: shipments.filter(s => s.status === 'DELAYED').length, // Mock status
    failed: shipments.filter(s => s.status === 'FAILED').length, // Mock status
  };

  const cards = [
    { title: 'Total Shipments', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Exceptions', value: stats.failed + stats.delayed, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title} className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{card.title}</p>
                <h3 className="text-2xl font-black">{card.value}</h3>
              </div>
              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
