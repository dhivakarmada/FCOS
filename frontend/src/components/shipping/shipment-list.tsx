import { useShippingStore } from '@/store/shipping-store';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink,
  Printer,
  PackageCheck
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';

interface Props {
  shipments: any[];
}

export function ShipmentList({ shipments }: Props) {
  const { setSelectedOrder, setTrackingOrder, filters, setFilters } = useShippingStore();

  const handlePrintLabel = async (orderId: string, orderNumber: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/label`, {
        responseType: 'blob',
      });
      
      if (response.data.type === 'application/json') {
        // If the response is JSON instead of PDF, it's an error message
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || 'Failed to generate label');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Print label error:', error);
      const message = error.response?.data?.message || error.message || 'Check if the order has been assigned a courier.';
      alert(`Error: ${message}`);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = !filters.search || 
      s.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.shipment?.trackingNumber?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'ALL' || s.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SHIPPED': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Shipped</Badge>;
      case 'DELIVERED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Delivered</Badge>;
      case 'PACKED': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Packed</Badge>;
      case 'OUT_FOR_DELIVERY': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">Out for Delivery</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-black tracking-tight">Active Shipments</h3>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Order / Tracking..." 
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary w-64"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4">Order Details</th>
              <th className="px-6 py-4">Courier & Tracking</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">ETA</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredShipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 dark:text-white">#{shipment.orderNumber}</p>
                  <p className="text-xs text-slate-500">{shipment.customerName}</p>
                </td>
                <td className="px-6 py-4">
                  {shipment.shipment ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-700 dark:text-slate-300">
                        <Truck className="w-3 h-3 text-primary" />
                        {shipment.shipment.courierName}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{shipment.shipment.trackingNumber}</span>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary hover:bg-primary/10 h-8 font-bold text-xs"
                      onClick={() => setSelectedOrder(shipment.id)}
                    >
                      Assign Courier
                    </Button>
                  )}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(shipment.status)}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{shipment.city}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {shipment.shipment?.estimatedArrival ? new Date(shipment.shipment.estimatedArrival).toLocaleDateString() : 'N/A'}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                    {shipment.shipment && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg"
                        onClick={() => setTrackingOrder(shipment.id)}
                        title="Track Shipment"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setSelectedOrder(shipment.id)}>
                            <PackageCheck className="w-4 h-4" /> Manage Shipment
                          </DropdownMenuItem>
                          {shipment.shipment?.trackingNumber && (
                            <DropdownMenuItem 
                              className="rounded-lg gap-2 cursor-pointer"
                              onClick={() => handlePrintLabel(shipment.id, shipment.orderNumber)}
                            >
                              <Printer className="w-4 h-4" /> Print Label
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
