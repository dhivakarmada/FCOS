'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useLiveOpsStore, SystemEvent } from '@/store/live-ops-store';
import { EventFilters } from '@/components/live-ops/event-filters';
import { MetricsPanel } from '@/components/live-ops/metrics-panel';
import { AnomalyDetector } from '@/components/live-ops/anomaly-detector';
import { EventStream } from '@/components/live-ops/event-stream';
import { DrillDownInspector } from '@/components/live-ops/drill-down-inspector';
import { useAuthStore } from '@/store/auth-store';

export default function LiveOpsDashboardPage() {
  const socket = useSocket();
  const { ingestEvent } = useLiveOpsStore();
  const { user } = useAuthStore();
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleGlobalFeed = (data: any) => {
      const eventName = data.event || 'unknown';
      let category: 'ORDER' | 'INVENTORY' | 'STAFF' | 'SYSTEM' | 'RETURN' = 'SYSTEM';
      let message = 'Unknown event occurred';
      let severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' = 'INFO';
      let entityId = '';

      if (eventName === 'order-status-updated') {
        category = 'ORDER';
        entityId = data.payload?.orderNumber || data.payload?.orderId;
        message = `Order ${entityId} status changed to ${data.payload?.status}`;
        severity = data.payload?.status === 'CANCELLED' ? 'WARNING' : 'INFO';
      } else if (eventName === 'inventory-updated') {
        category = 'INVENTORY';
        entityId = data.payload?.sku;
        message = `Stock updated for ${entityId}: ${data.payload?.quantity} units`;
      } else if (eventName === 'task-assigned') {
        category = 'STAFF';
        entityId = data.payload?.taskId;
        message = `Task ${entityId} assigned to staff ${data.payload?.staffId}`;
      } else if (eventName === 'return-updated') {
        category = 'RETURN';
        entityId = data.payload?.returnId;
        message = `Return ${entityId} updated to ${data.payload?.status}`;
        severity = 'WARNING';
      } else {
        message = JSON.stringify(data.payload).substring(0, 50) + '...';
      }

      ingestEvent({
        category,
        type: eventName,
        message,
        severity,
        entityId,
        vendorId: data.vendorId,
        payload: data.payload || data,
      });
    };

    if (user?.role === 'SUPER_ADMIN') {
      socket.on('live-feed', handleGlobalFeed);
    } else {
      const wrapEvent = (eventName: string) => (payload: any) => {
        handleGlobalFeed({ event: eventName, payload, vendorId: user?.vendorId });
      };

      socket.on('order-status-updated', wrapEvent('order-status-updated'));
      socket.on('inventory-updated', wrapEvent('inventory-updated'));
      socket.on('task-assigned', wrapEvent('task-assigned'));
      socket.on('return-updated', wrapEvent('return-updated'));
      socket.on('warehouse-updated', wrapEvent('warehouse-updated'));
    }

    return () => {
      if (user?.role === 'SUPER_ADMIN') {
        socket.off('live-feed', handleGlobalFeed);
      } else {
        socket.off('order-status-updated');
        socket.off('inventory-updated');
        socket.off('task-assigned');
        socket.off('return-updated');
        socket.off('warehouse-updated');
      }
    };
  }, [socket, ingestEvent, user]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Super Admin Live Operations</h1>
          <p className="text-slate-500 text-sm">Real-time enterprise event telemetry and automatic anomaly logging</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Enterprise Feed Active</span>
        </div>
      </div>

      <MetricsPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-slate-950 rounded-3xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative z-10 flex flex-col h-full min-h-0">
            <EventFilters />
            <EventStream onEventClick={setSelectedEvent} />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col min-h-0">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 h-full overflow-y-auto font-sans">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-4 px-2">Live Anomaly Telemetry</h3>
            <AnomalyDetector />
            
            <div className="px-2 mt-8 text-center text-slate-400 text-xs">
              <p>Anomaly detection rules active.</p>
              <p className="mt-1">Monitoring for spikes in returns, unusual stock movements, and high order velocities.</p>
            </div>
          </div>
        </div>
      </div>

      <DrillDownInspector 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </div>
  );
}
