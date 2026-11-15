'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Check, 
  Trash2, 
  Settings, 
  AlertTriangle, 
  Clock, 
  Package, 
  Truck, 
  VolumeX, 
  Eye, 
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface AlertNotification {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'inventory' | 'shipping' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
}

const initialNotifications: AlertNotification[] = [
  { id: 'NTF-001', type: 'critical', category: 'inventory', message: 'Stock alert: SKU "PREM-HD-GRY-L" has dropped to 8 units (Safety stock limit: 30).', timestamp: '12 mins ago', read: false },
  { id: 'NTF-002', type: 'warning', category: 'shipping', message: 'Courier delay: Shipment FCOS-SH-4428 via FedEx is experiencing weather delays in Chicago, IL.', timestamp: '1 hour ago', read: false },
  { id: 'NTF-003', type: 'critical', category: 'inventory', message: 'Out of stock: SKU "JOG-ATH-BLK-S" is completely depleted. 8 backorders pending.', timestamp: '3 hours ago', read: false },
  { id: 'NTF-004', type: 'info', category: 'system', message: 'Sync complete: 142 SKUs matching Shopify catalog synced successfully.', timestamp: '1 day ago', read: true },
  { id: 'NTF-005', type: 'info', category: 'shipping', message: 'Carrier assigned: DHL Express designated for international shipment FCOS-SH-4410.', timestamp: '2 days ago', read: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AlertNotification[]>(initialNotifications);
  
  // Configurations
  const [stockLimit, setStockLimit] = useState('30');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notification marked as read");
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All active alerts marked as read");
  };

  const handleDeleteAlert = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Alert removed from log");
  };

  const handleSaveSettings = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Saving alert threshold rules...',
        success: 'Settings updated! Warehouse alert triggers recalibrated.',
        error: 'Failed to update settings.',
      }
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Brand Alerts</h2>
          <p className="text-muted-foreground font-medium">Manage operations notifications, stock warning limits, and transit alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2 rounded-xl border-slate-200 dark:border-slate-800" onClick={handleMarkAllRead}>
              <Check className="w-4 h-4" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Alert Panels */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Alerts feed */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Active Notifications Log
                </CardTitle>
                <CardDescription className="text-xs">Real-time indicators of inventory levels and courier dispatch progress.</CardDescription>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                  <Bell className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-300">All quiet for now</h3>
                <p className="text-xs text-slate-500 max-w-xs">No active stockout warnings or shipment transit exceptions logged.</p>
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
                    ) : (
                      <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {n.category} • {n.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {n.timestamp}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${!n.read ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                      {n.message}
                    </p>
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
                      onClick={() => handleDeleteAlert(n.id)}
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

        {/* Configuration panel */}
        <Card className="lg:col-span-3 border-none shadow-sm flex flex-col bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Alert Rules Registry
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Configure trigger parameters and safety thresholds for automated warehouse alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-350 block">Safety Stock Threshold</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">Alert when inventory drops below this units threshold per SKU:</p>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  value={stockLimit}
                  onChange={(e) => setStockLimit(e.target.value)}
                  className="h-10 rounded-xl border-slate-850 bg-slate-900 text-xs w-24 text-center font-bold"
                />
                <Button variant="outline" className="h-10 rounded-xl border-slate-850 text-slate-300 text-xs flex-1" onClick={handleSaveSettings}>
                  Calibrate Threshold
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-350 block">Dispatch Channels</span>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Email Notifications</p>
                  <p className="text-[10px] text-slate-400">Send high priority digests daily</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Shopify Webhooks</p>
                  <p className="text-[10px] text-slate-400">Sync triggers to Shopify portal</p>
                </div>
                <Switch checked={webhookAlerts} onCheckedChange={setWebhookAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">SMS Direct Dispatch</p>
                  <p className="text-[10px] text-slate-400">Alerts for critical stockouts</p>
                </div>
                <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4">
              <Button className="w-full rounded-xl h-10 shadow-lg shadow-primary/20" onClick={handleSaveSettings}>
                Apply Custom Alert Registry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
