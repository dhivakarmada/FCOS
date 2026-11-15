import { useExecutionStore } from '@/store/execution-store';
import { useStaffTasks } from '@/hooks/use-staff-tasks';
import { useOrders } from '@/hooks/use-orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { BarcodeScannerInput } from './barcode-scanner-input';
import { toast } from 'sonner';

export function ActiveTaskView() {
  const { taskId, taskType, orderId, requiredItems, scannedItems, completeTask, pauseTask } = useExecutionStore();
  const { updateTaskStatus } = useStaffTasks();
  const { updateOrderStatus } = useOrders();

  const handleComplete = async () => {
    if (!taskId || !orderId) return;

    try {
      // 1. Mark task as COMPLETED
      await updateTaskStatus.mutateAsync({ taskId, status: 'COMPLETED' });

      // 2. Advance Order Status based on task type
      let nextOrderStatus = '';
      if (taskType === 'PICKING') nextOrderStatus = 'PACKED';
      if (taskType === 'PACKING') nextOrderStatus = 'SHIPPED';
      if (taskType === 'DISPATCH') nextOrderStatus = 'OUT_FOR_DELIVERY';

      if (nextOrderStatus) {
        await updateOrderStatus.mutateAsync({ id: orderId, status: nextOrderStatus });
      }

      toast.success(`${taskType} Task Completed Successfully!`);
      
      // 3. Clear local state
      completeTask();
    } catch (error) {
      console.error(error);
    }
  };

  // Check if all items are fully scanned
  const allItemsScanned = requiredItems.every(
    (item) => (scannedItems[item.sku] || 0) >= item.quantity
  );

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={pauseTask} className="rounded-full bg-slate-100 hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Active {taskType}</h2>
          <p className="text-slate-500 font-mono text-sm">Order: {orderId?.substring(0, 8)}...</p>
        </div>
      </div>

      <BarcodeScannerInput />

      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 px-1">Required Items</h3>
        {requiredItems.map((item) => {
          const scanned = scannedItems[item.sku] || 0;
          const isComplete = scanned >= item.quantity;
          
          return (
            <Card key={item.sku} className={`border-none rounded-2xl transition-all ${isComplete ? 'bg-emerald-50 shadow-none' : 'bg-white shadow-sm'}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <Circle className="w-8 h-8 text-slate-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isComplete ? 'text-emerald-900 line-through opacity-70' : 'text-slate-900'}`}>
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 mt-1">{item.sku}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {scanned}
                  </span>
                  <span className="text-slate-400 font-bold"> / {item.quantity}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0">
        <Button 
          size="lg" 
          className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all"
          disabled={!allItemsScanned}
          onClick={handleComplete}
        >
          {allItemsScanned ? 'Complete Task' : 'Scan all items to complete'}
        </Button>
      </div>
    </div>
  );
}
