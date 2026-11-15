import { useStaffPerformance } from '@/hooks/use-staff-performance';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trophy, 
  Timer, 
  Target, 
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';

export function StaffLeaderboard() {
  const { leaderboard, isLoading } = useStaffPerformance();

  if (isLoading) return <div className="p-8 text-center font-bold text-slate-400">Syncing live performance data...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Efficiency Leaderboard
        </h3>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-widest text-[10px]">
          Live Updates
        </Badge>
      </div>

      <div className="grid gap-4">
        {leaderboard.map((staff: any, idx: number) => (
          <Card key={staff.id} className="border-none shadow-sm overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className={`w-16 h-20 flex flex-col items-center justify-center ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' : 
                  idx === 1 ? 'bg-slate-100 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  <span className="text-xs font-black uppercase opacity-50">Pos</span>
                  <span className="text-2xl font-black">#{idx + 1}</span>
                </div>

                <div className="flex-1 px-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{staff.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Zap className="w-3 h-3 text-primary" /> {staff.tasksCompleted} Tasks
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Target className="w-3 h-3 text-emerald-500" /> {staff.accuracyRate}% Acc
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg Time</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1">
                        <Timer className="w-3.5 h-3.5" /> {staff.avgCompletionMinutes}m
                      </span>
                    </div>

                    <div className="text-right px-6 py-2 bg-slate-900 dark:bg-white rounded-2xl min-w-[100px]">
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-tighter">Score</span>
                      <span className="text-xl font-black text-white dark:text-slate-900">{staff.productivityScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {leaderboard.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-400">No activity logged today</p>
          </div>
        )}
      </div>
    </div>
  );
}
