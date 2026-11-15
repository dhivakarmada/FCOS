'use client';

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  ShieldAlert, CheckCircle2, XCircle, ArrowRight, Camera, 
  Settings, RefreshCw, BarChart2, ShieldCheck, AlertTriangle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

interface QCTask {
  id: string;
  orderNumber: string;
  vendor: string;
  itemsCount: number;
  value: number;
  status: "PENDING" | "PASSED" | "REJECTED";
  flag: boolean;
  items?: any[];
}

export default function QCOperationsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QCTask | null>(null);

  const { data: returnsData, isLoading, refetch } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const res = await api.get('/returns');
      return res.data;
    }
  });

  const qcTasks: QCTask[] = (returnsData?.returns || []).map((ret: any) => ({
    id: ret.id,
    orderNumber: ret.order?.orderNumber || 'N/A',
    vendor: ret.order?.vendor?.name || 'Unknown Vendor',
    itemsCount: ret.order?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
    value: Number(ret.refundAmount || ret.order?.totalAmount || 0),
    status: ret.status === 'REQUESTED' ? 'PENDING' : ret.status === 'APPROVED' ? 'PASSED' : 'REJECTED',
    flag: Number(ret.refundAmount || ret.order?.totalAmount || 0) > 10000,
    items: ret.order?.items || [],
  }));

  const approveMutation = useMutation({
    mutationFn: async (returnId: string) => {
      return api.post(`/returns/${returnId}/approve`);
    },
    onSuccess: () => {
      toast.success("Return approved and inventory restocked!");
      refetch();
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve return");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (returnId: string) => {
      return api.post(`/returns/${returnId}/reject`);
    },
    onSuccess: () => {
      toast.success("Return rejected. Order status reverted.");
      refetch();
      setSelectedTask(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject return");
    }
  });

  const handleVerify = (id: string, status: "PASSED" | "REJECTED") => {
    if (status === "PASSED") {
      approveMutation.mutate(id);
    } else {
      rejectMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Quality Control queue updated");
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Quality Control Assurance
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Audit high-value package verify checklists, classify damaged inventory, and review proof photos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QC Tasks Table (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>QC Verification List</CardTitle>
            <CardDescription>Orders requiring visual inspection before label handover.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-950/60">
                  <TableRow className="border-b border-slate-800">
                    <TableHead className="text-slate-400 font-bold">QC Task</TableHead>
                    <TableHead className="text-slate-400 font-bold">Order</TableHead>
                    <TableHead className="text-slate-400 font-bold">Value</TableHead>
                    <TableHead className="text-slate-400 font-bold">Status</TableHead>
                    <TableHead className="text-slate-400 font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qcTasks.map((t) => (
                    <TableRow key={t.id} className="border-b border-slate-800 hover:bg-slate-900/20">
                      <TableCell className="font-mono text-slate-450 font-bold">{t.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-200">{t.orderNumber}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{t.vendor}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-300">
                        ₹{t.value.toLocaleString()}
                        {t.flag && <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] py-0">High Value</Badge>}
                      </TableCell>
                      <TableCell>
                        {t.status === "PASSED" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5">PASSED</Badge>
                        ) : t.status === "REJECTED" ? (
                          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-2.5">REJECTED</Badge>
                        ) : (
                          <Badge className="bg-slate-950 text-slate-500 border border-slate-850 rounded-full px-2.5">PENDING</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.status === "PENDING" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-indigo-400 hover:text-white"
                            onClick={() => setSelectedTask(t)}
                          >
                            Inspect <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Verification Inspector Panel */}
        <div>
          {selectedTask ? (
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur shadow-xl animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-white">Inspector Deck - {selectedTask.id}</CardTitle>
                <CardDescription>Inspect items for Order {selectedTask.orderNumber}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>Items Count</span>
                    <span className="text-white font-bold">{selectedTask.itemsCount} products</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-400">
                    <span>Order Value</span>
                    <span className="text-white font-bold">₹{selectedTask.value.toLocaleString()}</span>
                  </div>
                </div>

                {selectedTask.items && selectedTask.items.length > 0 && (
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Items to Inspect</h4>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {selectedTask.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-slate-200 text-[11px]">
                          <span className="truncate pr-2">{item.product?.name || 'Product'} <span className="text-[10px] text-indigo-400 font-mono">({item.product?.sku})</span></span>
                          <span className="font-bold text-slate-450 shrink-0">Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-3">
                  <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Verification Checklist</h4>
                  {[
                    "Item barcodes verify with scan logs",
                    "No outer box seal damages/tear",
                    "Seals matches invoice checklist description"
                  ].map((chk, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <input type="checkbox" className="accent-indigo-500 rounded border-slate-800" />
                      <span className="text-slate-450">{chk}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 border border-slate-850 rounded-xl flex items-center justify-between text-slate-450">
                  <span className="flex items-center gap-1.5"><Camera className="w-4 h-4 text-slate-400" /> Upload Audit Photo</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-400 hover:text-white" onClick={() => toast.success("Audit photo uploaded successfully")}>
                    Browse
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-rose-600 hover:bg-rose-750 text-white font-bold h-9 rounded-xl"
                    onClick={() => handleVerify(selectedTask.id, "REJECTED")}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-755 text-white font-bold h-9 rounded-xl"
                    onClick={() => handleVerify(selectedTask.id, "PASSED")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl h-64 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <ShieldAlert className="w-8 h-8 mb-3 opacity-20 text-slate-455" />
              <p className="font-bold text-sm">No active audits</p>
              <p className="text-xs text-slate-650 mt-1 max-w-[200px]">Select "Inspect" next to any pending task to trigger visual checklists.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
