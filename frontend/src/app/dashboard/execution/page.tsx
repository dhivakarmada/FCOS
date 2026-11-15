'use client';

import { useExecutionStore } from '@/store/execution-store';
import { useAuthStore } from '@/store/auth-store';
import { MyTasksList } from '@/components/execution/my-tasks-list';
import { ActiveTaskView } from '@/components/execution/active-task-view';
import { PerformanceSummary } from '@/components/execution/performance-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ExecutionDashboardPage() {
  const { taskId } = useExecutionStore();
  const { user } = useAuthStore();

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-80px)] md:max-w-2xl pt-4 animate-in fade-in">
      {/* Top Mobile Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
            {user?.firstName?.[0] || 'S'}
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-none">{user?.firstName || 'Staff'} {user?.lastName || 'Member'}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online & Ready</span>
            </div>
          </div>
        </div>
      </div>

      {taskId ? (
        <ActiveTaskView />
      ) : (
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 dark:bg-slate-800 rounded-3xl p-1 mb-6">
            <TabsTrigger value="tasks" className="rounded-full font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-full font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">
              Performance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <MyTasksList />
          </TabsContent>
          
          <TabsContent value="performance" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <PerformanceSummary />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
