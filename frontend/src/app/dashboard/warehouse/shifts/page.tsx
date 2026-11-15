'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  PlayCircle, RefreshCw, BarChart2, CheckCircle2, UserPlus, 
  Search, ShieldAlert, Clock, ArrowRight, Calendar, Users 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ShiftManagementPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: staffList = [], refetch } = useQuery({
    queryKey: ['staff-list-shifts'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  const morningStaff = staffList.filter((_: any, idx: number) => idx % 3 === 0);
  const eveningStaff = staffList.filter((_: any, idx: number) => idx % 3 === 1);
  const nightStaff = staffList.filter((_: any, idx: number) => idx % 3 === 2);

  const shifts = [
    { 
      id: "SFT-01", 
      name: "Morning Shift A", 
      hours: "06:00 - 14:00", 
      staffCount: morningStaff.length, 
      supervisor: morningStaff[0] ? `${morningStaff[0].firstName} ${morningStaff[0].lastName}` : "Unassigned", 
      status: "ACTIVE" 
    },
    { 
      id: "SFT-02", 
      name: "Evening Shift B", 
      hours: "14:00 - 22:00", 
      staffCount: eveningStaff.length, 
      supervisor: eveningStaff[0] ? `${eveningStaff[0].firstName} ${eveningStaff[0].lastName}` : "Unassigned", 
      status: "SCHEDULED" 
    },
    { 
      id: "SFT-03", 
      name: "Night Shift C", 
      hours: "22:00 - 06:00", 
      staffCount: nightStaff.length, 
      supervisor: nightStaff[0] ? `${nightStaff[0].firstName} ${nightStaff[0].lastName}` : "Unassigned", 
      status: "SCHEDULED" 
    }
  ];

  const handleCreateShift = () => {
    toast.info("Shift structure is managed dynamically based on DB staff registry.");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().then(() => {
      setIsRefreshing(false);
      toast.success("Shift attendance and schedules updated");
    });
  };

  const anomalies: any[] = [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Shift scheduling & Attendance
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Plan supervisor rotations, track absent staff, and manage zone workload allocations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button className="h-9 gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold" onClick={handleCreateShift}>
            <UserPlus className="w-4 h-4" /> Schedule Shift
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shifts List (ColSpan 2) */}
        <div className="lg:col-span-2 space-y-4">
          {shifts.map(s => (
            <Card key={s.id} className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl hover:border-slate-700 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">{s.id}</span>
                    <h4 className="font-bold text-white text-sm">{s.name}</h4>
                    {s.status === "ACTIVE" && <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] py-0">ACTIVE NOW</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {s.hours}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-500" /> {s.staffCount} staff</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-850 justify-between">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Supervisor</p>
                    <span className="font-bold text-slate-200">{s.supervisor}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-indigo-405 text-xs hover:bg-slate-800 rounded-lg" onClick={() => toast.info(`Editing details for ${s.name}`)}>
                    Edit Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attendance overview */}
        <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl text-xs self-start">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Users className="w-4 h-4 text-indigo-400" /> Facility Staff Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl">
                <p className="text-2xl font-bold text-emerald-450 font-mono">{staffList.length}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">Present</p>
              </div>
              <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl">
                <p className="text-2xl font-bold text-rose-455 font-mono">0</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">Absent</p>
              </div>
            </div>

            {anomalies.length > 0 && (
              <div className="border-t border-slate-850 pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Anomalies</h4>
                {anomalies.map((anom: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-955/40 border border-slate-900 rounded-lg">
                    <div>
                      <p className="font-bold text-slate-350">{anom.name}</p>
                      <p className="text-[10px] text-slate-550 mt-0.5">{anom.status}</p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">{anom.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
