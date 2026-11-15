import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Target, 
  Timer, 
  AlertCircle,
  Activity,
  Award
} from 'lucide-react';

interface Props {
  stats: any;
  title?: string;
}

export function StaffStatsCard({ stats, title = "My Performance Summary" }: Props) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          {title}
        </h3>
        <div className="px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest block leading-none">Productivity Score</span>
          <span className="text-2xl font-black text-primary">{stats.productivityScore}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricItem 
          label="Tasks Completed" 
          value={stats.tasksCompleted} 
          icon={Zap} 
          color="blue" 
          subValue="Real work done"
        />
        <MetricItem 
          label="Accuracy Rate" 
          value={`${stats.accuracyRate}%`} 
          icon={Target} 
          color="emerald" 
          subValue="Correct scans"
        />
        <MetricItem 
          label="Avg Time / Task" 
          value={`${stats.avgCompletionMinutes}m`} 
          icon={Timer} 
          color="purple" 
          subValue="Efficiency speed"
        />
        <MetricItem 
          label="Scan Errors" 
          value={stats.errorCount} 
          icon={AlertCircle} 
          color="rose" 
          subValue="Mismatched items"
        />
      </div>

      <div className="bg-slate-900 dark:bg-white p-6 rounded-[2rem] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-100 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">System Status</p>
            <p className="text-lg font-black text-white dark:text-slate-900">Live Work Tracking Active</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-500 uppercase">Last Sync</p>
          <p className="text-sm font-mono font-bold text-slate-300 dark:text-slate-600">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, icon: Icon, color, subValue }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <Card className={`border-none shadow-sm ${colors[color]} border`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-[10px] font-bold mt-1 opacity-60 uppercase">{subValue}</p>
          </div>
          <Icon className="w-6 h-6 opacity-40" />
        </div>
      </CardContent>
    </Card>
  );
}
