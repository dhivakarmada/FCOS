'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  History, 
  ArrowLeft, 
  BarChart3, 
  Move, 
  AlertCircle,
  QrCode
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { BarcodeDisplay } from '@/components/shared/barcode-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from "@/lib/utils";
import Link from 'next/link';

const stockHistory = [
  { date: '2026-04-30', stock: 150 },
  { date: '2026-05-01', stock: 142 },
  { date: '2026-05-02', stock: 130 },
  { date: '2026-05-03', stock: 125 },
  { date: '2026-05-04', stock: 110 },
  { date: '2026-05-05', stock: 105 },
  { date: '2026-05-06', stock: 102 },
];

const movementLogs = [
  { id: '1', date: '2 mins ago', type: 'OUTBOUND', qty: -5, reason: 'Order #ORD-9281', user: 'Staff John' },
  { id: '2', date: '4 hours ago', type: 'INBOUND', qty: 50, reason: 'Restock PO-882', user: 'Admin' },
  { id: '3', date: '1 day ago', type: 'ADJUSTMENT', qty: -2, reason: 'Damaged during picking', user: 'Staff Mike' },
];

export default function SKUDetailPage() {
  const { sku } = useParams();

  const product = {
    sku: sku,
    name: 'Premium Wireless Headphones',
    category: 'Electronics',
    price: 5999,
    stock: 102,
    minStock: 25,
    warehouse: 'Mumbai Main',
    bin: 'A-12-04',
    barcode: 'HE-9281-001'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{product.sku}</h2>
              <StatusBadge status="SUCCESS" label="Active" />
            </div>
            <p className="text-muted-foreground">{product.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Move className="w-4 h-4" /> Transfer Stock
          </Button>
          <Button className="gap-2">
            <QrCode className="w-4 h-4" /> Print Labels
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Stock Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="stock" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" /> Product Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center py-4 bg-white rounded-xl">
              <BarcodeDisplay value={product.barcode} label={product.sku as string} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Stock</p>
                <p className="text-2xl font-bold">{product.stock}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Min Threshold</p>
                <p className="text-2xl font-bold text-orange-400">{product.minStock}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                <p className="font-bold">{product.warehouse}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Bin</p>
                <p className="font-bold">{product.bin}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Movement History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movementLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      log.type === 'INBOUND' ? "bg-green-100 text-green-700" :
                      log.type === 'OUTBOUND' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {log.type === 'INBOUND' ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold">{log.reason}</p>
                      <p className="text-xs text-muted-foreground">{log.date} by {log.user}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-lg">
                    {log.qty > 0 ? '+' : ''}{log.qty}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
