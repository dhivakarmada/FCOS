'use client';

import { useState } from "react";
import { 
  CreditCard, Search, Filter, Download, Plus, DollarSign, 
  FileText, CheckCircle2, AlertCircle, RefreshCw, ArrowUpRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

export default function BillingFinancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock billing metrics
  const metrics = [
    { title: "Monthly GMV Handled", value: "₹0", change: "0%", isPositive: true },
    { title: "Storage Charges accrued", value: "₹0", change: "0%", isPositive: true },
    { title: "Pick & Pack fees", value: "₹0", change: "0%", isPositive: true },
    { title: "Shipping & Return handling", value: "₹0", change: "0%", isPositive: true },
  ];

  // Mock invoice data
  const initialInvoices: any[] = [];

  const [invoices, setInvoices] = useState(initialInvoices);

  // Fee Structure configuration state (Mock edits)
  const [rates, setRates] = useState({
    storagePerCuFt: 18.5,
    pickPackPerItem: 12.0,
    baseShippingRate: 45.0,
    returnHandlingFee: 25.0
  });

  const handleRateChange = (field: keyof typeof rates, value: number) => {
    setRates(prev => ({ ...prev, [field]: value }));
    toast.success("Rate parameter updated in memory");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Billing registry synchronized");
    }, 800);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3">PAID</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3">PENDING</Badge>;
      case "OVERDUE":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-3 animate-pulse">OVERDUE</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-indigo-500" />
            Billing & Financial Control
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Manage tenant billing rates, track accounts receivable, and view GST invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Ledger
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="w-4 h-4" /> Run Billing Cycle
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.title}</p>
              <h2 className="text-3xl font-black text-white mt-2 tracking-tighter">{m.value}</h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isPositive ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                  {m.change}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-medium">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice List & Filters (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>GST Invoices & Statements</CardTitle>
            <CardDescription>Statements generated for vendors on the 1st of each month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by vendor name or invoice ID..." 
                  className="pl-9 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <Button 
                  variant={statusFilter === "all" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === "PAID" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("PAID")}
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Paid
                </Button>
                <Button 
                  variant={statusFilter === "PENDING" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("PENDING")}
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Pending
                </Button>
                <Button 
                  variant={statusFilter === "OVERDUE" ? "secondary" : "ghost"}
                  onClick={() => setStatusFilter("OVERDUE")}
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Overdue
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-950/60">
                  <TableRow className="border-b border-slate-800">
                    <TableHead className="text-slate-400 font-bold">Invoice</TableHead>
                    <TableHead className="text-slate-400 font-bold">Vendor</TableHead>
                    <TableHead className="text-slate-400 font-bold">Storage</TableHead>
                    <TableHead className="text-slate-400 font-bold">Ops / Ship</TableHead>
                    <TableHead className="text-slate-400 font-bold">Total Amount</TableHead>
                    <TableHead className="text-slate-400 font-bold">Status</TableHead>
                    <TableHead className="text-slate-400 font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                        No billing statements match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <TableRow key={inv.id} className="border-b border-slate-800 hover:bg-slate-900/20">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <div>
                              <p className="font-bold text-slate-200">{inv.id}</p>
                              <p className="text-[10px] text-slate-500">{inv.cycle}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-300">{inv.vendor}</TableCell>
                        <TableCell className="font-mono text-slate-300">₹{inv.storage.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-slate-300">
                          ₹{(inv.pickPack + inv.shipping + inv.returns).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold text-white">₹{inv.total.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="hover:bg-slate-800 rounded-lg" onClick={() => toast.success(`Downloading statement ${inv.id}`)}>
                            <Download className="w-4 h-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Global Billing Configuration rates */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-500" /> Tariff Settings
            </CardTitle>
            <CardDescription>Adjust base parameters used for automatic system-wide accruals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Storage Rate (per cu.ft.)</span>
                  <span className="text-indigo-400 font-mono">₹{rates.storagePerCuFt.toFixed(2)}</span>
                </label>
                <input 
                  type="range" min="5" max="50" step="0.5" 
                  className="w-full mt-2 accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                  value={rates.storagePerCuFt} 
                  onChange={(e) => handleRateChange("storagePerCuFt", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Pick & Pack Fee (per item)</span>
                  <span className="text-indigo-400 font-mono">₹{rates.pickPackPerItem.toFixed(2)}</span>
                </label>
                <input 
                  type="range" min="2" max="30" step="0.5" 
                  className="w-full mt-2 accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                  value={rates.pickPackPerItem} 
                  onChange={(e) => handleRateChange("pickPackPerItem", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Base Courier Rate</span>
                  <span className="text-indigo-400 font-mono">₹{rates.baseShippingRate.toFixed(2)}</span>
                </label>
                <input 
                  type="range" min="20" max="150" step="1.0" 
                  className="w-full mt-2 accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                  value={rates.baseShippingRate} 
                  onChange={(e) => handleRateChange("baseShippingRate", parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Return Handling Charge</span>
                  <span className="text-indigo-400 font-mono">₹{rates.returnHandlingFee.toFixed(2)}</span>
                </label>
                <input 
                  type="range" min="5" max="100" step="1.0" 
                  className="w-full mt-2 accent-indigo-500 bg-slate-950 rounded-lg cursor-pointer"
                  value={rates.returnHandlingFee} 
                  onChange={(e) => handleRateChange("returnHandlingFee", parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Pricing Plan Rules</h4>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Free Storage Tier</span>
                <span>First 100 cu.ft.</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Premium SLA Surcharge</span>
                <span>+15% on late pick-ups</span>
              </div>
              <Button className="w-full rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs">
                Configure Special Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
