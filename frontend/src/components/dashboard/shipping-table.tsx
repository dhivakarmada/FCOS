import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ExternalLink, Truck, AlertCircle, MoreHorizontal, Download, FileText } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
export function ShippingTable({ orders }: { orders: any[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Truck className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-semibold text-lg">No active shipments</h3>
        <p className="text-muted-foreground">There are no orders currently in transit or shipped.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SHIPPED':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Shipped</Badge>;
      case 'IN_TRANSIT':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">In Transit</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Courier</TableHead>
            <TableHead>Tracking AWB</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{order.customerName}</span>
                  <span className="text-xs text-muted-foreground">{order.city}, {order.state}</span>
                </div>
              </TableCell>
              <TableCell>
                {order.shipment?.courierName || <span className="text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Pending</span>}
              </TableCell>
              <TableCell>
                {order.shipment?.trackingNumber ? (
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {order.shipment.trackingNumber}
                  </code>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.createdAt), "MMM d, yyyy")}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem 
                      disabled={!order.shipment?.trackingNumber}
                      onClick={() => window.open(`https://track.delhivery.com/${order.shipment?.trackingNumber}`, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Track Shipment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        if (order.shipment?.labelUrl) {
                          window.open(order.shipment.labelUrl, '_blank');
                        } else {
                          // Fallback mock label generation
                          alert(`Generating label for ${order.orderNumber}...`);
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download Label
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
