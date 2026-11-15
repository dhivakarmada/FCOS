'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  FileSpreadsheet, 
  BarChart3, 
  Loader2,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";

interface CompiledReport {
  id: string;
  name: string;
  type: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  size: string;
  created: string;
}

const initialReports: CompiledReport[] = [
  { id: 'REP-001', name: 'Inventory Volumetric Allocation Digest', type: 'Inventory Summary', format: 'PDF', size: '2.4 MB', created: '2026-05-26 14:20' },
  { id: 'REP-002', name: 'D2C Order Fulfillment Velocity Log', type: 'Fulfillment Operations', format: 'CSV', size: '840 KB', created: '2026-05-24 10:15' },
  { id: 'REP-003', name: 'Returns & Disputes Financial Ledger', type: 'Billing Audit', format: 'XLSX', size: '1.2 MB', created: '2026-05-20 09:00' },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<CompiledReport[]>(initialReports);
  const [reportType, setReportType] = useState('inventory');
  const [format, setFormat] = useState('PDF');
  const [range, setRange] = useState('30days');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompileReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompiling(true);

    const typeNames: Record<string, string> = {
      inventory: 'Inventory Volumetric Allocation Digest',
      sales: 'D2C Order Fulfillment Velocity Log',
      billing: 'Returns & Disputes Financial Ledger',
    };

    const typeLabels: Record<string, string> = {
      inventory: 'Inventory Summary',
      sales: 'Fulfillment Operations',
      billing: 'Billing Audit',
    };

    const newReport: CompiledReport = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      name: `${typeNames[reportType]} - May 2026`,
      type: typeLabels[reportType],
      format: format as any,
      size: format === 'PDF' ? '1.8 MB' : format === 'CSV' ? '420 KB' : '1.1 MB',
      created: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setIsCompiling(false);
          setReports([newReport, ...reports]);
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Compiling warehouse logs and BI analytics calculations...',
        success: 'Report compiled successfully! Registered to downloads registry.',
        error: 'Failed to compile report.',
      }
    );
  };

  const handleDownload = (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Downloading ${name}...`,
        success: `File downloaded successfully!`,
        error: 'Download failed.',
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Export Reports</h2>
          <p className="text-muted-foreground font-medium">Compile active warehouse metrics, shipping speeds, and return statistics into CSV or PDF documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-800" onClick={() => toast.info("Cleaned report export cache.")}>
            <FolderOpen className="h-4 w-4" /> Clean Cache
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Compiler Form */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              BI Report Compiler
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Generate targeted reports on sales logs, inventory capacity, and returns disputes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleCompileReport} className="space-y-4">
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Report Focus Area</span>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                    <SelectItem value="inventory">Inventory Allocations & Stockouts</SelectItem>
                    <SelectItem value="sales">Fulfillment Speed & Courier Times</SelectItem>
                    <SelectItem value="billing">Storage & Pick Pack Invoices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Date Range</span>
                  <Select value={range} onValueChange={setRange}>
                    <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="quarter">Last Quarter (90d)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Export Format</span>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-850 text-slate-100">
                      <SelectItem value="PDF">PDF (Printable Slip)</SelectItem>
                      <SelectItem value="CSV">CSV (Spreadsheet raw)</SelectItem>
                      <SelectItem value="XLSX">Excel Workbook (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isCompiling} className="w-full rounded-xl h-10 shadow-lg shadow-primary/20">
                  {isCompiling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compiling Report...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" /> Compile & Register Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Downloads History Registry */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Downloads Registry</CardTitle>
            <CardDescription className="text-xs">Immutable history of compiled reports available for local extraction.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Report ID</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400">Report Name</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Format</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">File Size</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((rep) => (
                  <TableRow key={rep.id} className="border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <TableCell className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 py-4">
                      {rep.id}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{rep.name}</span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">{rep.type} • {rep.created}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        rep.format === 'PDF'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold text-[9px] rounded-full'
                          : rep.format === 'CSV'
                            ? 'bg-blue-500/10 text-blue-550 border-blue-500/20 font-bold text-[9px] rounded-full'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] rounded-full'
                      }>
                        {rep.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-550 dark:text-slate-450">{rep.size}</TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline" className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-800 mr-2" onClick={() => handleDownload(rep.id, rep.name)}>
                        <Download className="w-3 h-3 mr-1" /> Extract
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
