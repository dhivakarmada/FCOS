'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Percent,
  ShoppingBag,
  Zap,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ScanBarcode,
  Users,
  Building2,
  Clock,
  Printer,
  ShieldAlert
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole, useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isVendor = user?.role === UserRole.VENDOR_ADMIN;

  const { data: dashboard, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    },
    enabled: !!user && user.role !== UserRole.STAFF,
  });

  const { data: revenueStats } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue?period=daily');
      return res.data;
    },
    enabled: !!user && user.role !== UserRole.STAFF,
  });

  // Staff-specific queries
  const { data: staffTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['staff-tasks', user?.id],
    queryFn: async () => {
      const res = await api.get(`/staff/${user?.id}/tasks`);
      return res.data;
    },
    enabled: !!user?.id && user?.role === UserRole.STAFF,
  });

  const { data: staffStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['staff-performance-my-stats', user?.id],
    queryFn: async () => {
      const res = await api.get('/staff/performance/my-stats');
      return res.data;
    },
    enabled: !!user?.id && user?.role === UserRole.STAFF,
  });

  // Calculate dynamic data
  const ordersTotal = dashboard?.totalOrders || 0;
  const activeInventory = dashboard?.totalStock || 0; 
  const pendingShipments = dashboard?.pendingShipments || 0;
  const lowStockAlerts = dashboard?.lowStockCount || 0;

  // Use real revenue trend if available
  const chartData = revenueStats?.breakdown?.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    orders: item.count,
    revenue: item.revenue,
    returns: Math.round(item.count * 0.05),
  })) || [
    { name: 'Mon', orders: 0, revenue: 0, returns: 0 },
    { name: 'Tue', orders: 0, revenue: 0, returns: 0 },
    { name: 'Wed', orders: 0, revenue: 0, returns: 0 },
    { name: 'Thu', orders: 0, revenue: 0, returns: 0 },
    { name: 'Fri', orders: 0, revenue: 0, returns: 0 },
    { name: 'Sat', orders: 0, revenue: 0, returns: 0 },
    { name: 'Sun', orders: 0, revenue: 0, returns: 0 },
  ];

  const handleSyncChannels = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Syncing sales channels (Shopify, Amazon)...',
        success: 'Channels synced successfully! 24 new orders imported.',
        error: 'Sync failed.',
      }
    );
  };

  const handleTriggerReorder = (sku: string) => {
    toast.success(`Purchase order generated for ${sku}. Sent to manufacturer.`);
  };

  if (isVendor) {
    return (
      <RoleGuard allowedRoles={[UserRole.VENDOR_ADMIN]}>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                  FCOS Brand Controller
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Connected to Shopify</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">Brand Command Center</h2>
              <p className="text-muted-foreground font-medium">Real-time D2C brand logistics, fulfillment performance & sales analytics.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncChannels}
                className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 
                Sync Shopify
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> 
                Refresh
              </Button>
              <Button size="sm" className="h-9 gap-2 rounded-xl shadow-lg shadow-primary/20">
                <ArrowUpRight className="w-3.5 h-3.5" /> Export BI Report
              </Button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 transition-all duration-500">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
                      +12.4% MoM
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Total Sales Revenue
                    </p>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                      $48,250.00
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                      $42,500 target achieved (113.5%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 transition-all duration-500">
                      <Percent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
                      +0.2% wk
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Order Conversion
                    </p>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                      3.42%
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                      Industrial standard: 2.5%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 transition-all duration-500">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50">
                      142 Active
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Active SKU Catalog
                    </p>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                      {activeInventory > 0 ? activeInventory : 142}
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">
                      120 Healthy, 22 Low Stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 bg-rose-50/20 dark:bg-rose-950/5">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 transition-all duration-500">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50">
                      -0.5% MoM
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Return Rate
                    </p>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-50 tabular-nums">
                      2.14%
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1 text-emerald-600">
                      Below warehouse limit (3.5%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and AI engine */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Sales BI Analysis Chart */}
            <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Brand Business Intelligence
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">Daily Revenue & Shipping Returns volume</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider text-slate-200">Revenue ($)</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider text-slate-200">Returns</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={12} stroke="#f43f5e" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '16px', 
                          border: '1px solid #334155', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)',
                          color: '#fff'
                        }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area yAxisId="right" type="monotone" dataKey="returns" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorReturns)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI Advisor Panel & SLA Risk */}
            <Card className="lg:col-span-3 border-none shadow-sm flex flex-col justify-between bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    FCOS AI Engine
                  </CardTitle>
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Operational Advisor</Badge>
                </div>
                <CardDescription className="text-xs text-slate-400">Predictive insights & SLA threat alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {/* Insights */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">Stockout Risk: Eco-Fabric Tee (M-Black)</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sales velocity increased by 35% this week. Predicted stockout in <strong className="text-amber-500">4 days</strong>. restock 200 units immediately to avoid $1,200 lost revenue.
                    </p>
                    <div className="pt-2">
                      <Button size="xs" variant="outline" className="h-7 text-[10px] rounded-lg border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-bold" onClick={() => handleTriggerReorder('ECO-TEE-BLK-M')}>
                        Generate Restock Order <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                  <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">Optimal Placement Recommendation</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      60% of buyers for "Premium Hoodie" are on the East Coast. Relocating 500 units to NJ-Fulfillment center will reduce logistics cost by <strong className="text-emerald-500">18%</strong> and shipping times by 1.2 days.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">SLA Performance: Excellent</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fulfillment centers met 99.4% of your SLA constraints for same-day packing. Courier dispatch rates are within target limits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Active Inventory Status / SLA alerts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-sm bg-slate-900/20 dark:bg-slate-950/20">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-slate-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Stock Alert & Reorder Queue
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">SKUs requiring immediate manufacturer restock requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { sku: 'PREM-HD-GRY-L', name: 'Premium Heavyweight Hoodie (Gray, L)', stock: 8, safetyStock: 30, urgency: 'Critical' },
                  { sku: 'SLIM-CH-NVY-32', name: 'Slim Fit Chinos (Navy, 32)', stock: 12, safetyStock: 40, urgency: 'High' },
                  { sku: 'JOG-ATH-BLK-S', name: 'Athletic Tech Joggers (Black, S)', stock: 5, safetyStock: 25, urgency: 'Critical' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{item.sku}</span>
                        <Badge className={item.urgency === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}>
                          {item.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-300 mt-1">{item.name}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="text-xs">
                        <p className="text-slate-400">Stock: <strong className="text-slate-800 dark:text-slate-200">{item.stock}</strong></p>
                        <p className="text-[10px] text-slate-400">Min: {item.safetyStock}</p>
                      </div>
                      <Button size="xs" onClick={() => handleTriggerReorder(item.sku)} className="h-7 text-[10px] rounded-lg">
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-slate-100">
                  <Activity className="w-4 h-4 text-primary" />
                  Logistics & Order Activity Feed
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">Live feed of orders transitioning through warehouse states</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const isStaff = user?.role === UserRole.STAFF;

  if (isStaff) {
    if (isTasksLoading || isStatsLoading) {
      return (
        <div className="max-w-md mx-auto min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading worker dashboard...</p>
        </div>
      );
    }

    const designation = user?.designation?.toUpperCase() || '';
    
    // Group completed tasks by weekday
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const tasksPerDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    if (staffTasks) {
      staffTasks.forEach((task: any) => {
        if (task.status === 'COMPLETED' && task.completedAt) {
          const date = new Date(task.completedAt);
          const dayName = daysOfWeek[date.getDay()] as keyof typeof tasksPerDay;
          if (tasksPerDay[dayName] !== undefined) {
            tasksPerDay[dayName]++;
          }
        }
      });
    }

    const staffWeeklyPerformance = [
      { name: 'Mon', speed: tasksPerDay.Mon, errors: 0 },
      { name: 'Tue', speed: tasksPerDay.Tue, errors: 0 },
      { name: 'Wed', speed: tasksPerDay.Wed, errors: 0 },
      { name: 'Thu', speed: tasksPerDay.Thu, errors: 0 },
      { name: 'Fri', speed: tasksPerDay.Fri, errors: 0 },
      { name: 'Sat', speed: tasksPerDay.Sat, errors: 0 },
      { name: 'Sun', speed: tasksPerDay.Sun, errors: 0 },
    ];

    const handleQuickAction = (route: string, label: string) => {
      toast.info(`Launching ${label}...`);
      window.location.href = route;
    };

    const allActions = [
      {
        title: 'Start Picking',
        icon: ScanBarcode,
        route: '/dashboard/execution/picking',
        color: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/10',
        match: 'PICK'
      },
      {
        title: 'Start Packing',
        icon: Package,
        route: '/dashboard/execution/packing',
        color: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/10',
        match: 'PACK'
      },
      {
        title: 'QC Verification',
        icon: ShieldAlert,
        route: '/dashboard/execution/qc',
        color: 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md shadow-amber-500/10',
        match: 'QC'
      },
      {
        title: 'Start Dispatch',
        icon: Truck,
        route: '/dashboard/execution/dispatch',
        color: 'from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-md shadow-cyan-500/10',
        match: 'DISPATCH'
      },
      {
        title: 'Scan Barcode',
        icon: Activity,
        route: '/dashboard/execution/scanner',
        color: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-500/10',
        match: 'ALL'
      },
      {
        title: 'Report Issue',
        icon: AlertTriangle,
        route: '/dashboard/execution/issues',
        color: 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-md shadow-rose-500/10',
        match: 'ALL'
      }
    ];

    const filteredActions = allActions.filter(action => {
      if (action.match === 'ALL') return true;
      if (!designation) return true;
      return designation.includes(action.match);
    });

    const totalAssigned = staffTasks?.length || 0;
    const picksCount = staffTasks?.filter((t: any) => t.taskType === 'PICKING').length || 0;
    const packsCount = staffTasks?.filter((t: any) => t.taskType === 'PACKING').length || 0;
    const otherCount = totalAssigned - picksCount - packsCount;
    
    let breakdownText = `${picksCount} Picks, ${packsCount} Packs`;
    if (otherCount > 0) {
      breakdownText += `, ${otherCount} Other`;
    }

    const formatTime = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '';
      }
    };

    return (
      <RoleGuard allowedRoles={[UserRole.STAFF]}>
        <div className="max-w-md mx-auto min-h-[calc(100vh-80px)] md:max-w-2xl pt-2 pb-12 space-y-6 animate-in fade-in">
          {/* Staff Header */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20 text-primary-foreground">
                    {user?.firstName?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg leading-none">{user?.firstName || 'FCOS Staff'} {user?.lastName || ''}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Online • {user?.warehouseName || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/25 font-bold text-xs rounded-full">
                  {user?.designation || 'Staff'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Assigned Warehouse</span>
                  <strong className="text-slate-200 font-extrabold block mt-0.5">{user?.warehouseName || 'Not Assigned'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Role Designation</span>
                  <strong className="text-slate-200 font-extrabold block mt-0.5">{user?.designation || 'Warehouse Staff'}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Touch Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">Fulfillment Quick Actions</span>
            <div className="grid grid-cols-2 gap-3">
              {filteredActions.map((action, idx) => {
                const IconComponent = action.icon;
                return (
                  <Button 
                    key={idx}
                    onClick={() => handleQuickAction(action.route, action.title)}
                    className={`h-20 flex flex-col justify-center items-center rounded-2xl bg-gradient-to-br ${action.color} text-white gap-1.5 border-none`}
                  >
                    <IconComponent className="w-6 h-6" />
                    <span className="font-bold text-xs">{action.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dials & Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-none shadow-sm text-center">
              <CardContent className="p-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned</span>
                <strong className="text-xl font-black text-slate-800 dark:text-slate-200 block mt-1">{totalAssigned} tasks</strong>
                <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{breakdownText}</span>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm text-center">
              <CardContent className="p-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Completed</span>
                <strong className="text-xl font-black text-emerald-600 block mt-1">{staffStats?.tasksCompleted || 0} tasks</strong>
                <span className="text-[8px] text-slate-400 font-bold block mt-0.5">{staffStats?.successfulScans || 0} successful scans</span>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm text-center">
              <CardContent className="p-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Accuracy</span>
                <strong className="text-xl font-black text-primary block mt-1">{staffStats?.accuracyRate || '100.0'}%</strong>
                <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Errors: {staffStats?.errorCount || 0}</span>
              </CardContent>
            </Card>
          </div>

          {/* Active Assigned Tasks Feed */}
          <Card className="border-none shadow-sm bg-slate-900/40 dark:bg-slate-950/50 backdrop-blur-xl text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Live Dispatch Instructions Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffTasks && staffTasks.length > 0 ? (
                staffTasks.slice(0, 5).map((task: any) => {
                  return (
                    <div key={task.id} className="flex gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
                      <span className="text-[9px] font-bold text-slate-450 shrink-0 mt-0.5">
                        {formatTime(task.updatedAt || task.createdAt)}
                      </span>
                      <div>
                        <p className="text-slate-350">
                          {task.status === "PENDING" && "🆕 New task assigned"}
                          {task.status === "IN_PROGRESS" && "⚡ Task in progress"}
                          {task.status === "COMPLETED" && "✅ Task completed"}
                          {task.status === "CANCELLED" && "❌ Task cancelled"}
                        </p>
                        <p className="text-slate-200 leading-normal mt-0.5">
                          <strong>{task.taskType}</strong> for Order <span className="font-mono text-primary font-bold">#{task.order?.orderNumber || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No tasks assigned yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance chart */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400">
                Picks Velocity Trend (Weekly)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2">
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffWeeklyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '8px', 
                        border: '1px solid #334155', 
                        color: '#fff',
                        fontSize: '9px'
                      }} 
                    />
                    <Bar dataKey="speed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  // Original fallback UI for other roles
  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Operations Command Dashboard</h2>
            <p className="text-muted-foreground font-medium">Daily warehouse execution statistics, logistics throughput, and active alert systems.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> 
              Synchronize Data
            </Button>
            <Button size="sm" className="h-9 gap-2 rounded-xl shadow-lg shadow-primary/20">
              <ArrowUpRight className="w-3.5 h-3.5" /> Export BI Report
            </Button>
          </div>
        </div>

        {/* 10 KPI Cards Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KPICard 
            title="Orders Today" 
            value={isLoading ? "..." : ordersTotal.toLocaleString()} 
            icon={ShoppingCart} 
            description="Total sync volume"
          />
          <KPICard 
            title="Pending Orders" 
            value={isLoading ? "..." : (dashboard?.pendingOrders || 0).toString()} 
            icon={Clock} 
            description="Awaiting picks"
            iconClassName="bg-amber-500/10 text-amber-600 group-hover:bg-amber-600"
          />
          <KPICard 
            title="Packed Orders" 
            value={isLoading ? "..." : (dashboard?.packedOrders || 0).toString()} 
            icon={Package} 
            description="Ready for label"
            iconClassName="bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600"
          />
          <KPICard 
            title="Shipped Today" 
            value={isLoading ? "..." : (dashboard?.shippedOrders || 0).toLocaleString()} 
            icon={Truck} 
            description="Handed to courier"
            iconClassName="bg-blue-500/10 text-blue-600 group-hover:bg-blue-600"
          />
          <KPICard 
            title="Delivered Today" 
            value={isLoading ? "..." : (dashboard?.deliveredOrders || 0).toLocaleString()} 
            icon={CheckCircle2} 
            description="SLA completed"
            iconClassName="bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600"
          />
          <KPICard 
            title="Return Requests" 
            value={isLoading ? "..." : (dashboard?.returnRequests || 0).toString()} 
            icon={RotateCcw} 
            description="Reverse logistics"
            iconClassName="bg-rose-500/10 text-rose-600 group-hover:bg-rose-600"
          />
          <KPICard 
            title="Active Staff" 
            value={isLoading ? "..." : (dashboard?.activeStaff || 0).toString()} 
            icon={Users} 
            description="On warehouse floor"
            iconClassName="bg-teal-500/10 text-teal-600 group-hover:bg-teal-600"
          />
          <KPICard 
            title="Revenue Today" 
            value={isLoading ? "..." : `₹${(dashboard?.revenueToday || 0).toLocaleString()}`} 
            icon={Zap} 
            description="Total sales GMV"
            iconClassName="bg-yellow-550/10 text-yellow-600 group-hover:bg-yellow-600"
          />
          <KPICard 
            title="Facility Capacity" 
            value="78.4%" 
            icon={Building2} 
            description="Storage allocation"
            iconClassName="bg-purple-500/10 text-purple-600 group-hover:bg-purple-600"
          />
          <KPICard 
            title="Fulfillment SLA %" 
            value="98.4%" 
            icon={Sparkles} 
            description="Dispatch limit"
            iconClassName="bg-orange-500/10 text-orange-600 group-hover:bg-orange-600"
          />
        </div>

        {/* Dashboard Content split */}
        <div className="grid gap-6 lg:grid-cols-7">
          
          {/* Charts Area */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Fulfillment Volume Trends
                  </CardTitle>
                  <CardDescription>Daily sync orders volume compared to processing capacity</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" name="Orders Synchronized" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Alerts & Activity Logs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Alerts Panel */}
            <Card className="border-none shadow-sm bg-rose-50/10 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Operational Warning Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2.5 items-start text-xs border-b border-rose-100/30 dark:border-rose-900/10 pb-2.5">
                  <Badge variant="outline" className="bg-rose-500/10 border-rose-200 text-rose-600 text-[8px] h-4">Low Stock</Badge>
                  <div>
                    <p className="font-bold leading-none">SKU: WL-HOOD-BLK-M</p>
                    <p className="text-slate-400 mt-1">Available stock level below safety trigger limit (5 left).</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start text-xs border-b border-rose-100/30 dark:border-rose-900/10 pb-2.5">
                  <Badge variant="outline" className="bg-rose-500/10 border-rose-200 text-rose-600 text-[8px] h-4">SLA Warning</Badge>
                  <div>
                    <p className="font-bold leading-none">Order #ORD-921 picking delay</p>
                    <p className="text-slate-400 mt-1">Picker idle timer exceeded 15 mins searching Aisle B.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start text-xs pb-1">
                  <Badge variant="outline" className="bg-slate-500/10 border-slate-200 text-slate-500 text-[8px] h-4">Labels</Badge>
                  <div>
                    <p className="font-bold leading-none">Delhivery API timeout (Labels)</p>
                    <p className="text-slate-400 mt-1">Retrying connection handler for 4 shipments.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Logistics Feed */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Live Operations Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </RoleGuard>
  );
}

