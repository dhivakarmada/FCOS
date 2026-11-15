'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Activity, RefreshCw, BarChart2, CheckCircle2, 
  Search, ShieldAlert, Clock, ArrowRight, History 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

export default function FacilityAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dbLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit-logs');
      return res.data;
    }
  });

  const logs = dbLogs.map((log: any) => {
    let detailsStr = "";
    if (log.details) {
      if (typeof log.details === "string") {
        detailsStr = log.details;
      } else {
        detailsStr = log.details.details || JSON.stringify(log.details);
      }
    }
    return {
      id: log.id,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
      action: log.action,
      module: log.module,
      details: detailsStr || "No details provided",
      time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Facility audit trails updated");
    });
  };


  const filteredLogs = logs.filter((log: any) => {
    const searchString = `${log.user} ${log.action} ${log.module} ${log.details}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getActionBadge = (act: string) => {
    if (act.includes("REJECT") || act.includes("FAIL")) {
      return <Badge variant="destructive" className="font-mono text-[9px] py-0 px-2">REJECT</Badge>;
    }
    if (act.includes("COMPLETE") || act.includes("CONFIRM")) {
      return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] py-0 px-2">SUCCESS</Badge>;
    }
    return <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[9px] py-0 px-2">{act}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
            Immutable Facility Audit Trail
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Track physical bin adjustments, picker path overrides, and package re-allocation events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh logs
          </Button>
        </div>
      </div>

      {/* Audit Registry */}
      <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search audit trail by user, action, description..." 
                className="pl-9 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <Table>
              <TableHeader className="bg-slate-950/60">
                <TableRow className="border-b border-slate-800">
                  <TableHead className="text-slate-400 font-bold">Timestamp</TableHead>
                  <TableHead className="text-slate-400 font-bold">User Operator</TableHead>
                  <TableHead className="text-slate-400 font-bold">Action</TableHead>
                  <TableHead className="text-slate-400 font-bold">Module</TableHead>
                  <TableHead className="text-slate-400 font-bold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                      No audit events match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="border-b border-slate-800 hover:bg-slate-900/20 text-xs">
                      <TableCell className="font-mono text-slate-500 font-bold">{log.time}</TableCell>
                      <TableCell className="font-semibold text-slate-300">{log.user}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <code className="text-[10px] bg-slate-950 text-indigo-400 px-2 py-0.5 rounded font-mono border border-slate-850">
                          {log.module}
                        </code>
                      </TableCell>
                      <TableCell className="text-slate-400 font-medium">{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
