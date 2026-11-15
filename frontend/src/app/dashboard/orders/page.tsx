'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Download, Search, MoreHorizontal, FileText, XCircle, ArrowRight, ShieldAlert, Package, Truck, CheckCircle2, Upload, Info } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/export-csv';
import { CreateOrderModal } from '@/components/orders/create-order-modal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

export default function OrdersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { filters, setFilter } = useQueryFilters();
  const { orders, isLoading, updateOrderStatus, bulkUpdateStatus, cancelOrder } = useOrders(filters);

  const handleExport = () => {
    if (!orders || orders.length === 0) {
      toast.error("No orders found to export");
      return;
    }
    const exportData = orders.map((o: any) => ({
      OrderNumber: o.orderNumber,
      CustomerName: o.customerName,
      CustomerEmail: o.customerEmail,
      Status: o.status,
      TotalAmount: o.totalAmount,
      CreatedAt: format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));
    const success = exportToCsv('orders_export', exportData);
    if (success) {
      toast.success("Orders exported successfully");
    } else {
      toast.error("Failed to export orders");
    }
  };

  const handleBulkExport = () => {
    const selectedOrders = orders.filter((o: any) => selectedOrderIds.has(o.id));
    if (selectedOrders.length === 0) return;
    
    const exportData = selectedOrders.map((o: any) => ({
      OrderNumber: o.orderNumber,
      CustomerName: o.customerName,
      CustomerEmail: o.customerEmail,
      Status: o.status,
      TotalAmount: o.totalAmount,
      CreatedAt: format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    const success = exportToCsv('selected_orders_export', exportData);
    if (success) {
      toast.success(`${selectedOrders.length} orders exported successfully`);
      setSelectedOrderIds(new Set()); // clear selection
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    bulkUpdateStatus.mutate({ ids, status }, {
      onSuccess: () => setSelectedOrderIds(new Set())
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked && orders) {
      setSelectedOrderIds(new Set(orders.map((o: any) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const toggleSelectOrder = (id: string, checked: boolean) => {
    const newSet = new Set(selectedOrderIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedOrderIds(newSet);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      CREATED: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-none',
      PACKED: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-none',
      SHIPPED: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 border-none',
      OUT_FOR_DELIVERY: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-none',
      DELIVERED: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-none',
      CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-none',
      RETURNED: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 border-none',
    };
    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const downloadLabel = async (orderId: string, orderNumber: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/label`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `label-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Shipping label downloaded");
    } catch (e) {
      toast.error("Failed to download shipping label");
    }
  };

  const downloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded");
    } catch (e) {
      toast.error("Failed to download invoice");
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-extrabold tracking-tight">Orders Management</h2>
          <p className="text-muted-foreground font-medium mt-1">Track and manage your order lifecycle across all facilities.</p>
        </div>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Button variant="outline" className="gap-2 rounded-xl rounded-r-none h-10 border-slate-200 dark:border-slate-800 border-r-0">
                    <Upload className="h-4 w-4" /> Import Orders
                  </Button>
                  <div className="flex items-center justify-center h-10 px-3 border border-l-0 border-slate-200 dark:border-slate-800 rounded-r-xl bg-slate-50 dark:bg-slate-800/50 cursor-help">
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4 space-y-2 rounded-xl shadow-xl border-none text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                <p className="font-bold">Import Format (CSV)</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Headers: <span className="text-slate-700 dark:text-slate-200 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">CustomerName, Email, AddressLine1, City, State, ZipCode, SKU, Quantity</span></p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Maximum 500 rows per import.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" className="gap-2 rounded-xl h-10 border-slate-200 dark:border-slate-800" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export All
          </Button>
          <Button className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/20" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" /> Create Order
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search Order No. or Customer..." 
            className="pl-9 bg-slate-50 dark:bg-slate-800 border-none h-10 rounded-xl w-full"
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={filters.status || 'ALL'} onValueChange={(v) => setFilter('status', v === 'ALL' ? null : v)}>
            <SelectTrigger className="w-[180px] h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="CREATED">Created</SelectItem>
              <SelectItem value="PACKED">Packed</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center py-4">
                <Checkbox 
                  checked={orders?.length > 0 && selectedOrderIds.size === orders.length}
                  onCheckedChange={toggleSelectAll}
                  className="border-slate-300 dark:border-slate-600 rounded-sm"
                />
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Order Ref</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date Created</TableHead>
              <TableHead className="w-12 text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-4">
                    <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-default border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={selectedOrderIds.has(order.id)}
                      onCheckedChange={(c) => toggleSelectOrder(order.id, !!c)}
                      className="border-slate-300 dark:border-slate-600 rounded-sm"
                    />
                  </TableCell>
                  <TableCell className="font-black text-slate-900 dark:text-slate-100">
                    <div 
                      className="cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                      onClick={() => { setSelectedOrderDetails(order); setIsDetailsOpen(true); }}
                    >
                      {order.orderNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-200">{order.customerName}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{order.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-200">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-500">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950 p-2">
                        <DropdownMenuItem 
                          className="font-bold text-xs gap-2 py-2.5 cursor-pointer rounded-lg"
                          onClick={() => { setSelectedOrderDetails(order); setIsDetailsOpen(true); }}
                        >
                          <FileText className="w-4 h-4 text-primary" /> View Order Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="font-bold text-xs gap-2 py-2.5 cursor-pointer rounded-lg">
                            <ArrowRight className="w-4 h-4 text-blue-500" /> Update Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 min-w-[140px]">
                              <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer rounded-lg" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'PACKED' })}>Packed</DropdownMenuItem>
                              <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer rounded-lg" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'SHIPPED' })}>Shipped</DropdownMenuItem>
                              <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer rounded-lg" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'OUT_FOR_DELIVERY' })}>Out for Delivery</DropdownMenuItem>
                              <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer rounded-lg" onClick={() => updateOrderStatus.mutate({ id: order.id, status: 'DELIVERED' })}>Delivered</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                        
                        <DropdownMenuItem 
                          className="font-bold text-xs gap-2 py-2.5 cursor-pointer rounded-lg"
                          onClick={() => downloadLabel(order.id, order.orderNumber)}
                        >
                          <Package className="w-4 h-4 text-indigo-500" /> Download Label
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="font-bold text-xs gap-2 py-2.5 cursor-pointer rounded-lg"
                          onClick={() => downloadInvoice(order.id, order.orderNumber)}
                        >
                          <FileText className="w-4 h-4 text-emerald-500" /> Download Invoice
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                        
                        <DropdownMenuItem 
                          className="font-bold text-xs gap-2 py-2.5 cursor-pointer rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                          onClick={() => {
                            if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
                              cancelOrder.mutate(order.id);
                            }
                          }}
                          disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                        >
                          <XCircle className="w-4 h-4" /> Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-bold text-slate-500">No orders found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-50">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary hover:bg-primary text-white font-black">{selectedOrderIds.size}</Badge>
            <span className="font-bold text-sm">Orders Selected</span>
          </div>
          <div className="w-px h-6 bg-slate-700 dark:bg-slate-300"></div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" className="gap-2 h-9 rounded-xl font-bold bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900 border-none" onClick={handleBulkExport}>
              <Download className="w-4 h-4" /> Export Selected
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2 h-9 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white">
                  Bulk Status Update <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-none">
                <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer" onClick={() => handleBulkStatusUpdate('PACKED')}>Mark as Packed</DropdownMenuItem>
                <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer" onClick={() => handleBulkStatusUpdate('SHIPPED')}>Mark as Shipped</DropdownMenuItem>
                <DropdownMenuItem className="font-bold text-xs py-2 cursor-pointer" onClick={() => handleBulkStatusUpdate('DELIVERED')}>Mark as Delivered</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100" onClick={() => setSelectedOrderIds(new Set())}>
              <XCircle className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[540px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 flex flex-col h-full overflow-hidden">
          {selectedOrderDetails && (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                <SheetHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-widest text-[10px]">
                      {selectedOrderDetails.orderNumber}
                    </Badge>
                    {getStatusBadge(selectedOrderDetails.status)}
                  </div>
                  <SheetTitle className="text-2xl font-black tracking-tight">Order Details</SheetTitle>
                  <SheetDescription className="font-bold text-slate-500">
                    Placed on {format(new Date(selectedOrderDetails.createdAt), 'MMMM dd, yyyy ')}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Customer Info */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Customer Information</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Name</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedOrderDetails.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Email</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedOrderDetails.customerEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Address</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 text-right max-w-[200px]">
                        {selectedOrderDetails.addressLine1}, {selectedOrderDetails.city}, {selectedOrderDetails.state} {selectedOrderDetails.zipCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrderDetails.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{item.product?.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">SKU: {item.product?.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900 dark:text-slate-100">₹{Number(item.price).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl">
                    <span className="font-bold text-sm">Total Amount</span>
                    <span className="font-black text-lg">₹{Number(selectedOrderDetails.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CreateOrderModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}
