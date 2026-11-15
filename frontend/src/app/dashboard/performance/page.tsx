'use client';

import { useStaffPerformance } from '@/hooks/use-staff-performance';
import { useAuthStore } from '@/store/auth-store';
import { StaffStatsCard } from '@/components/performance/staff-stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, History, TrendingUp, Award, Activity, 
  Clock, ArrowUpRight, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const { myStats, isLoading } = useStaffPerformance();
  const [selectedLeaderboardRole, setSelectedLeaderboardRole] = useState<'PICKER' | 'PACKER'>('PICKER');

  const isOpsAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_MANAGER';

  // Mock Operations performance metrics
  const operationsPerformanceData = [
    { day: 'Mon', picks: 0, packs: 0, sla: 100 },
    { day: 'Tue', picks: 0, packs: 0, sla: 100 },
    { day: 'Wed', picks: 0, packs: 0, sla: 100 },
    { day: 'Thu', picks: 0, packs: 0, sla: 100 },
    { day: 'Fri', picks: 0, packs: 0, sla: 100 },
    { day: 'Sat', picks: 0, packs: 0, sla: 100 },
    { day: 'Sun', picks: 0, packs: 0, sla: 100 },
  ];

  const orderAgingData = [
    { range: '< 2 hrs', count: 0, status: 'Healthy' },
    { range: '2-4 hrs', count: 0, status: 'Warning' },
    { range: '4-8 hrs', count: 0, status: 'Critical' },
    { range: '> 8 hrs', count: 0, status: 'SLA Breach' },
  ];

  const staffRankings = {
    PICKER: [] as any[],
    PACKER: [] as any[]
  };

  const handleExportKPIs = () => {
    toast.success("Facility Performance Report exported successfully");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Performance Data</p>
      </div>
    );
  }

  // --- VIEW 1: ADMIN/MANAGER WAREHOUSE PERFORMANCE OVERVIEW ---
  if (isOpsAdmin) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Facility Performance Center</h2>
            <p className="text-muted-foreground font-medium mt-1">Monitor operational speed, SLA success limits, order aging, and worker productivity indexes.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" className="h-9 gap-2 rounded-xl" onClick={handleExportKPIs}>
              <ArrowUpRight className="w-3.5 h-3.5" /> Export performance logs
            </Button>
          </div>
        </div>

        {/* Operational KPI summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Picks/Hour</p>
                <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">0 / hr</h3>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                  -- from target
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <Activity className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Packs/Hour</p>
                <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">0 / hr</h3>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                  -- from target
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <Award className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global SLA Success</p>
                <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">100.0%</h3>
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> No pending breaches
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Trophy className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Order Processing</p>
                <h3 className="text-3xl font-extrabold text-slate-950 dark:text-slate-50 mt-1">0 mins</h3>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                  --
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Leaderboard */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Daily Throughput chart */}
          <Card className="md:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Daily Fulfillment Throughput
              </CardTitle>
              <CardDescription>Picks vs Packs operations per day</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={operationsPerformanceData}>
                    <defs>
                      <linearGradient id="colorPicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPacks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Items Picked" dataKey="picks" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorPicks)" />
                    <Area type="monotone" name="Items Packed" dataKey="packs" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorPacks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Aging chart */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" /> Queue Order Aging
              </CardTitle>
              <CardDescription>Distribution of active orders inside queue</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderAgingData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="px-4 mt-4 space-y-1.5 text-xs">
                {orderAgingData.map((item, i) => (
                  <div key={i} className="flex justify-between items-center font-bold">
                    <span className="text-slate-400">{item.range}</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-none text-white ${
                      item.status === 'Healthy' ? 'bg-emerald-500' :
                      item.status === 'Warning' ? 'bg-blue-500' :
                      item.status === 'Critical' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}>
                      {item.count} orders
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff leaderboard roster */}
        <div className="pt-2">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Operational Efficiency Leaderboard
                </CardTitle>
                <CardDescription>Top performers ranked by volume and accuracy rate</CardDescription>
              </div>

              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <Button 
                  size="sm" 
                  variant={selectedLeaderboardRole === 'PICKER' ? 'default' : 'ghost'} 
                  onClick={() => setSelectedLeaderboardRole('PICKER')}
                  className="rounded-lg text-xs font-bold px-3 py-1.5 h-7"
                >
                  Pickers
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedLeaderboardRole === 'PACKER' ? 'default' : 'ghost'} 
                  onClick={() => setSelectedLeaderboardRole('PACKER')}
                  className="rounded-lg text-xs font-bold px-3 py-1.5 h-7"
                >
                  Packers
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-16">Rank</th>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">{selectedLeaderboardRole === 'PICKER' ? 'Picks completed' : 'Packs completed'}</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {staffRankings[selectedLeaderboardRole].map((s) => (
                      <tr key={s.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="p-3 text-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                            s.rank === 1 ? 'bg-amber-100 text-amber-700' :
                            s.rank === 2 ? 'bg-slate-100 text-slate-700' :
                            s.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {s.rank}
                          </span>
                        </td>
                        <td className="p-3 font-bold">{s.name}</td>
                        <td className="p-3 font-mono">{selectedLeaderboardRole === 'PICKER' ? (s as any).picks : (s as any).packs} units</td>
                        <td className="p-3 text-emerald-500 font-mono font-bold">{s.accuracy}%</td>
                        <td className="p-3">
                          <Badge className={`text-[8px] px-1.5 py-0 h-4 border-none text-white ${
                            s.status === 'Active' ? 'bg-emerald-500' :
                            s.status === 'Idle' ? 'bg-slate-400' : 'bg-blue-500'
                          }`}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold rounded-lg gap-1 border border-slate-100">
                            View log <ChevronRight className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    );
  }

  // --- VIEW 2: STAFF PERSONAL PERFORMANCE VIEW (ORIGINAL VIEW) ---
  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 animate-in fade-in">
      <div>
        <h2 className="text-4xl font-black tracking-tight uppercase">Performance Analytics</h2>
        <p className="text-slate-500 font-bold mt-1 uppercase tracking-tight">Real-time productivity tracking & fulfillment accuracy</p>
      </div>

      {myStats ? (
        <StaffStatsCard stats={myStats} />
      ) : (
        <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
          <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-400">Start performing tasks to see your stats</p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <div className="space-y-4">
               <AchievementItem 
                 title="Fast Picker" 
                 description="Completed 50 tasks with < 5m average" 
                 locked={myStats?.tasksCompleted < 50} 
               />
               <AchievementItem 
                 title="Perfect Accuracy" 
                 description="Reached 100% accuracy over 20 tasks" 
                 locked={myStats?.accuracyRate < 100} 
               />
               <AchievementItem 
                 title="Warehouse Legend" 
                 description="Ranked #1 on the leaderboard" 
                 locked={true} 
               />
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Recent Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12 text-center">
             <TrendingUp className="w-12 h-12 text-slate-100 mx-auto mb-4" />
             <p className="font-bold text-slate-400">Detailed trend analysis coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AchievementItem({ title, description, locked }: any) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
      locked ? 'bg-slate-50 border-slate-100 grayscale opacity-50' : 'bg-emerald-50 border-emerald-100'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        locked ? 'bg-slate-200' : 'bg-emerald-500'
      }`}>
        <Award className={`w-6 h-6 ${locked ? 'text-slate-400' : 'text-white'}`} />
      </div>
      <div>
        <p className="font-black text-slate-900 leading-none">{title}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-tight">{description}</p>
      </div>
    </div>
  );
}
