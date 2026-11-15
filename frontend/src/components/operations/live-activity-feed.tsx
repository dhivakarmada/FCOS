import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function LiveActivityFeed() {
  const socket = useSocket();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleEvent = (type: string) => (data: any) => {
      setEvents((prev) => [
        { id: Date.now().toString(), type, data, timestamp: new Date() },
        ...prev.slice(0, 49) // Keep last 50 events
      ]);
    };

    socket.on('inventory-updated', handleEvent('INVENTORY'));
    socket.on('order-updated', handleEvent('ORDER'));
    socket.on('task-assigned', handleEvent('TASK'));
    socket.on('return-updated', handleEvent('RETURN'));

    return () => {
      socket.off('inventory-updated');
      socket.off('order-updated');
      socket.off('task-assigned');
      socket.off('return-updated');
    };
  }, [socket]);

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-full">
      <CardHeader className="bg-slate-900 border-b border-slate-800 p-4">
        <CardTitle className="text-sm font-bold flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Activity Stream
          </span>
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-none">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 bg-slate-950">
        <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
          {events.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm font-mono">
              Waiting for events...
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} className="p-3 hover:bg-slate-900 transition-colors flex gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <div className="shrink-0 pt-0.5">
                {event.type === 'INVENTORY' && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                {event.type === 'ORDER' && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                {event.type === 'TASK' && <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />}
                {event.type === 'RETURN' && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="font-bold text-slate-200 text-xs tracking-wider">{event.type}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{format(event.timestamp, 'HH:mm:ss')}</span>
                </div>
                <p className="text-slate-400 text-xs break-words">
                  {event.type === 'INVENTORY' && `Stock changed for SKU ${event.data.sku} (${event.data.quantity})`}
                  {event.type === 'ORDER' && `Order ${event.data.orderNumber} is now ${event.data.status}`}
                  {event.type === 'TASK' && `Task ${event.data.taskType} assigned to staff ${event.data.staffId}`}
                  {event.type === 'RETURN' && `Return ${event.data.returnId} for Order ${event.data.orderId} updated to ${event.data.status}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
