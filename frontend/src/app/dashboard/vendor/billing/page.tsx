'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CreditCard, 
  Download, 
  DollarSign, 
  Calendar, 
  FileText, 
  Activity, 
  Layers, 
  Truck, 
  Package, 
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';

interface Invoice {
  id: string;
  period: string;
  storageFees: number;
  fulfillmentFees: number;
  shippingFees: number;
  total: number;
  status: 'paid' | 'pending' | 'failed';
}

const mockInvoices: Invoice[] = [];

const mockChartData: any[] = [];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const handleDownloadInvoice = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Generating PDF for ${id}...`,
        success: `Invoice ${id} downloaded successfully!`,
        error: 'Generation failed.',
      }
    );
  };

  const handlePayInvoice = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Processing payment for ${id}...`,
        success: () => {
          setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
          return `Payment successful! Invoice ${id} marked as Paid.`;
        },
        error: 'Payment failed.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground font-medium">Monitor your warehouse storage space, packaging activities, and courier delivery logistics costs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20" onClick={() => toast.success("Connected Visa payment method is up to date.")}>
            <CreditCard className="w-4 h-4" /> Payment Settings
          </Button>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10 text-primary transition-all duration-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">
                  Accruing
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Accrued Balance
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                  $0.00
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Active Billing Window
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 transition-all duration-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400">Monthly invoice</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Next Billing Date
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  Jun 01, 2026
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Automatic charge to Visa (*4242)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 transition-all duration-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-emerald-500">+8.5% YoY</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Year-to-Date Fees
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                  $0.00
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Across all warehouses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 transition-all duration-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full font-bold">Active</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  Payment Method
                </p>
                <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50">
                  Visa •••• 4242
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Expires 12/28
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Details */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Cost breakdown chart */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Monthly Cost Trends
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Analysis of storage space fees vs operations pick & pack vs courier delivery charges.</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: '1px solid #334155', 
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  <Bar dataKey="Storage" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="Fulfillment" fill="#6366f1" stackId="a" />
                  <Bar dataKey="Shipping" fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic breakdown card */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Unbilled Accrued Fees Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Estimate of fees generated during the active billing window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <div className="text-xs">
                  <p className="font-bold">Volumetric Warehouse Storage</p>
                  <p className="text-slate-400">12.5 cubic feet avg usage</p>
                </div>
              </div>
              <span className="font-bold text-sm">$380.00</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <div className="text-xs">
                  <p className="font-bold">Operations Pick & Pack</p>
                  <p className="text-slate-400">320 units processed at $1.50/unit</p>
                </div>
              </div>
              <span className="font-bold text-sm">$480.00</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500" />
                <div className="text-xs">
                  <p className="font-bold">Courier Shipping Charges</p>
                  <p className="text-slate-400">158 courier shipments dispatched</p>
                </div>
              </div>
              <span className="font-bold text-sm">$950.00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Registry */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Invoices Log</CardTitle>
          <CardDescription className="text-xs">Verify invoices history, payment receipt documents, and settle pending payments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Invoice ID</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Billing Period</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Storage Fees</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Fulfillment</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Courier Shipping</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Total Invoice</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <TableCell className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 py-4">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {inv.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{inv.period}</TableCell>
                  <TableCell className="text-xs font-bold text-right text-slate-800 dark:text-slate-300">${inv.storageFees.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-bold text-right text-slate-800 dark:text-slate-300">${inv.fulfillmentFees.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-bold text-right text-slate-800 dark:text-slate-300">${inv.shippingFees.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-extrabold text-right text-primary">${inv.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={
                      inv.status === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px] rounded-full' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px] rounded-full'
                    }>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === 'pending' && (
                        <Button size="xs" onClick={() => handlePayInvoice(inv.id)} className="h-7 text-[10px] rounded-lg">
                          Pay Now
                        </Button>
                      )}
                      <Button size="xs" variant="outline" onClick={() => handleDownloadInvoice(inv.id)} className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-800">
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
