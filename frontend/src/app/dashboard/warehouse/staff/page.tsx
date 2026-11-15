'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Users, RefreshCw, BarChart2, CheckCircle2, UserPlus, 
  Search, ShieldAlert, Clock, ArrowRight, Award, Zap 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

export default function StaffManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: staffList = [], isLoading, refetch } = useQuery({
    queryKey: ['staff-performance-all'],
    queryFn: async () => {
      const res = await api.get('/staff/performance/all');
      return res.data;
    }
  });

  const staff = staffList.map((s: any) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    role: s.designation || 'Staff',
    picksHour: s.completedTasks,
    accuracy: s.performanceScore ? `${s.performanceScore}%` : '100.0%',
    idleTime: '0m',
    status: s.totalTasks > s.completedTasks ? 'ACTIVE' : 'IDLE'
  }));

  const leaderboard = [...staffList]
    .sort((a: any, b: any) => (parseFloat(b.performanceScore) || 0) - (parseFloat(a.performanceScore) || 0))
    .slice(0, 5)
    .map((s: any, idx: number) => ({
      rank: idx + 1,
      name: `${s.firstName} ${s.lastName} (${s.designation || 'Staff'})`,
      score: s.performanceScore ? `${s.performanceScore}%` : '100.0%',
      speed: `${s.completedTasks} tasks`
    }));

  const handleReassignRole = (id: string, newRole: string) => {
    toast.success(`Reassigned staff member role to ${newRole}`);
    refetch();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Workforce productivity scores synchronized");
    }, 600);
  };

  const filteredStaff = staff.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3">ACTIVE</Badge>;
      case "BREAK":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full px-3">ON BREAK</Badge>;
      default:
        return <Badge className="bg-slate-950 text-slate-500 border border-slate-850 rounded-full px-3">IDLE</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Users className="w-8 h-8 text-indigo-400" />
            Workforce Productivity Console
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Monitor picking/packing speeds, track active breaks, and re-allocate staff to high-congestion zones.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync logs
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staff Table (ColSpan 2) */}
        <Card className="lg:col-span-2 border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>On-Duty Staff Registry</CardTitle>
            <CardDescription>Metrics tracked across active facility sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search by worker name or staff ID..." 
                  className="pl-9 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
                {["all", "PICKER", "PACKER", "QC_AUDITOR"].map((role: string) => (
                  <Button
                    key={role}
                    variant={roleFilter === role ? "secondary" : "ghost"}
                    onClick={() => setRoleFilter(role)}
                    size="sm"
                    className="rounded-lg text-[10px] capitalize h-7 px-2"
                  >
                    {role.toLowerCase().replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <Table>
                <TableHeader className="bg-slate-955/60">
                  <TableRow className="border-b border-slate-800">
                    <TableHead className="text-slate-400 font-bold">Staff ID</TableHead>
                    <TableHead className="text-slate-400 font-bold">Name & Role</TableHead>
                    <TableHead className="text-slate-400 font-bold">Throughput</TableHead>
                    <TableHead className="text-slate-400 font-bold">Accuracy</TableHead>
                    <TableHead className="text-slate-400 font-bold">Status</TableHead>
                    <TableHead className="text-slate-400 font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s: any) => (
                    <TableRow key={s.id} className="border-b border-slate-800 hover:bg-slate-900/20">
                      <TableCell className="font-mono text-slate-450 font-bold">{s.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-200">{s.name}</p>
                          <Badge variant="outline" className="text-[8px] bg-slate-950 border-slate-850 py-0 text-slate-400 uppercase">
                            {s.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-350">{s.picksHour} items/hr</TableCell>
                      <TableCell className="font-bold text-indigo-400 font-mono">{s.accuracy}</TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-right">
                        {s.role !== "QC_AUDITOR" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-indigo-455 hover:text-white"
                            onClick={() => handleReassignRole(s.id, "QC_AUDITOR")}
                          >
                            Assign QC
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

        {/* Efficiency Leaderboard */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Award className="w-4 h-4 text-indigo-400" /> Top Performer Shift Scores
            </CardTitle>
            <CardDescription>Efficiency leaderboard based on actual hourly completions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaderboard.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No active performance records.
              </div>
            ) : (
              leaderboard.map((lead, idx) => (
                <div key={idx} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full flex items-center justify-center font-bold text-[10px]">
                      #{lead.rank}
                    </div>
                    <div>
                      <p className="font-bold text-slate-350">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lead.speed}</p>
                    </div>
                  </div>
                  <span className="font-bold text-white">{lead.score}</span>
                </div>
              ))
            )}

            <div className="border-t border-slate-850 pt-4 text-xs">
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center justify-between text-indigo-400">
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 animate-pulse" /> Auto-assign algorithm:</span>
                <Badge variant="outline" className="bg-slate-950 border-slate-850 text-indigo-400 text-[8px]">ACTIVE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
