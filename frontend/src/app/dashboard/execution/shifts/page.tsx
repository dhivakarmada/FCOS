'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  Check, 
  Pause, 
  Play, 
  Calendar, 
  Smartphone, 
  Activity,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface AttendanceLog {
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  overtime: string;
  status: 'present' | 'late' | 'excused';
}

const mockHistory: AttendanceLog[] = [];

export default function ShiftsPage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [shiftTime, setShiftTime] = useState('06:00 AM');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [history, setHistory] = useState<AttendanceLog[]>(mockHistory);
  
  // Timer mock
  const [timer, setTimer] = useState('00:00:00'); // 4h 48m 32s elapsed

  const handleClockToggle = () => {
    if (clockedIn) {
      // Clock out
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: 'Authenticating sign-out & closing shift log...',
          success: () => {
            setClockedIn(false);
            setOnBreak(false);
            const newLog: AttendanceLog = {
              date: new Date().toISOString().split('T')[0],
              checkIn: shiftTime,
              checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              totalHours: '8.0h',
              overtime: '0.0h',
              status: 'present'
            };
            setHistory([newLog, ...history]);
            return 'Shift completed! Have a nice day.';
          },
          error: 'Clock-out failed.',
        }
      );
    } else {
      // Clock in
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1200)),
        {
          loading: 'Verifying warehouse geo-boundaries and device signature...',
          success: () => {
            setClockedIn(true);
            setShiftTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            return 'Clock-in approved. Shift Morning (CA-1) active.';
          },
          error: 'Location validation mismatch.',
        }
      );
    }
  };

  const handleBreakToggle = () => {
    if (onBreak) {
      toast.success("Break complete. Returning to picking route.");
      setOnBreak(false);
    } else {
      toast.warning("Break active. Picking/packing queues paused.");
      setOnBreak(true);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Shift & Clock</h2>
          <p className="text-xs text-muted-foreground font-medium">Record attendance & track shift breaks</p>
        </div>
        <Badge className={clockedIn ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}>
          {clockedIn ? 'Active' : 'Off Duty'}
        </Badge>
      </div>

      {/* Clocking controller */}
      <Card className="border-none shadow-sm bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6 text-center">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Shift Elapsed Duration</span>
            <h1 className="text-4xl font-black tracking-tighter font-mono text-primary animate-pulse">{clockedIn ? timer : '00:00:00'}</h1>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold">Active: Morning Shift (06:00 - 14:00)</p>
          </div>

          <div className="flex gap-3 justify-center">
            {clockedIn && (
              <Button 
                onClick={handleBreakToggle}
                className={`h-12 px-6 rounded-2xl font-bold text-xs flex gap-1.5 items-center ${
                  onBreak 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-none' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-850'
                }`}
              >
                {onBreak ? (
                  <>
                    <Play className="w-4 h-4" /> End Break
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" /> Start Break
                  </>
                )}
              </Button>
            )}

            <Button 
              onClick={handleClockToggle}
              className={`h-12 px-6 rounded-2xl font-bold text-xs border-none flex gap-1.5 items-center ${
                clockedIn 
                  ? 'bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-md shadow-rose-500/10 text-white' 
                  : 'bg-gradient-to-br from-primary to-primary/90 hover:from-primary hover:to-primary/95 text-white'
              }`}
            >
              {clockedIn ? (
                <>
                  <Clock className="w-4 h-4" /> Clock Out Shift
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Clock In Shift
                </>
              )}
            </Button>
          </div>

          {/* Geo boundaries verify */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850 text-left text-xs text-slate-350">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Geo-Boundaries</p>
                <p className="text-[9px] text-slate-400">Inside Oakland Facility CA-1</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Terminal Device</p>
                <p className="text-[9px] text-slate-400">Zebra TC57 #DOCK4</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance logs table */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Shift Attendance logs</span>
        <div className="space-y-2">
          {history.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.date}</span>
                  <Badge className={
                    log.status === 'present'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full px-1.5 py-0'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[8px] rounded-full px-1.5 py-0'
                  }>
                    {log.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-450 mt-0.5">Shift: {log.checkIn} - {log.checkOut}</p>
              </div>
              <div className="text-right text-xs">
                <strong className="font-black text-slate-800 dark:text-slate-200 block">{log.totalHours}</strong>
                {parseFloat(log.overtime) > 0 && (
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">+{log.overtime} OT</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
