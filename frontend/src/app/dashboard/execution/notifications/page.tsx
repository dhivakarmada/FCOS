'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Info,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useActivityStore } from '@/store/activity-store';

interface StaffNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'message';
  category: 'Task' | 'Shift' | 'Facility' | 'System';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function StaffNotificationsPage() {
  const { user } = useAuthStore();
  const { activities, clearActivities } = useActivityStore();
  
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);

  // Fetch real notifications/tasks from database
  const fetchRealAlerts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data: tasks } = await api.get(`/staff/${user.id}/tasks`);
      
      // Map pending/in-progress tasks to alerts
      const taskAlerts = tasks
        .filter((t: any) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
        .map((t: any, idx: number) => ({
          id: t.id,
          type: t.status === 'PENDING' ? 'critical' : 'warning',
          category: 'Task',
          title: `Task Assigned: ${t.taskType}`,
          message: `Active ${t.taskType} workflow is requested for Order #${t.order?.orderNumber || t.orderId}. Please load your execution dashboard.`,
          timestamp: 'Just now',
          read: false
        }));

      // Map WebSocket client activities to alerts
      const activityAlerts = activities.map((act) => ({
        id: act.id,
        type: act.type === 'order' ? 'info' : 'message',
        category: act.type === 'inventory' ? 'Facility' : 'System',
        title: act.title,
        message: act.description,
        timestamp: 'Recently',
        read: false
      }));

      setNotifications([...taskAlerts, ...activityAlerts]);
    } catch (error) {
      console.error('Error loading staff alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSimulated) {
      fetchRealAlerts();
    }
  }, [user?.id, activities, isSimulated]);

  // Simulation mode toggler
  const handleToggleSimulation = (enabled: boolean) => {
    setIsSimulated(enabled);
    if (enabled) {
      const mockAlerts: StaffNotification[] = [
        { id: 'STF-NTF-01', type: 'critical', category: 'Task', title: 'Urgent Order Assigned', message: 'VIP Same-day shipping order ORD-9910 must be packed within 15 minutes to meet courier cutoff.', timestamp: '2 mins ago', read: false },
        { id: 'STF-NTF-02', type: 'warning', category: 'Facility', title: 'Courier Arrival Alert', message: 'FedEx dispatch truck arriving at Dock #4 in 10 minutes. Prepare manifestations.', timestamp: '10 mins ago', read: false },
        { id: 'STF-NTF-03', type: 'message', category: 'Shift', title: 'Manager Instruction', message: 'Manager (NJ-1 Operations): Please clear Zone B Aisle 4 backorders before clocking out.', timestamp: '30 mins ago', read: false }
      ];
      setNotifications(mockAlerts);
      toast.info("Switched to Demo Simulation Mode.");
    } else {
      fetchRealAlerts();
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Alert marked as read");
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All alerts marked as read");
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Alert cleared");
  };

  const handleInvestigate = (n: StaffNotification) => {
    toast.info(`Navigating to verify: ${n.title}`);
    if (n.category === 'Task') {
      window.location.href = '/dashboard/execution';
    } else if (n.title.toLowerCase().includes('courier')) {
      window.location.href = '/dashboard/execution/dispatch';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-md mx-auto pt-2 pb-12 space-y-6 md:max-w-2xl animate-in fade-in">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Alerts Log</h2>
          <p className="text-xs text-muted-foreground font-medium">Real-time alerts & manager instructions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sim Mode</span>
            <Switch checked={isSimulated} onCheckedChange={handleToggleSimulation} />
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" className="h-7 text-[10px] rounded-lg text-slate-400 hover:text-emerald-500 font-bold" onClick={handleMarkAllRead}>
              <Check className="w-3.5 h-3.5 mr-1" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Main notifications feed list */}
      <Card className="border-none shadow-sm overflow-hidden flex flex-col">
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/80">
          {notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                <Bell className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-350">Clear Alerts Queue</h3>
              <p className="text-xs text-slate-550 max-w-xs mx-auto">No pending shift updates or warehouse exceptions.</p>
              <Button className="rounded-full bg-primary font-bold text-xs" onClick={() => handleToggleSimulation(true)}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Load Simulation Feed
              </Button>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 flex gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10 ${!n.read ? 'bg-primary/[0.02] dark:bg-primary/[0.01]' : ''}`}
              >
                <div className="shrink-0 mt-0.5">
                  {n.type === 'critical' ? (
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : n.type === 'warning' ? (
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : n.type === 'message' ? (
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {n.category} • {n.id.substring(0, 8)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {n.timestamp}
                    </span>
                  </div>
                  <h4 className={`text-xs ${!n.read ? 'font-black text-slate-900 dark:text-slate-100' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                    {n.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-550 dark:text-slate-400">
                    {n.message}
                  </p>
                  
                  {/* Action Link for Tasks */}
                  {!n.read && (n.category === 'Task' || n.title.toLowerCase().includes('courier')) && (
                    <div className="pt-2">
                      <Button size="xs" variant="outline" className="h-7 text-[10px] rounded-lg border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350" onClick={() => handleInvestigate(n)}>
                        Investigate Action <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5 self-center">
                  {!n.read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleDeleteNotification(n.id)}
                    title="Dismiss Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
