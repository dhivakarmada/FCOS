import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Zap, Clock } from 'lucide-react';

export function PerformanceSummary() {
  const { user } = useAuthStore();
  const staffId = user?.id;

  const { data: performance, isLoading } = useQuery({
    queryKey: ['staff-performance-personal', staffId],
    queryFn: async () => {
      // Assuming we can get personal performance from the global list for now
      // In a real app, you'd have a specific endpoint for the logged-in staff
      const { data } = await api.get('/staff/performance/all');
      return data.find((s: any) => s.userId === staffId) || null;
    },
    enabled: !!staffId,
  });

  if (isLoading) return <div className="h-32 bg-slate-100 animate-pulse rounded-3xl" />;

  if (!performance) return <div className="p-4 text-center text-slate-500">No performance data available.</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 text-emerald-900">
        <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-2">
          <Target className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="text-2xl font-black">{performance.completedTasks}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Tasks Done</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-blue-50 text-blue-900">
        <CardContent className="p-4 flex flex-col justify-center items-center text-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-2xl font-black">{performance.performanceScore?.toFixed(1) || '0.0'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Speed Score</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-none shadow-sm rounded-3xl bg-purple-50 text-purple-900 col-span-2">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 text-purple-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Average Time</p>
              <p className="font-bold">{performance.avgCompletionMinutes} mins / task</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
