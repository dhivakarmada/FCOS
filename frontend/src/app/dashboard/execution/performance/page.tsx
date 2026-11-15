'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Target, 
  Clock, 
  ShieldCheck, 
  Activity,
  Award
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

const mockBadges: AchievementBadge[] = [
  { id: 'b1', title: 'Speed Demon', description: 'Complete 50 picks in under 1 hour.', icon: '⚡', unlocked: false },
  { id: 'b2', title: 'QC Ninja', description: 'Zero errors on 200 consecutive package audits.', icon: '🎯', unlocked: false },
  { id: 'b3', title: 'SLA Champion', description: 'Exceed same-day cutoff shipping targets by 15%.', icon: '🏆', unlocked: false },
  { id: 'b4', title: 'Perfect Attendance', description: 'Clock in on time for 10 consecutive shifts.', icon: '📅', unlocked: false },
];

const mockTrendData: any[] = [];

export default function PerformancePage() {
  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Performance</h2>
          <p className="text-xs text-muted-foreground font-medium">Track your picking speeds and quality metrics</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] rounded-full">
          Level 4 Picker
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm p-4 flex flex-col gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl w-fit">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-450 uppercase block">Average Pick Speed</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-0.5">0 picks/h</strong>
            <span className="text-[8px] text-slate-450 font-bold mt-0.5 block">--</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-4 flex flex-col gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-450 uppercase block">QC Accuracy Rate</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-0.5">100.0%</strong>
            <span className="text-[8px] text-slate-450 font-bold mt-0.5 block">Error limit: 1.0% max</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-4 flex flex-col gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-450 uppercase block">Fulfillment SLA Count</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-0.5">0 items</strong>
            <span className="text-[8px] text-slate-450 font-bold mt-0.5 block">This week total</span>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-4 flex flex-col gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-fit">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-450 uppercase block">Fulfillment Idle Time</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-0.5">0%</strong>
            <span className="text-[8px] text-slate-450 font-bold mt-0.5 block">Below warehouse limit (5%)</span>
          </div>
        </Card>
      </div>

      {/* Chart analysis */}
      <Card className="border-none shadow-sm overflow-hidden bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
            Daily Accuracy & Velocity Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    color: '#fff',
                    fontSize: '9px'
                  }} 
                />
                <Line type="monotone" dataKey="speed" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Achievement badges gamification */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" /> Unlocked Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-850">
          {mockBadges.map((badge) => (
            <div key={badge.id} className={`p-4 flex gap-3.5 items-center ${!badge.unlocked ? 'opacity-40' : ''}`}>
              <div className="text-2xl p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl w-12 h-12 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                {badge.icon}
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{badge.title}</h4>
                <p className="text-[10px] text-slate-450 leading-relaxed">{badge.description}</p>
              </div>
              <div>
                {badge.unlocked ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[8px] rounded-full">
                    Unlocked
                  </Badge>
                ) : (
                  <Badge className="bg-slate-150 text-slate-400 border-none font-bold text-[8px] rounded-full">
                    Locked
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
