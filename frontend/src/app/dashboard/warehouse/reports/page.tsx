'use client';

import { useState } from "react";
import { 
  FileText, Download, RefreshCw, BarChart2, CheckCircle2, 
  Search, ShieldAlert, Clock, ArrowRight, Play, Database 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ReportsExporterPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reportsList = [
    { title: "Daily Fulfillment Summary", desc: "Order count, pick accuracy, and SLA compliance metrics.", formats: ["PDF", "CSV"] },
    { title: "Staff Productivity Sheet", desc: "Picks/hour, pack speeds, error rates, and attendance logs.", formats: ["Excel", "CSV"] },
    { title: "Inventory Aging & Stock Count", desc: "Bin-level SKUs, cycle count records, and low stock items.", formats: ["Excel", "PDF"] },
    { title: "Courier Dispatch & Delays", desc: "Shipment logs, carrier handovers, and delay exceptions.", formats: ["CSV"] }
  ];

  const handleDownload = (title: string, format: string) => {
    toast.success(`Generating report: ${title}`);
    setTimeout(() => {
      toast.success(`Downloaded ${title} in ${format} format successfully`);
    }, 700);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Reports list synchronized");
    }, 550);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <FileText className="w-8 h-8 text-indigo-400" />
            Operational Reports Desk
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Export shift productivity metrics, layout bin inventory states, and download logistics delay summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh list
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reportsList.map((rep, idx) => (
          <Card key={idx} className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl hover:border-slate-700 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4 text-xs">
              <div className="space-y-1.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-455" />
                  {rep.title}
                </h4>
                <p className="text-slate-400 leading-relaxed font-medium">{rep.desc}</p>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-850 pt-4 justify-between">
                <div className="flex items-center gap-2">
                  {rep.formats.map(f => (
                    <Badge key={f} variant="outline" className="text-[9px] bg-slate-950 border-slate-850 text-indigo-450 px-2 py-0">
                      {f}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  {rep.formats.map(f => (
                    <Button 
                      key={f}
                      size="sm" 
                      variant="ghost"
                      className="text-[10px] h-7 px-2 rounded-lg text-slate-350 hover:bg-slate-800"
                      onClick={() => handleDownload(rep.title, f)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> {f}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
