import { useStaffTasks } from '@/hooks/use-staff-tasks';
import { useExecutionStore } from '@/store/execution-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, Package, Truck, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function MyTasksList() {
  const { tasks, isLoading, updateTaskStatus } = useStaffTasks();
  const { startTask } = useExecutionStore();

  const handleStartTask = async (task: any) => {
    // Optimistic UI: Set to IN_PROGRESS in backend
    if (task.status === 'PENDING') {
      updateTaskStatus.mutate({ taskId: task.id, status: 'IN_PROGRESS' });
    }

    // Fetch order details to get required items
    const { data: orderDetails } = await api.get(`/orders/${task.orderId}`);
    
    // Map order items to requiredItems format
    const requiredItems = orderDetails.items.map((item: any) => ({
      sku: item.product.sku,
      quantity: item.quantity,
      name: item.product.name,
    }));

    startTask(task.id, task.taskType, task.orderId, requiredItems);
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse p-4">
      <div className="h-24 bg-slate-100 rounded-3xl" />
      <div className="h-24 bg-slate-100 rounded-3xl" />
    </div>;
  }

  const activeOrPendingTasks = tasks.filter((t: any) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');

  if (activeOrPendingTasks.length === 0) {
    return (
      <div className="text-center py-12 px-4 space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No Pending Tasks</h3>
        <p className="text-slate-500">You're all caught up! Wait for new assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {activeOrPendingTasks.map((task: any) => (
        <Card 
          key={task.id} 
          className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all active:scale-[0.98]"
        >
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge variant="outline" className={`border-none px-2 py-1 ${
                  task.taskType === 'PICKING' ? 'bg-blue-100 text-blue-700' :
                  task.taskType === 'PACKING' ? 'bg-amber-100 text-amber-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {task.taskType === 'PICKING' && <PlayCircle className="w-3.5 h-3.5 mr-1" />}
                  {task.taskType === 'PACKING' && <Package className="w-3.5 h-3.5 mr-1" />}
                  {task.taskType === 'DISPATCH' && <Truck className="w-3.5 h-3.5 mr-1" />}
                  {task.taskType}
                </Badge>
                <h4 className="font-extrabold text-lg text-slate-900 mt-2">{task.order?.orderNumber}</h4>
              </div>
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                {task.status}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/20"
                onClick={() => handleStartTask(task)}
              >
                {task.status === 'IN_PROGRESS' ? 'Resume Task' : 'Start Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
