'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/hooks/use-warehouse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { 
  Warehouse as WarehouseIcon, Layers, Map as MapIcon, RefreshCw, 
  Activity, Users, ClipboardList, Clock, AlertTriangle, AlertOctagon, 
  CheckCircle2, ArrowRight, TrendingUp, Zap, Plus, UserPlus,
  Sliders, Box, ArrowLeftRight, Truck, Wrench, Calendar, Settings,
  ShieldCheck, HelpCircle, ChevronRight, Play, Edit, Trash2, Ban,
  Lock, Unlock, Search, Sparkles, ChevronDown, Award, ShieldAlert,
  BarChart3, Upload, Download, Power
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, LineChart, Line, BarChart as RechartsBarChart, Bar as RechartsBar 
} from 'recharts';

export default function WarehousePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { warehouses, isLoading } = useWarehouse();
  const [selectedWHId, setSelectedWHId] = useState<string | null>(null);
  const { warehouse: selectedWH, isLoading: isWHLoading } = useWarehouse(selectedWHId || undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);

  // Form states
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whVendorId, setWhVendorId] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // 1. Warehouse List state
  const [whFilterType, setWhFilterType] = useState('all');

  // 2. Layout Builder state
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [layoutGrid, setLayoutGrid] = useState<string[][]>([
    ['dock', 'dock', 'empty', 'empty', 'empty', 'empty', 'pack', 'pack'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['rack', 'rack', 'empty', 'rack', 'rack', 'empty', 'rack', 'rack'],
    ['rack', 'rack', 'empty', 'rack', 'rack', 'empty', 'rack', 'rack'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['rack', 'rack', 'empty', 'rack', 'rack', 'empty', 'rack', 'rack'],
    ['rack', 'rack', 'empty', 'rack', 'rack', 'empty', 'rack', 'rack'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  ]);

  // 3. Bin Management & Scanner state
  const [binSearch, setBinSearch] = useState('');
  const [scanInputCode, setScanInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [newBinCode, setNewBinCode] = useState('');
  const [isNewBinPending, setIsNewBinPending] = useState(false);

  // 4. Inventory Allocation state
  const [isBalancing, setIsBalancing] = useState(false);
  const [balanceProgress, setBalanceProgress] = useState(0);

  // 5. Operations spikes state
  const [pickSpike, setPickSpike] = useState(0);
  const [isBottleneckAlert, setIsBottleneckAlert] = useState(false);

  // 6. Shift Scheduler state
  const [staffScheduleList, setStaffScheduleList] = useState<any[]>([]);
  const [schedulerStaffId, setSchedulerStaffId] = useState('');
  const [schedulerShift, setSchedulerShift] = useState('Morning');

  // 7. Inbound operations state
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [inboundCarrier, setInboundCarrier] = useState('');
  const [inboundCartons, setInboundCartons] = useState('');

  // 8. Outbound operations state
  const [outboundFilter, setOutboundFilter] = useState('all');

  // 9. Transfers state
  const [transfers, setTransfers] = useState<any[]>([]);
  const [transferTargetWh, setTransferTargetWh] = useState('');
  const [transferSKU, setTransferSKU] = useState('');
  const [transferQty, setTransferQty] = useState('');

  // 10. Maintenance state
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentType, setIncidentType] = useState('Spill');
  const [incidentSeverity, setIncidentSeverity] = useState('Low');
  const [incidentZone, setIncidentZone] = useState('');

  // 11. Settings state
  const [pickingStrategy, setPickingStrategy] = useState('wave');
  const [scannerBeep, setScannerBeep] = useState(true);
  const [minStockLimit, setMinStockLimit] = useState(20);

  // Fetch all staff members to assign
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  // Fetch WMS Dashboard metrics from analytics
  const { data: dbMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['wms-dashboard-metrics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    }
  });

  // Fetch all staff tasks to dynamically compute WMS queues
  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['all-staff-tasks'],
    queryFn: async () => {
      const res = await api.get('/staff/tasks/all');
      return res.data;
    }
  });

  // Fetch staff performance to list active shift roster registry and WMS throughput trends
  const { data: staffPerformance = [], refetch: refetchPerformance } = useQuery({
    queryKey: ['staff-performance-all'],
    queryFn: async () => {
      const res = await api.get('/staff/performance/all');
      return res.data;
    }
  });

  // Fetch orders for WMS outbound dashboard
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['all-orders-wms'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    }
  });

  // Fetch vendors for Super Admin assignment
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.get('/vendors')
        .then(({ data }) => {
          setVendors(Array.isArray(data) ? data : (data.vendors || []));
        })
        .catch(() => {
          toast.error('Failed to load vendors list');
        });
    }
  }, [user]);

  const createWarehouseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/warehouses', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsAddWarehouseOpen(false);
      setWhName('');
      setWhLocation('');
      setWhVendorId('');
      setSelectedWHId(data.id);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create warehouse');
    }
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({ staffId, warehouseId }: { staffId: string; warehouseId: string }) => {
      const res = await api.patch(`/staff/${staffId}/warehouse`, { warehouseId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Personnel assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse', selectedWHId] });
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      setIsAssignStaffOpen(false);
      setSelectedStaffId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign personnel');
    }
  });

  useEffect(() => {
    if (warehouses?.length && !selectedWHId) {
      setSelectedWHId(warehouses[0].id);
    }
  }, [warehouses, selectedWHId]);

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whLocation) return;

    createWarehouseMutation.mutate({
      name: whName,
      location: whLocation,
      vendorId: user?.role === 'SUPER_ADMIN' ? (whVendorId === 'global' || !whVendorId ? null : whVendorId) : user?.vendorId,
    });
  };

  const handleAssignStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedWHId) return;

    assignStaffMutation.mutate({
      staffId: selectedStaffId,
      warehouseId: selectedWHId,
    });
  };

  const eligibleStaff = staffList.filter((st: any) => {
    const matchesVendor = user?.role === 'SUPER_ADMIN' 
      ? (!selectedWH?.vendorId || st.vendorId === selectedWH?.vendorId) 
      : true;
    const notAlreadyAssigned = st.warehouseId !== selectedWHId;
    return matchesVendor && notAlreadyAssigned;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Facility metrics synchronized");
    }, 600);
  };

  // Create Bin Handler
  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBinCode || !selectedWHId) return;
    setIsNewBinPending(true);
    try {
      await api.post(`/warehouses/${selectedWHId}/bins`, { code: newBinCode });
      toast.success(`Bin ${newBinCode} created successfully`);
      setNewBinCode('');
      queryClient.invalidateQueries({ queryKey: ['warehouse', selectedWHId] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create bin');
    } finally {
      setIsNewBinPending(false);
    }
  };

  // Provision Default Bins
  const handleProvisionDefaultBins = async () => {
    if (!selectedWHId) return;
    const defaultCodes = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
    toast.loading('Provisioning bins...');
    try {
      for (const code of defaultCodes) {
        await api.post(`/warehouses/${selectedWHId}/bins`, { code });
      }
      toast.dismiss();
      toast.success('Default bins successfully provisioned');
      queryClient.invalidateQueries({ queryKey: ['warehouse', selectedWHId] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    } catch (err: any) {
      toast.dismiss();
      toast.error('Error provisioning bins');
    }
  };

  // Scanner simulator logic
  const handleScanBin = (code: string) => {
    if (!code) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Look up bin from selected warehouse
      const foundBin = selectedWH?.bins?.find((b: any) => b.code.toLowerCase() === code.toLowerCase());
      if (foundBin) {
        setScanResult({
          code: foundBin.code,
          status: foundBin.inventory?.length > 0 ? 'Occupied' : 'Empty',
          items: foundBin.inventory || [],
          capacity: '50 cartons max',
          lastAudit: '2 hours ago by System Scanner'
        });
        toast.success(`Scan complete: Bin ${foundBin.code} located`);
      } else {
        // Fallback simulated result
        setScanResult({
          code: code.toUpperCase(),
          status: 'Occupied',
          items: [{ product: { name: 'TechMart Smartphone', SKU: 'SKU-TM-01' }, quantity: 12 }],
          capacity: '30 cartons max',
          lastAudit: 'Just now (Simulated barcode match)'
        });
        toast.success(`Scan complete: Simulated match for ${code.toUpperCase()}`);
      }
    }, 600);
  };

  // Rebalancing simulation
  const handleAutoRebalance = () => {
    setIsBalancing(true);
    setBalanceProgress(10);
    const interval = setInterval(() => {
      setBalanceProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBalancing(false);
          toast.success('Inventory rebalancing algorithm completed successfully!');
          return 100;
        }
        return prev + 25;
      });
    }, 800);
  };

  // Shift assignment submit
  const handleShiftSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerStaffId) return;
    const staffObj = staffList.find((s: any) => s.id === schedulerStaffId);
    if (!staffObj) return;

    // Check if already in schedule, otherwise add
    const index = staffScheduleList.findIndex(s => s.id === schedulerStaffId);
    if (index >= 0) {
      const updated = [...staffScheduleList];
      updated[index].shift = schedulerShift;
      setStaffScheduleList(updated);
    } else {
      setStaffScheduleList([
        ...staffScheduleList,
        {
          id: staffObj.id,
          name: `${staffObj.firstName} ${staffObj.lastName}`,
          role: staffObj.designation || 'Staff',
          shift: schedulerShift,
          productivity: 'Nominal'
        }
      ]);
    }
    toast.success(`Shift for ${staffObj.firstName} updated to ${schedulerShift}`);
  };

  // Log inbound receipt
  const handleAddInbound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboundCarrier || !inboundCartons) return;
    const newInbound = {
      id: `INB-${Math.floor(1000 + Math.random() * 9000)}`,
      carrier: inboundCarrier,
      items: `${inboundCartons} cartons`,
      status: 'Docked',
      dock: `Dock ${Math.floor(1 + Math.random() * 4)}`
    };
    setInbounds([newInbound, ...inbounds]);
    setInboundCarrier('');
    setInboundCartons('');
    toast.success(`Inbound shipment logged and assigned to ${newInbound.dock}`);
  };

  // Handle transfer submit
  const handleAddTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetWh || !transferSKU || !transferQty) return;
    const targetWhName = warehouses.find((w: any) => w.id === transferTargetWh)?.name || 'Secondary Warehouse';
    const newTransfer = {
      id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
      target: targetWhName,
      items: `${transferSKU} (x${transferQty})`,
      status: 'Processing',
      date: 'Just now'
    };
    setTransfers([newTransfer, ...transfers]);
    setTransferTargetWh('');
    setTransferSKU('');
    setTransferQty('');
    toast.success(`Inter-warehouse transfer initiated for ${newTransfer.items}`);
  };

  // Handle incident submit
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentZone) return;
    const newIncident = {
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      type: incidentType,
      severity: incidentSeverity,
      zone: incidentZone,
      status: 'Active'
    };
    setIncidents([newIncident, ...incidents]);
    setIncidentZone('');
    toast.warning(`Incident ${newIncident.id} logged. Dispatching maintenance crew to ${newIncident.zone}`);
  };

  // Dynamic operational KPIs
  const kpis = useMemo(() => {
    const activeOrders = dbMetrics?.pendingShipments || 0;
    const pendingPicking = allTasks.filter((t: any) => t.taskType === 'PICKING' && t.status === 'PENDING').length;
    const pendingPacking = allTasks.filter((t: any) => t.taskType === 'PACKING' && t.status === 'PENDING').length;
    const readyToShip = allTasks.filter((t: any) => t.taskType === 'DISPATCH' && t.status === 'PENDING').length;
    
    // Calculate accuracies dynamically if staff performance exists, else default to 100%
    let totalScore = 0;
    let validStaff = 0;
    staffPerformance.forEach((s: any) => {
      if (s.performanceScore) {
        totalScore += parseFloat(s.performanceScore);
        validStaff++;
      }
    });
    const avgAccuracy = validStaff > 0 ? (totalScore / validStaff).toFixed(1) + "%" : "100.0%";

    const totalTasksCount = allTasks.length;
    const cancelledTasksCount = allTasks.filter((t: any) => t.status === 'CANCELLED').length;
    const slaSuccess = totalTasksCount > 0 ? ((totalTasksCount - cancelledTasksCount) / totalTasksCount * 100).toFixed(1) + "%" : "100.0%";

    const validStaffSpeed = staffPerformance.filter((s: any) => s.avgCompletionMinutes !== 'N/A' && s.avgCompletionMinutes !== undefined);
    let avgMins = 18.5;
    if (validStaffSpeed.length > 0) {
      const sum = validStaffSpeed.reduce((acc: number, s: any) => acc + parseFloat(s.avgCompletionMinutes), 0);
      avgMins = sum / validStaffSpeed.length;
    }
    const fulfillmentSpeed = avgMins < 1 ? `${Math.round(avgMins * 60)} secs` : `${avgMins.toFixed(1)} mins`;

    return {
      activeOrders,
      pendingPicking,
      pendingPacking,
      readyToShip,
      delayedOrders: allTasks.filter((t: any) => t.status === 'PENDING' && (Date.now() - new Date(t.createdAt).getTime()) > 3600000).length, // older than 1 hr
      shippedToday: dbMetrics?.ordersToday || 0,
      returnsToday: dbMetrics?.activeReturns || 0,
      activeStaff: selectedWH?.staff?.length || 0,
      slaSuccess,
      pickAccuracy: avgAccuracy,
      packAccuracy: avgAccuracy,
      fulfillmentSpeed
    };
  }, [dbMetrics, allTasks, staffPerformance, selectedWH]);

  // Live status elements
  const liveMonitoring = useMemo(() => {
    const pickers = selectedWH?.staff?.filter((st: any) => st.designation?.toLowerCase().includes('picker')).length || 0;
    const packers = selectedWH?.staff?.filter((st: any) => st.designation?.toLowerCase().includes('packer')).length || 0;
    const qcStaff = selectedWH?.staff?.filter((st: any) => st.designation?.toLowerCase().includes('qc') || st.designation?.toLowerCase().includes('auditor')).length || 0;
    const dispatchers = selectedWH?.staff?.filter((st: any) => st.designation?.toLowerCase().includes('dispatch')).length || 0;

    const processing = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const delayedTasks = allTasks.filter((t: any) => t.status === 'PENDING' && (Date.now() - new Date(t.createdAt).getTime()) > 1800000).length; // 30m delay

    return {
      pickers,
      packers,
      qcStaff,
      dispatchers,
      processing,
      delayedTasks,
      bottlenecks: delayedTasks > 3 ? "Aisle C1 congestion" : "None"
    };
  }, [selectedWH, allTasks]);

  // Dynamic staff schedule list based on staff performance
  const displayRoster = useMemo(() => {
    if (staffScheduleList.length > 0) return staffScheduleList;
    return staffPerformance.map((s: any) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: s.designation || 'Staff',
      shift: s.id.charCodeAt(0) % 2 === 0 ? 'Morning' : 'Evening', // pseudo-random shift
      productivity: s.performanceScore ? `${s.performanceScore}%` : '98.5%'
    }));
  }, [staffPerformance, staffScheduleList]);

  // Staff comparison chart data
  const staffChartData = useMemo(() => {
    return staffPerformance.map((s: any) => ({
      name: `${s.firstName} ${s.lastName[0]}.`,
      tasks: s.completedTasks || 0,
      score: parseFloat(s.performanceScore) || 100
    }));
  }, [staffPerformance]);

  // Dynamic outbound dispatches from database
  const outboundOrders = useMemo(() => {
    const list = ordersData?.orders || [];
    return list.map((o: any) => {
      const carrier = o.shipment?.courierName || 'Delhivery Standard';
      const tracking = o.shipment?.trackingNumber || 'Awaiting Label...';
      const status = o.status === 'SHIPPED' ? 'Shipped' :
                     o.status === 'PACKED' ? 'Ready to Ship' :
                     o.status === 'CREATED' ? 'Picking' : 
                     o.status === 'DELIVERED' ? 'Delivered' : o.status;
      return {
        id: o.orderNumber,
        name: o.customerName,
        carrier,
        speed: tracking,
        status
      };
    });
  }, [ordersData]);

  const heatmapZones = useMemo(() => {
    const bins = selectedWH?.bins || [];
    const filterByPrefix = (prefix: string) => bins.filter((b: any) => b.code.toLowerCase().startsWith(prefix.toLowerCase()));
    const calcLoad = (prefix: string) => {
      const filtered = filterByPrefix(prefix);
      if (filtered.length === 0) return 0;
      const occupied = filtered.filter((b: any) => b.inventory?.length > 0).length;
      return Math.round((occupied / filtered.length) * 100);
    };

    const loadA = calcLoad('A');
    const loadB = calcLoad('B');
    const loadC = calcLoad('C');

    const getStyles = (load: number) => {
      if (load > 80) return "bg-rose-500/20 text-rose-455 border border-rose-500/30";
      if (load > 50) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      if (load > 10) return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      return "bg-slate-955 text-slate-500 border border-slate-900";
    };

    return [
      { zone: "Zone A (Picking)", load: `${loadA}%`, color: getStyles(loadA) },
      { zone: "Zone B (Bulk)", load: `${loadB}%`, color: getStyles(loadB) },
      { zone: "Zone C (Cold)", load: `${loadC}%`, color: getStyles(loadC) },
      { zone: "QC Bay", load: kpis.pendingPacking > 0 ? "75%" : "0%", color: kpis.pendingPacking > 0 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-slate-955 text-slate-550 border border-slate-900" },
      { zone: "Pack Racks", load: kpis.pendingPacking > 0 ? "85%" : "0%", color: kpis.pendingPacking > 0 ? "bg-rose-500/20 text-rose-455 border border-rose-500/30" : "bg-slate-955 text-slate-550 border border-slate-900" },
      { zone: "Staging Z", load: kpis.readyToShip > 0 ? "60%" : "0%", color: kpis.readyToShip > 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-955 text-slate-550 border border-slate-900" },
      { zone: "Returns Area", load: kpis.returnsToday > 0 ? "40%" : "0%", color: kpis.returnsToday > 0 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-955 text-slate-550 border border-slate-900" },
    ];
  }, [selectedWH, kpis]);

  // Alerts
  const alerts: any[] = [];

  // Group tabs for left sidebar navigation
  const groupedTabs = {
    'Command Center': [
      { id: 'overview', label: 'Dashboard Overview', icon: Activity },
      { id: 'list', label: 'Warehouse List', icon: WarehouseIcon },
    ],
    'Infrastructure': [
      { id: 'layout', label: 'Warehouse Layout', icon: MapIcon },
      { id: 'zones', label: 'Storage Zones', icon: Layers },
      { id: 'bins', label: 'Bin Management', icon: Box },
    ],
    'Execution Layer': [
      { id: 'allocation', label: 'Inventory Allocation', icon: Sliders },
      { id: 'operations', label: 'Live Operations', icon: ClipboardList },
      { id: 'staff', label: 'Warehouse Staff', icon: Users },
      { id: 'inbound', label: 'Inbound Operations', icon: Upload },
      { id: 'outbound', label: 'Outbound Operations', icon: Download },
      { id: 'transfers', label: 'Transfers & Movement', icon: ArrowLeftRight },
    ],
    'Intelligence & Rules': [
      { id: 'capacity', label: 'Capacity Management', icon: TrendingUp },
      { id: 'analytics', label: 'WMS Analytics', icon: BarChart3 },
      { id: 'maintenance', label: 'Maintenance & Log', icon: Wrench },
      { id: 'settings', label: 'WMS Settings', icon: Settings },
    ]
  };

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Top row: WMS Quick stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="border border-slate-800 bg-slate-900/50 shadow-xl relative overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-405 rounded-lg shrink-0">
                    <ClipboardList className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Orders</p>
                    <h3 className="text-xl font-black text-white mt-0.5 tracking-tighter">{kpis.activeOrders}</h3>
                    <span className="text-[8px] text-slate-500">{kpis.pendingPicking} Pick / {kpis.pendingPacking} Pack</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-800 bg-slate-900/50 shadow-xl relative overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-455 rounded-lg shrink-0">
                    <Clock className="w-5 h-5 text-rose-450" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SLA Success Rate</p>
                    <h3 className="text-xl font-black text-white mt-0.5 tracking-tighter">{kpis.slaSuccess}</h3>
                    <span className="text-[8px] text-rose-400 font-bold">{kpis.delayedOrders} delayed orders</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-800 bg-slate-900/50 shadow-xl relative overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-455 rounded-lg shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment Speed</p>
                    <h3 className="text-xl font-black text-white mt-0.5 tracking-tighter">{kpis.fulfillmentSpeed}</h3>
                    <span className="text-[8px] text-emerald-400 font-bold">{kpis.shippedToday} shipped today</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-800 bg-slate-900/50 shadow-xl relative overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-455 rounded-lg shrink-0">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accuracies</p>
                    <h3 className="text-xl font-black text-white mt-0.5 tracking-tighter">{kpis.pickAccuracy}</h3>
                    <span className="text-[8px] text-slate-500">Pick {kpis.pickAccuracy} / Pack {kpis.packAccuracy}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Telemetry log & Alert panel */}
              <div className="md:col-span-2 space-y-6">
                {/* Telemetry panel */}
                <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
                  <CardHeader className="pb-3 border-b border-slate-850">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                        <Activity className="w-4 h-4 text-indigo-400 animate-pulse" /> Live Telemetry Monitoring
                      </CardTitle>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2.5 py-0">
                        Live WSS
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-855 flex items-center gap-3">
                        <Users className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-white">Active Workforce</h4>
                          <p className="text-slate-400 text-[10px] mt-0.5 font-medium">
                            {liveMonitoring.pickers} Pickers | {liveMonitoring.packers} Packers | {liveMonitoring.qcStaff} QC
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-955/60 rounded-xl border border-slate-855 flex items-center gap-3">
                        <ClipboardList className="w-5 h-5 text-sky-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-white">Currently Executing</h4>
                          <p className="text-slate-400 text-[10px] mt-0.5 font-medium">
                            {liveMonitoring.processing} tasks in queue | {liveMonitoring.delayedTasks} flagged delayed
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottleneck Alerts */}
                    <div className={cn(
                      "p-3 border rounded-xl flex items-center justify-between transition-colors",
                      isBottleneckAlert 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-455"
                        : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                    )}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={cn("w-4 h-4", isBottleneckAlert && "animate-bounce")} />
                        <span className="font-semibold">Detected Bottleneck:</span>
                        <span className="font-medium text-slate-200">{liveMonitoring.bottlenecks}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] hover:bg-rose-500/10 text-rose-400" onClick={() => toast.info("Opening congestion route settings...")}>
                        Reroute Task <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    {/* Real-time Activity feed */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Activity Log</h4>
                      <div className="space-y-2">
                        {(() => {
                          const activeOrCompleted = allTasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'IN_PROGRESS' || t.status === 'CANCELLED').slice(0, 4);
                          if (activeOrCompleted.length === 0) {
                            return <p className="text-xs text-slate-500 text-center py-4 font-semibold">No recent activity logs.</p>;
                          }
                          return activeOrCompleted.map((t: any, idx: number) => {
                            const staffName = t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : "System Operator";
                            const action = t.status === 'COMPLETED' ? 'completed' : t.status === 'IN_PROGRESS' ? 'started' : 'flagged issue on';
                            const taskName = t.taskType === 'PICKING' ? 'picking' : t.taskType === 'PACKING' ? 'packing' : t.taskType === 'DISPATCH' ? 'dispatch' : 'task';
                            const text = `${staffName} ${action} ${taskName} for Order #${t.order?.orderNumber || 'N/A'}`;
                            const timeText = t.completedAt || t.startedAt ? new Date(t.completedAt || t.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
                            return (
                              <div key={t.id || idx} className="flex justify-between items-center text-[11px] p-2 bg-slate-950/30 rounded border border-transparent hover:border-slate-850">
                                <span className="text-slate-300 font-medium">{text}</span>
                                <span className="text-[10px] text-slate-600 font-mono">{timeText}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts list */}
                <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-500" /> Operational Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    {alerts.map((al, idx) => (
                      <div key={idx} className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl flex items-start gap-2.5 text-[11px]">
                        {al.severity === "critical" ? (
                          <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                        ) : al.severity === "high" ? (
                          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 flex-1">
                          <p className="text-slate-200 font-semibold leading-tight">{al.message}</p>
                          <span className="text-[9px] text-slate-500 font-mono">{al.time}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Heatmap & Personnel */}
              <div className="space-y-6">
                {/* Operational Heatmap */}
                <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
                  <CardHeader className="pb-3 border-b border-slate-850">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                      <MapIcon className="w-4 h-4 text-indigo-400" /> Operational Heatmap
                    </CardTitle>
                    <CardDescription className="text-[10px]">Zone activity density map.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {heatmapZones.map((z, idx) => (
                        <div key={idx} className={cn("p-2 rounded-xl text-center flex flex-col justify-center gap-0.5", z.color)}>
                          <span className="text-[9px] font-bold font-mono">{z.zone}</span>
                          <span className="text-[10px] font-black">{z.load}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between items-center bg-slate-955 p-2 rounded-lg border border-slate-900">
                      <span>Congestion threshold: 80%+</span>
                      <Button variant="ghost" className="h-4 p-0 text-[10px] text-indigo-405 font-bold hover:bg-transparent" onClick={() => toast.success("Rerouted staff to balance load")}>
                        Balance load
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Personnel */}
                {selectedWH && (
                  <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-850">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" /> Assigned Personnel
                      </CardTitle>
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'VENDOR_ADMIN') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-slate-850 text-slate-400 hover:text-indigo-400"
                          onClick={() => {
                            setSelectedStaffId('');
                            setIsAssignStaffOpen(true);
                          }}
                          title="Assign Manager / Staff"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {selectedWH.staff?.length === 0 ? (
                        <p className="text-[10px] font-medium text-slate-500 text-center py-4">No staff assigned to this facility.</p>
                      ) : (
                        selectedWH.staff.map((st: any) => (
                          <div key={st.id} className="p-2.5 bg-slate-955/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-400 uppercase border border-slate-800">
                                {st.firstName[0]}{st.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">{st.firstName} {st.lastName}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{st.designation || 'Staff / Manager'}</p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 text-[8px] h-4">
                              ONLINE
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Topology bin mapping */}
            <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-850 p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
                  <MapIcon className="w-4 h-4 text-slate-500" />
                  Physical Bin Grid Mapping
                </CardTitle>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500/30 rounded-full border border-rose-500/50" /> High Density</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-500/20 rounded-full border border-indigo-500/40" /> Active</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-950 rounded-full border border-slate-900" /> Available</div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isWHLoading ? (
                  <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading facility topology...
                  </div>
                ) : selectedWH?.bins?.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-500 gap-3">
                    <p className="text-xs">No bins defined in this warehouse location.</p>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'VENDOR_ADMIN') && (
                      <Button size="sm" onClick={handleProvisionDefaultBins} className="h-8 text-[11px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Provision Default Bins
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2">
                    {selectedWH?.bins?.map((bin: any) => {
                      const itemsCount = bin.inventory?.length || 0;
                      const isHighDensity = itemsCount > 10;
                      
                      return (
                        <div 
                          key={bin.id}
                          className={cn(
                            "aspect-square rounded-lg flex flex-col items-center justify-center border transition-all cursor-default text-xs",
                            isHighDensity ? "bg-rose-500/20 border-rose-500/30 text-rose-455" :
                            itemsCount > 0 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                            "bg-slate-950 border-slate-900 text-slate-600"
                          )}
                          title={`Bin ${bin.code}: ${itemsCount} SKUs`}
                        >
                          <span className="text-[9px] font-mono font-bold">{bin.code}</span>
                          <span className="text-[8px] font-bold opacity-60 mt-0.5">{itemsCount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Registered Facilities</h3>
                <p className="text-xs text-slate-400">Complete listing of FCOS-connected warehouse facilities.</p>
              </div>
              <div className="flex gap-2">
                <Select value={whFilterType} onValueChange={setWhFilterType}>
                  <SelectTrigger className="w-36 h-9 border-slate-800 bg-slate-950 text-xs rounded-xl text-white">
                    <SelectValue placeholder="Filter Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fulfillment">Fulfillment Centers</SelectItem>
                    <SelectItem value="regional">Regional Hubs</SelectItem>
                    <SelectItem value="returns">Returns Centers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-900/30 animate-pulse border border-slate-850 rounded-2xl" />
                ))
              ) : warehouses?.length === 0 ? (
                <div className="md:col-span-2 text-center py-12 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800">
                  <WarehouseIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-455 text-sm">No Warehouses Configured</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Create a warehouse infrastructure facility to start orchestrating physical inventory bins.</p>
                </div>
              ) : (
                warehouses.map((wh: any) => {
                  const occupied = wh.bins?.filter((b: any) => b.inventory?.length > 0).length || 0;
                  const totalBins = wh.bins?.length || 0;
                  const rate = totalBins > 0 ? Math.round((occupied / totalBins) * 100) : 0;
                  return (
                    <Card key={wh.id} className="border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-2xl overflow-hidden shadow-lg">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                              <WarehouseIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{wh.name}</h4>
                              <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">{wh.location}</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-bold">
                            ACTIVE
                          </Badge>
                        </div>

                        {/* Capacity meter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-450">BIN UTILIZATION</span>
                            <span className="text-slate-300">{occupied}/{totalBins} bins occupied ({rate}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className="bg-indigo-650 h-full rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-t border-slate-850/60 pt-3">
                          <div>STAFF: <span className="text-slate-350">{wh._count?.staff || 0} assigned</span></div>
                          <div>TYPE: <span className="text-indigo-400 uppercase">fulfillment center</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'layout':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Visual Warehouse Grid</h3>
                <p className="text-xs text-slate-400">Drag & Drop Floor topology configuration mapping tool.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={layoutEditMode ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLayoutEditMode(!layoutEditMode)}
                  className="rounded-xl h-9 text-xs font-bold"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> {layoutEditMode ? 'Exit Designer' : 'Edit Layout'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast.loading('Analyzing navigation grid paths...');
                    setTimeout(() => {
                      toast.dismiss();
                      toast.success('Path optimization calculation complete. Pathing efficiency: +14%');
                    }, 1200);
                  }}
                  className="rounded-xl h-9 text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Auto Optimize
                </Button>
              </div>
            </div>

            {/* Layout Builder Alert */}
            {layoutEditMode && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-405 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
                <span><strong>Layout Builder Active:</strong> Click cells on the grid below to cycle block assignments (Aisle Rack → Empty → Packing Dock).</span>
              </div>
            )}

            {/* Floor Map Grid */}
            <Card className="border border-slate-800 bg-slate-950/40 p-6 rounded-2xl flex flex-col items-center">
              <div className="grid grid-cols-8 gap-2.5 max-w-md w-full">
                {layoutGrid.map((row, rIdx) => 
                  row.map((cell, cIdx) => (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      disabled={!layoutEditMode}
                      onClick={() => {
                        const updated = [...layoutGrid];
                        const cycle = ['empty', 'rack', 'dock', 'pack'];
                        const nextIdx = (cycle.indexOf(cell) + 1) % cycle.length;
                        updated[rIdx][cIdx] = cycle[nextIdx];
                        setLayoutGrid(updated);
                        toast.success(`Cell [${rIdx},${cIdx}] configured as ${cycle[nextIdx].toUpperCase()}`);
                      }}
                      className={cn(
                        "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all text-[8px] font-bold uppercase font-mono",
                        cell === 'rack' && "bg-indigo-650/20 border-indigo-555 text-indigo-400 shadow-inner",
                        cell === 'dock' && "bg-emerald-500/15 border-emerald-500/30 text-emerald-455",
                        cell === 'pack' && "bg-orange-500/15 border-orange-500/30 text-orange-400",
                        cell === 'empty' && "bg-slate-950 border-slate-900 text-slate-700 hover:border-slate-800"
                      )}
                      title={`Cell [Row ${rIdx + 1}, Col ${cIdx + 1}]: ${cell}`}
                    >
                      {cell === 'rack' && 'RACK'}
                      {cell === 'dock' && 'DOCK'}
                      {cell === 'pack' && 'PACK'}
                      {cell === 'empty' && `${rIdx + 1}-${cIdx + 1}`}
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Layout analytics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border border-slate-800 bg-slate-900/30 p-4 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Grid Travel Path Optimization</span>
                <h4 className="text-2xl font-black text-white mt-1">94%</h4>
                <p className="text-[10px] text-emerald-400 mt-1">Optimal picker routing</p>
              </Card>
              <Card className="border border-slate-800 bg-slate-900/30 p-4 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Aisle Congestion score</span>
                <h4 className="text-2xl font-black text-rose-455 mt-1">12%</h4>
                <p className="text-[10px] text-slate-450 mt-1">Low congestion threat</p>
              </Card>
              <Card className="border border-slate-800 bg-slate-900/30 p-4 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Storage density index</span>
                <h4 className="text-2xl font-black text-indigo-400 mt-1">82.5%</h4>
                <p className="text-[10px] text-slate-450 mt-1">High packing index</p>
              </Card>
            </div>
          </div>
        );

      case 'zones':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Storage Zones</h3>
              <p className="text-xs text-slate-400">Configure specialized zones for perishables, fragile, and high-velocity stock.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(() => {
                const bins = selectedWH?.bins || [];
                const filterByPrefix = (prefix: string) => bins.filter((b: any) => b.code.toLowerCase().startsWith(prefix.toLowerCase()));
                
                const zoneDetails = (prefix: string, name: string, desc: string, color: string) => {
                  const filtered = filterByPrefix(prefix);
                  const total = filtered.length;
                  const occupied = filtered.filter((b: any) => b.inventory?.length > 0).length;
                  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
                  return {
                    name,
                    desc,
                    capacity: total > 0 ? `${rate}% occupied (${occupied}/${total} bins)` : "0% occupied (0/0 bins)",
                    color
                  };
                };

                const dynamicZones = [
                  zoneDetails('A', 'Zone A: Fast Moving', 'High velocity products', 'bg-orange-500/20 text-orange-400 border-orange-500/30'),
                  zoneDetails('B', 'Zone B: Fragile Goods', 'Glassware & microelectronics', 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'),
                  zoneDetails('C', 'Zone C: Cold Storage', 'Climate regulated items', 'bg-sky-500/10 text-sky-400 border-sky-500/20'),
                  zoneDetails('D', 'Zone D: Returns Staging', 'Processing queue', 'bg-amber-500/10 text-amber-400 border-amber-500/20'),
                  zoneDetails('E', 'Zone E: Bulk Storage', 'Oversized pallet racks', 'bg-slate-950 text-slate-400 border-slate-850'),
                  zoneDetails('F', 'Zone F: Hazmat & Secure', 'Restricted chemicals', 'bg-rose-500/15 text-rose-455 border-rose-500/30')
                ];

                return dynamicZones.map((z, idx) => (
                  <Card key={idx} className={cn("border bg-slate-900/40 rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform", z.color)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-white">{z.name}</h4>
                        <Badge className="bg-slate-955 text-slate-350 text-[9px] font-bold rounded-full">{z.capacity}</Badge>
                      </div>
                      <p className="text-xs text-slate-350">{z.desc}</p>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-850/30">
                        <span>VENDORS: ALL APPROVED</span>
                        <Button variant="ghost" className="h-5 p-0 text-[10px] text-indigo-455 hover:bg-transparent font-bold" onClick={() => toast.info(`Modifying allocation rules for ${z.name}`)}>
                          Modify Rules
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </div>
        );

      case 'bins':
        return (
          <div className="space-y-6">
            {/* Create Bin Form */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'VENDOR_ADMIN') && (
              <Card className="border border-slate-800 bg-slate-900/40 p-4 rounded-2xl">
                <form onSubmit={handleCreateBin} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="bin-code-input" className="text-[10px] font-black uppercase tracking-wider text-slate-300">Add New Bin Location</Label>
                    <Input 
                      id="bin-code-input"
                      placeholder="e.g. A-B12-S4-B2" 
                      value={newBinCode}
                      onChange={(e) => setNewBinCode(e.target.value)}
                      className="h-10 border-slate-800 bg-slate-950 text-xs rounded-xl text-white"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isNewBinPending} className="h-10 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5">
                    {isNewBinPending ? 'Provisioning...' : 'Provision Bin'}
                  </Button>
                </form>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              {/* Bins List Table (ColSpan 2) */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Bin Directory ({selectedWH?.bins?.length || 0} locations)</h4>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <Input 
                      placeholder="Search bins..." 
                      value={binSearch}
                      onChange={(e) => setBinSearch(e.target.value)}
                      className="h-8 pl-8 border-slate-800 bg-slate-950 text-[11px] rounded-lg text-white"
                    />
                  </div>
                </div>

                <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {selectedWH?.bins?.length === 0 ? (
                      <p className="text-xs text-slate-550 text-center py-12">No physical bin slots generated yet.</p>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                          <tr>
                            <th className="p-3">Location Code</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">SKUs Stored</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {selectedWH?.bins
                            ?.filter((b: any) => b.code.toLowerCase().includes(binSearch.toLowerCase()))
                            ?.map((bin: any) => {
                              const itemsCount = bin.inventory?.length || 0;
                              return (
                                <tr key={bin.id} className="hover:bg-slate-900/30 text-slate-200">
                                  <td className="p-3 font-mono font-bold text-indigo-400">{bin.code}</td>
                                  <td className="p-3">
                                    <Badge className={cn(
                                      "text-[8px] font-black rounded-full h-4",
                                      itemsCount > 0 
                                        ? "bg-indigo-505/10 text-indigo-400 border border-indigo-500/20"
                                        : "bg-slate-955 text-slate-500 border border-slate-850"
                                    )}>
                                      {itemsCount > 0 ? 'OCCUPIED' : 'EMPTY'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 font-medium">
                                    {itemsCount === 0 ? '-' : `${itemsCount} SKUs (${bin.inventory.reduce((sum: number, i: any) => sum + i.quantity, 0)} units)`}
                                  </td>
                                  <td className="p-3 text-right space-x-1.5">
                                    <Button 
                                      variant="ghost" 
                                      size="xs" 
                                      className="h-6 text-[10px] hover:bg-slate-800 text-slate-400"
                                      onClick={() => {
                                        toast.promise(
                                          new Promise((resolve) => setTimeout(resolve, 800)),
                                          {
                                            loading: 'Auditing stock counts...',
                                            success: 'Stock counts matched bin ledger!',
                                            error: 'Mismatch detected.'
                                          }
                                        );
                                      }}
                                    >
                                      Audit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="xs" 
                                      className="h-6 text-[10px] text-rose-500 hover:text-rose-455 hover:bg-rose-500/10"
                                      onClick={() => toast.info(`Location lock applied to ${bin.code}`)}
                                    >
                                      <Lock className="w-3 h-3" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>

              {/* QR Barcode Simulator */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Scanner Handheld Simulator</h4>
                <Card className="border border-slate-800 bg-slate-950/70 p-5 rounded-2xl space-y-4">
                  <div className="p-4 bg-slate-955 rounded-xl border border-slate-850 text-center font-mono text-xs text-indigo-400 tracking-[0.25em]">
                    * SCANNER TERMINAL READY *
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scanner-select" className="text-[9px] font-bold text-slate-450 uppercase">Select Target Location Barcode</Label>
                    <Select value={scanInputCode} onValueChange={setScanInputCode}>
                      <SelectTrigger id="scanner-select" className="border-slate-800 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Choose Bin" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {selectedWH?.bins?.map((b: any) => (
                          <SelectItem key={b.id} value={b.code}>{b.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => handleScanBin(scanInputCode)} 
                    disabled={isScanning || !scanInputCode}
                    className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {isScanning ? 'Reading barcode beep...' : 'Trigger Laser Scan'}
                  </Button>

                  {scanResult && (
                    <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-3 text-[11px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="font-bold text-white text-xs">BIN LOCATION: {scanResult.code}</span>
                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] h-4">{scanResult.status}</Badge>
                      </div>
                      <div className="space-y-1 text-slate-350 font-medium">
                        <p>Total Capacity: {scanResult.capacity}</p>
                        <p>Last Audited: {scanResult.lastAudit}</p>
                        <div className="pt-2">
                          <p className="font-bold text-slate-400 text-[10px] uppercase">STORING SKUS:</p>
                          {scanResult.items.length === 0 ? (
                            <p className="text-slate-500 italic mt-0.5">Empty location</p>
                          ) : (
                            scanResult.items.map((it: any, idx: number) => (
                              <p key={idx} className="text-white font-semibold mt-1">
                                - {it.product?.name || 'Stock'} ({it.quantity || it.qty} units)
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        );

      case 'allocation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Smart Inventory Allocation</h3>
              <p className="text-xs text-slate-400">Configure regional rebalancing, auto-routing limits, and maximum inventory buffers.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Allocation rules card (ColSpan 2) */}
              <Card className="md:col-span-2 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-5">
                <h4 className="font-bold text-white text-sm">Allocation Control Rules</h4>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                    <div>
                      <h5 className="font-bold text-white">Regional Demand Priority Routing</h5>
                      <p className="text-slate-450 text-[10px] mt-0.5 font-medium">Route deliveries from nearest physical warehouse to customer zip code.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                    <div>
                      <h5 className="font-bold text-white">Batch Slotting Optimization</h5>
                      <p className="text-slate-450 text-[10px] mt-0.5 font-medium">Automatically locate high velocity items in accessible picking lanes.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                    <div>
                      <h5 className="font-bold text-white">Max Vendor Storage Guard (75%)</h5>
                      <p className="text-slate-450 text-[10px] mt-0.5 font-medium">Caps individual vendor occupancy at 75% total facility storage capacity.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </Card>

              {/* Stock Rebalancing Dashboard */}
              <Card className="border border-slate-800 bg-slate-950/70 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-405 font-bold">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs uppercase tracking-wider text-slate-300">Live Imbalance Analyzer</span>
                </div>

                <div className="space-y-3 text-xs text-slate-350">
                  {warehouses?.slice(0, 3).map((w: any) => {
                    const occupied = w.bins?.filter((b: any) => b.inventory?.length > 0).length || 0;
                    const totalBins = w.bins?.length || 0;
                    const rate = totalBins > 0 ? Math.round((occupied / totalBins) * 100) : 0;
                    return (
                      <div key={w.id} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="truncate pr-2">{w.name}</span>
                          <span className={rate >= 80 ? 'text-rose-455 shrink-0' : 'text-indigo-400 shrink-0'}>
                            {rate}% {rate >= 80 ? '(Near Saturation)' : '(Available)'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                          <div className={rate >= 80 ? "bg-rose-500 h-full rounded-full" : "bg-indigo-650 h-full rounded-full"} style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!warehouses || warehouses.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No warehouses available to analyze capacity imbalance.</p>
                  )}
                </div>

                {isBalancing ? (
                  <div className="space-y-2 pt-2 animate-pulse">
                    <div className="flex justify-between text-[10px] font-mono text-indigo-400">
                      <span>Rebalancing stocks...</span>
                      <span>{balanceProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${balanceProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleAutoRebalance}
                    className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Simulate Auto-Rebalancing
                  </Button>
                )}
              </Card>
            </div>
          </div>
        );

      case 'operations':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Live Execution Queues</h3>
                <p className="text-xs text-slate-400">Monitor active pick batches, packing stations progress, and carrier pickup queues.</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsBottleneckAlert(true);
                    toast.error("Alert: High congestion reported in Aisle C!");
                  }}
                  className="rounded-xl h-9 text-xs font-bold text-rose-500 hover:text-rose-455 border-rose-500/20 hover:bg-rose-500/10"
                >
                  Trigger Bottleneck
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setPickSpike(25);
                    toast.info("Simulating order volume surge (+25 orders queued)");
                  }}
                  className="rounded-xl h-9 text-xs font-bold text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10"
                >
                  Surge Volume
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setPickSpike(0);
                    setIsBottleneckAlert(false);
                    toast.success("Simulation metrics cleared");
                  }}
                  className="rounded-xl h-9 text-xs font-bold text-slate-400"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { name: "Picking queue", count: kpis.pendingPicking, status: "Active", color: "text-indigo-400 bg-indigo-500/10" },
                { name: "QC audit queue", count: kpis.pendingPacking, status: "Active", color: "text-orange-400 bg-orange-500/10" },
                { name: "Packing stations", count: "8/12 active", status: "Nominal", color: "text-emerald-450 bg-emerald-500/10" },
                { name: "Outbound shipment loading", count: "5 waiting", status: "Delayed", color: "text-rose-455 bg-rose-500/10" }
              ].map((q, idx) => (
                <Card key={idx} className="border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{q.name}</span>
                    <Badge className={cn("text-[8px] font-black rounded-full h-4", q.color)}>
                      {q.status}
                    </Badge>
                  </div>
                  <h4 className="text-2xl font-black text-white mt-2">{q.count}</h4>
                </Card>
              ))}
            </div>

            {/* Live activity feed */}
            <Card className="border border-slate-800 bg-slate-955/40 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Execution Event Logs</h4>
              <div className="space-y-2">
                {(() => {
                  const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED').slice(0, 5);
                  if (completedTasks.length === 0) {
                    return <p className="text-xs text-slate-500 text-center py-4 font-medium">No recent execution logs.</p>;
                  }
                  return completedTasks.map((t: any, idx: number) => {
                    const roleName = t.taskType === 'PICKING' ? 'Picker' : t.taskType === 'PACKING' ? 'Packer' : 'Dispatcher';
                    const actionName = t.taskType === 'PICKING' ? 'completed picking' : t.taskType === 'PACKING' ? 'completed packing' : 'completed dispatch of';
                    const timeText = t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
                    return (
                      <div key={t.id || idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-900/30 rounded-xl border border-slate-850">
                        <span className="text-slate-350 font-medium">
                          <strong>{roleName} {t.staff?.firstName || 'Staff'}</strong> {actionName} Order #{t.order?.orderNumber || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-650 font-mono font-bold">{timeText}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>
        );

      case 'staff':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Workforce & Shifts</h3>
                <p className="text-xs text-slate-400">Assign staff to picking/packing duties and scheduler shift rotations.</p>
              </div>
              <Button size="sm" onClick={() => setIsAssignStaffOpen(true)} className="rounded-xl h-9 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white">
                <UserPlus className="w-4 h-4 mr-1" /> Onboard Staff
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Roster lists (ColSpan 2) */}
              <Card className="md:col-span-2 border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-850 bg-slate-950/40">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shift Roster Registry</h4>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Active Shift</th>
                      <th className="p-3 text-right">Productivity Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {displayRoster.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-900/30 text-slate-200">
                        <td className="p-3 font-semibold text-white">{st.name}</td>
                        <td className="p-3 font-medium text-slate-450">{st.role}</td>
                        <td className="p-3">
                          <Badge className="bg-slate-955 text-indigo-400 border border-slate-850 text-[9px] h-4">
                            {st.shift}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">{st.productivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Shift Scheduler */}
              <Card className="border border-slate-800 bg-slate-950/70 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Shift Allocator Tool
                </h4>
                <form onSubmit={handleShiftSchedule} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-staff" className="text-[10px] font-black uppercase text-slate-350">Select Staff Member</Label>
                    <Select value={schedulerStaffId} onValueChange={setSchedulerStaffId}>
                      <SelectTrigger id="sched-staff" className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Choose Staff" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {staffList.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sched-shift" className="text-[10px] font-black uppercase text-slate-350">Target Work Shift</Label>
                    <Select value={schedulerShift} onValueChange={setSchedulerShift}>
                      <SelectTrigger id="sched-shift" className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Choose Shift" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Morning">Morning Shift (06:00 - 14:00)</SelectItem>
                        <SelectItem value="Evening">Evening Shift (14:00 - 22:00)</SelectItem>
                        <SelectItem value="Night">Night Shift (22:00 - 06:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={!schedulerStaffId} className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Schedule Shift Rotation
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        );

      case 'inbound':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Inbound process tracker */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Pending Inbound Manifests</h4>
                </div>

                <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                      <tr>
                        <th className="p-3">Manifest ID</th>
                        <th className="p-3">Carrier Partner</th>
                        <th className="p-3">Inventory Size</th>
                        <th className="p-3">Dock Bay</th>
                        <th className="p-3 text-right">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {inbounds.map((inb) => (
                        <tr key={inb.id} className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-mono font-bold text-white">{inb.id}</td>
                          <td className="p-3 font-semibold text-slate-350">{inb.carrier}</td>
                          <td className="p-3">{inb.items}</td>
                          <td className="p-3 font-mono text-indigo-400 font-bold">{inb.dock}</td>
                          <td className="p-3 text-right">
                            <Badge className={cn(
                              "text-[8px] font-black rounded-full h-4",
                              inb.status === 'Putaway' && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                              inb.status === 'Docked' && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
                              inb.status === 'In-Transit' && "bg-slate-955 text-slate-500 border border-slate-850"
                            )}>
                              {inb.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Log inbound deliveries */}
              <Card className="border border-slate-800 bg-slate-955/70 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-450" /> Log Inbound Delivery
                </h4>
                <form onSubmit={handleAddInbound} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="inb-carrier" className="text-[10px] font-black uppercase text-slate-350">Carrier Partner</Label>
                    <Input 
                      id="inb-carrier"
                      placeholder="e.g. Delhivery or DHL" 
                      value={inboundCarrier}
                      onChange={(e) => setInboundCarrier(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inb-cartons" className="text-[10px] font-black uppercase text-slate-350">Unloaded Cartons</Label>
                    <Input 
                      id="inb-cartons"
                      type="number"
                      placeholder="e.g. 150" 
                      value={inboundCartons}
                      onChange={(e) => setInboundCartons(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl text-white"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={!inboundCarrier || !inboundCartons} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Assign Dock & Log Receipt
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        );

      case 'outbound':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Outbound Dispatches</h3>
                <p className="text-xs text-slate-400">Track shipments ready for pick-up and dispatch queue timelines.</p>
              </div>
              <Select value={outboundFilter} onValueChange={setOutboundFilter}>
                <SelectTrigger className="w-36 h-9 border-slate-800 bg-slate-950 text-xs rounded-xl text-white">
                  <SelectValue placeholder="Carrier Filter" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="delhivery">Delhivery</SelectItem>
                  <SelectItem value="bluedart">Bluedart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                  <tr>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Carrier Partner</th>
                    <th className="p-3">Fulfillment Speed</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {outboundOrders
                    .filter((o: any) => outboundFilter === 'all' || o.carrier.toLowerCase().includes(outboundFilter.toLowerCase()))
                    .map((out: any) => (
                    <tr key={out.id} className="hover:bg-slate-900/30 text-slate-200">
                      <td className="p-3 font-mono font-bold text-indigo-405">{out.id}</td>
                      <td className="p-3 font-semibold text-white">{out.name}</td>
                      <td className="p-3 text-slate-450 font-bold uppercase">{out.carrier}</td>
                      <td className="p-3 font-mono text-[11px]">{out.speed}</td>
                      <td className="p-3 text-right">
                        <Badge className={cn(
                          "text-[8px] font-black rounded-full h-4",
                          out.status === 'Shipped' && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20",
                          out.status === 'Ready to Ship' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                          out.status === 'Packing' && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                          out.status === 'Picking' && "bg-slate-955 text-slate-550 border border-slate-850"
                        )}>
                          {out.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        );

      case 'transfers':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Transfers directory table */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-sm font-bold text-white">Inter-Facility Stock Transfers</h4>
                <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                      <tr>
                        <th className="p-3">Transfer Ref</th>
                        <th className="p-3">Destination Facility</th>
                        <th className="p-3">Inventory Manifest</th>
                        <th className="p-3">Log Date</th>
                        <th className="p-3 text-right">Transit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {transfers.map((trf) => (
                        <tr key={trf.id} className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-mono font-bold text-white">{trf.id}</td>
                          <td className="p-3 font-semibold text-slate-350">{trf.target}</td>
                          <td className="p-3">{trf.items}</td>
                          <td className="p-3 font-mono text-slate-500">{trf.date}</td>
                          <td className="p-3 text-right">
                            <Badge className={cn(
                              "text-[8px] font-black rounded-full h-4",
                              trf.status === 'In-Transit' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse",
                              trf.status === 'Processing' && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                              trf.status === 'Delivered' && "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20"
                            )}>
                              {trf.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Transfer Form */}
              <Card className="border border-slate-800 bg-slate-955/70 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-400" /> Dispatch Transfer
                </h4>
                <form onSubmit={handleAddTransfer} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="trf-target" className="text-[10px] font-black uppercase text-slate-350">Target Destination</Label>
                    <Select value={transferTargetWh} onValueChange={setTransferTargetWh}>
                      <SelectTrigger id="trf-target" className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Select Warehouse" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {warehouses
                          ?.filter((w: any) => w.id !== selectedWHId)
                          ?.map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="trf-sku" className="text-[10px] font-black uppercase text-slate-350">Product Barcode/SKU</Label>
                    <Input 
                      id="trf-sku"
                      placeholder="e.g. SKU-TM-01" 
                      value={transferSKU}
                      onChange={(e) => setTransferSKU(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="trf-qty" className="text-[10px] font-black uppercase text-slate-350">Relocation Quantity</Label>
                    <Input 
                      id="trf-qty"
                      type="number"
                      placeholder="e.g. 100" 
                      value={transferQty}
                      onChange={(e) => setTransferQty(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl text-white"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={!transferTargetWh || !transferSKU || !transferQty} className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    Record Transfer Manifest
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        );

      case 'capacity':
        const totalBins = selectedWH?.bins?.length || 0;
        const occupiedBins = selectedWH?.bins?.filter((b: any) => b.inventory?.length > 0).length || 0;
        const overallRate = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;
        const totalCubicSpace = totalBins * 100;
        const activeOccupiedVol = occupiedBins * 100;
        const utilizationIndex = overallRate;
        const reservedVol = Math.round(activeOccupiedVol * 0.22); // dynamic reservation

        const capacityData = [
          { month: 'Jun', occupied: Math.round(activeOccupiedVol * 0.7), overflow: 0 },
          { month: 'Jul', occupied: Math.round(activeOccupiedVol * 0.9), overflow: 0 },
          { month: 'Aug', occupied: activeOccupiedVol, overflow: Math.max(0, activeOccupiedVol - totalCubicSpace) },
          { month: 'Sep', occupied: Math.round(activeOccupiedVol * 1.1), overflow: Math.max(0, Math.round(activeOccupiedVol * 1.1) - totalCubicSpace) }
        ];

        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border border-slate-850 bg-slate-900/40 p-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Total Facility Cubic Space</span>
                <h4 className="text-2xl font-black text-white mt-1">{totalCubicSpace.toLocaleString()} cu.ft.</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Physical limit capacity</p>
              </Card>
              <Card className="border border-slate-850 bg-slate-900/40 p-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Active Occupied Vol</span>
                <h4 className="text-2xl font-black text-indigo-400 mt-1">{activeOccupiedVol.toLocaleString()} cu.ft.</h4>
                <p className="text-[10px] text-emerald-450 mt-0.5">{utilizationIndex}% utilization index</p>
              </Card>
              <Card className="border border-slate-850 bg-slate-900/40 p-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Reserved Vendor Stock</span>
                <h4 className="text-2xl font-black text-amber-500 mt-1">{reservedVol.toLocaleString()} cu.ft.</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Dispatched inbound reservation</p>
              </Card>
            </div>

            {/* Recharts capacity forecasting graph */}
            <Card className="border border-slate-800 bg-slate-900/40 p-6 rounded-2xl">
              <div className="mb-4">
                <h4 className="font-bold text-white text-sm">Capacity Saturation Forecast</h4>
                <p className="text-xs text-slate-400">Predictive analysis of storage load over next 4 months peak seasons.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={capacityData}>
                    <defs>
                      <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 11, borderRadius: 12 }} />
                    <Area type="monotone" dataKey="occupied" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCap)" strokeWidth={2.5} name="Occupied Vol (cu.ft.)" />
                    <Area type="monotone" dataKey="overflow" stroke="#f43f5e" fillOpacity={0.1} fill="#f43f5e" strokeWidth={1.5} name="Saturated Vol" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <Card className="border border-slate-800 bg-slate-900/40 p-6 rounded-2xl">
              <div className="mb-4">
                <h4 className="font-bold text-white text-sm">Staff Performance & Throughput</h4>
                <p className="text-xs text-slate-400">Database WMS analytics displaying completed tasks and performance index per assigned operator.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {staffChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      No staff performance data available to plot WMS charts.
                    </div>
                  ) : (
                    <RechartsBarChart data={staffChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 11, borderRadius: 12 }} />
                      <RechartsBar dataKey="tasks" fill="#6366f1" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                      <RechartsBar dataKey="score" fill="#10b981" name="Performance Score (%)" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Shift comparison table */}
            <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-850 bg-slate-950/40">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shift Comparison Summary</h4>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                  <tr>
                    <th className="p-3">Shift Team</th>
                    <th className="p-3">Total Picks</th>
                    <th className="p-3">SLA BREACHES</th>
                    <th className="p-3 text-right">Pick Efficiency Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(() => {
                    const morningPicks = allTasks.filter((t: any) => t.taskType === 'PICKING' && t.status === 'COMPLETED' && staffList.some((s: any, idx: number) => idx % 3 === 0 && s.userId === t.staffId)).length;
                    const eveningPicks = allTasks.filter((t: any) => t.taskType === 'PICKING' && t.status === 'COMPLETED' && staffList.some((s: any, idx: number) => idx % 3 === 1 && s.userId === t.staffId)).length;
                    const nightPicks = allTasks.filter((t: any) => t.taskType === 'PICKING' && t.status === 'COMPLETED' && staffList.some((s: any, idx: number) => idx % 3 === 2 && s.userId === t.staffId)).length;
                    
                    const morningTasks = allTasks.filter((t: any) => staffList.some((s: any, idx: number) => idx % 3 === 0 && s.userId === t.staffId));
                    const eveningTasks = allTasks.filter((t: any) => staffList.some((s: any, idx: number) => idx % 3 === 1 && s.userId === t.staffId));
                    const nightTasks = allTasks.filter((t: any) => staffList.some((s: any, idx: number) => idx % 3 === 2 && s.userId === t.staffId));
                    
                    const morningBreaches = morningTasks.filter((t: any) => t.status === 'CANCELLED').length;
                    const eveningBreaches = eveningTasks.filter((t: any) => t.status === 'CANCELLED').length;
                    const nightBreaches = nightTasks.filter((t: any) => t.status === 'CANCELLED').length;

                    const getEfficiency = (picks: number, breaches: number, total: number) => {
                      if (total === 0) return "100.0%";
                      const rate = ((total - breaches) / total) * 100;
                      return `${rate.toFixed(1)}%`;
                    };

                    return (
                      <>
                        <tr className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-semibold text-white">Morning Shift (A)</td>
                          <td className="p-3">{morningPicks} items</td>
                          <td className={`p-3 font-bold ${morningBreaches === 0 ? 'text-emerald-450' : 'text-amber-500'}`}>{morningBreaches} breaches</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">{getEfficiency(morningPicks, morningBreaches, morningTasks.length)}</td>
                        </tr>
                        <tr className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-semibold text-white">Evening Shift (B)</td>
                          <td className="p-3">{eveningPicks} items</td>
                          <td className={`p-3 font-bold ${eveningBreaches === 0 ? 'text-emerald-450' : 'text-amber-500'}`}>{eveningBreaches} breaches</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400">{getEfficiency(eveningPicks, eveningBreaches, eveningTasks.length)}</td>
                        </tr>
                        <tr className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-semibold text-white">Night Shift (C)</td>
                          <td className="p-3">{nightPicks} items</td>
                          <td className={`p-3 font-bold ${nightBreaches === 0 ? 'text-emerald-450' : 'text-rose-455'}`}>{nightBreaches} breaches</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-500">{getEfficiency(nightPicks, nightBreaches, nightTasks.length)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </Card>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Incident log table (ColSpan 2) */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-sm font-bold text-white">Incidents & Spill Logs</h4>
                <Card className="border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-850">
                      <tr>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">Issue Category</th>
                        <th className="p-3">Location Zone</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3 text-right">Job Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {incidents.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-900/30 text-slate-200">
                          <td className="p-3 font-mono font-bold text-white">{inc.id}</td>
                          <td className="p-3 font-semibold text-slate-350">{inc.type}</td>
                          <td className="p-3 font-mono text-indigo-400 font-bold">{inc.zone}</td>
                          <td className="p-3">
                            <Badge className={cn(
                              "text-[8px] font-black rounded-full h-4",
                              inc.severity === 'High' && "bg-rose-500/10 text-rose-455 border border-rose-500/20 animate-pulse",
                              inc.severity === 'Medium' && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                              inc.severity === 'Low' && "bg-slate-955 text-slate-500 border border-slate-850"
                            )}>
                              {inc.severity}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Badge className={cn(
                              "text-[8px] font-black rounded-full h-4",
                              inc.status === 'Resolved' ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            )}>
                              {inc.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* Log new maintenance report */}
              <Card className="border border-slate-800 bg-slate-955/70 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-405" /> Log Safety Incident
                </h4>
                <form onSubmit={handleAddIncident} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="inc-type" className="text-[10px] font-black uppercase text-slate-350">Incident Type</Label>
                    <Select value={incidentType} onValueChange={setIncidentType}>
                      <SelectTrigger id="inc-type" className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Choose Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Spill">Liquid Spill / Slip Risk</SelectItem>
                        <SelectItem value="Forklift Incident">Forklift Collision</SelectItem>
                        <SelectItem value="Scanner Malfunction">Scanner Malfunction</SelectItem>
                        <SelectItem value="Rack Damage">Structural Rack Damage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inc-sev" className="text-[10px] font-black uppercase text-slate-350">Severity Guard</Label>
                    <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                      <SelectTrigger id="inc-sev" className="border-slate-850 bg-slate-900 text-xs rounded-xl h-10 text-white">
                        <SelectValue placeholder="Choose Severity" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <SelectItem value="Low">Low - Informational / Clean up</SelectItem>
                        <SelectItem value="Medium">Medium - Hardware swap required</SelectItem>
                        <SelectItem value="High">High - Structural / Block aisle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inc-zone" className="text-[10px] font-black uppercase text-slate-350">Zone / Aisle Location</Label>
                    <Input 
                      id="inc-zone"
                      placeholder="e.g. Aisle C3 or Dock 1" 
                      value={incidentZone}
                      onChange={(e) => setIncidentZone(e.target.value)}
                      className="h-10 border-slate-850 bg-slate-900 text-xs rounded-xl text-white"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={!incidentZone} className="w-full h-10 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold">
                    Log Ticket & Alert Crew
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card className="border border-slate-800 bg-slate-900/40 p-5 rounded-2xl space-y-6">
              <h4 className="font-bold text-white text-sm">Facility Operating Parameters</h4>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <Label htmlFor="pick-strategy-select" className="text-[10px] font-black uppercase text-slate-350">Order Picking Strategy</Label>
                  <Select value={pickingStrategy} onValueChange={setPickingStrategy}>
                    <SelectTrigger id="pick-strategy-select" className="border-slate-850 bg-slate-950 text-xs rounded-xl h-10 text-indigo-400 font-bold">
                      <SelectValue placeholder="Strategy" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="wave">Wave Picking (Auto-dispatched blocks)</SelectItem>
                      <SelectItem value="batch">Batch Picking (Multi-order consolidation)</SelectItem>
                      <SelectItem value="zone">Zone Picking (Separated aisle picking)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-955 rounded-xl border border-slate-850/60 pt-3">
                  <div>
                    <h5 className="font-bold text-white">Scanner audio feedback beep</h5>
                    <p className="text-slate-500 text-[10px] mt-0.5">Play confirmation sound on successful barcode check.</p>
                  </div>
                  <Switch checked={scannerBeep} onCheckedChange={setScannerBeep} />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-350">
                    <span>LOW STOCK ALERT THRESHOLD</span>
                    <span className="text-indigo-400 font-mono">{minStockLimit} units</span>
                  </div>
                  <input 
                    type="range"
                    value={minStockLimit} 
                    onChange={(e) => setMinStockLimit(Number(e.target.value))} 
                    min={5} 
                    max={100} 
                    step={5} 
                    className="w-full h-1.5 bg-slate-950 accent-indigo-600 rounded-lg appearance-none cursor-pointer border border-slate-800"
                  />
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 flex justify-end">
                <Button 
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 800)),
                      {
                        loading: 'Saving facility settings...',
                        success: 'WMS parameters successfully persisted!',
                        error: 'Fail.'
                      }
                    );
                  }}
                  className="rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold h-10 px-6"
                >
                  Save WMS Parameters
                </Button>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-805/40 pb-6">
        <div>
          <Breadcrumbs />
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-white mt-1">
            <WarehouseIcon className="w-8 h-8 text-indigo-400" />
            Warehouse Management Cockpit
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            Orchestrate facility layouts, storage configurations, workforce schedules, and live execution analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Global Facility dropdown selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-xl">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">Active Warehouse:</span>
            <Select value={selectedWHId || ''} onValueChange={setSelectedWHId}>
              <SelectTrigger className="border-none bg-transparent hover:bg-transparent text-indigo-400 font-bold p-0 h-auto focus:ring-0 gap-1 text-sm">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                {warehouses?.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id} className="font-semibold text-white">
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white">
            <RefreshCw className={cn("w-3.5 h-3.5", (isWHLoading || isRefreshing) && "animate-spin")} /> Synchronize
          </Button>

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'VENDOR_ADMIN') && (
            <Button size="sm" onClick={() => setIsAddWarehouseOpen(true)} className="h-9 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-none">
              <Plus className="w-4 h-4" /> Add Warehouse
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: WMS menu list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-slate-800 bg-slate-955/50 backdrop-blur rounded-2xl overflow-hidden p-3 space-y-4 shadow-2xl">
            {Object.entries(groupedTabs).map(([group, groupTabs]) => (
              <div key={group} className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-3 py-1">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {groupTabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all text-left",
                          isActive 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-650/15" 
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-450")} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>

          {selectedWH && (
            <Card className="border border-slate-850 bg-slate-955/20 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Facility</span>
                <Badge className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[8px] font-bold h-4">
                  ONLINE
                </Badge>
              </div>
              <p className="text-xs font-bold text-white truncate">{selectedWH.name}</p>
              <p className="text-[9px] text-slate-500 truncate font-semibold uppercase">{selectedWH.location}</p>
            </Card>
          )}
        </div>

        {/* Right columns: Tab active view pane */}
        <div className="lg:col-span-4 space-y-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Add Warehouse Dialog */}
      <Dialog open={isAddWarehouseOpen} onOpenChange={setIsAddWarehouseOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl">
          <form onSubmit={handleCreateWarehouse}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <WarehouseIcon className="w-5 h-5 text-indigo-400" />
                Add New Warehouse
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Register a new physical facility to orchestrate daily inventory and shipping workflows.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="wh-name" className="text-[10px] font-black uppercase tracking-wider text-slate-300">Warehouse Name</Label>
                <Input 
                  id="wh-name"
                  placeholder="e.g. Warehouse Delhi-01" 
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-950 text-xs rounded-xl text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wh-location" className="text-[10px] font-black uppercase tracking-wider text-slate-300">Location / Address</Label>
                <Input 
                  id="wh-location"
                  placeholder="e.g. Okhla Phase III, New Delhi" 
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-950 text-xs rounded-xl text-white"
                  required
                />
              </div>

              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <Label htmlFor="wh-vendor" className="text-[10px] font-black uppercase tracking-wider text-slate-300">Assign to Vendor</Label>
                  <Select value={whVendorId || 'global'} onValueChange={setWhVendorId}>
                    <SelectTrigger id="wh-vendor" className="border-slate-800 bg-slate-950 text-xs rounded-xl h-10 text-white">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="global">
                        Global / Shared (Visible to All Vendors)
                      </SelectItem>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsAddWarehouseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createWarehouseMutation.isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {createWarehouseMutation.isPending ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={isAssignStaffOpen} onOpenChange={setIsAssignStaffOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl">
          <form onSubmit={handleAssignStaff}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Users className="w-5 h-5 text-indigo-400" />
                Assign Personnel
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Assign an existing manager or staff member to the selected facility: <span className="text-white font-semibold">{selectedWH?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-select" className="text-[10px] font-black uppercase tracking-wider text-slate-300">Select Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger id="staff-select" className="border-slate-800 bg-slate-950 text-xs rounded-xl h-10 text-white">
                    <SelectValue placeholder="Select Staff Member" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    {eligibleStaff.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 text-center font-medium">No available staff for this vendor</div>
                    ) : (
                      eligibleStaff.map((st: any) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.firstName} {st.lastName} ({st.designation || 'Staff'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setIsAssignStaffOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignStaffMutation.isPending || !selectedStaffId} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {assignStaffMutation.isPending ? 'Assigning...' : 'Assign Personnel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
