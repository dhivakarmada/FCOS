'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserPlus, 
  MoreVertical,
  RefreshCw,
  User,
  Building,
  Activity,
  Edit,
  Trash2,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Shield
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaffLeaderboard } from '@/components/performance/staff-leaderboard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/use-socket';

export default function StaffPage() {
  const queryClient = useQueryClient();
  const socket = useSocket(); // initializes real-time updates
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Modal open states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignWarehouseOpen, setIsAssignWarehouseOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  // Filters state
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');
  const [filterDesignation, setFilterDesignation] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Forms state
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    role: 'STAFF',
    designation: 'Picker',
    warehouseId: 'UNASSIGNED',
    phone: ''
  });

  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    designation: '',
    warehouseId: 'UNASSIGNED'
  });

  const [taskFormData, setTaskFormData] = useState({
    orderId: '',
    taskType: 'PICKING'
  });

  // Fetch Staff List
  const { data: staffList, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    }
  });

  // Fetch Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-list-onboard'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    }
  });

  // Fetch Orders for Task Assignment
  const { data: orders = [] } = useQuery({
    queryKey: ['orders-list-assign'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.orders || [];
    }
  });

  // Fetch Assigned Tasks for selected staff details view
  const { data: staffTasks = [], refetch: refetchStaffTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['staff-tasks', selectedStaff?.id],
    queryFn: async () => {
      if (!selectedStaff?.id) return [];
      const res = await api.get(`/staff/${selectedStaff.id}/tasks`);
      return res.data;
    },
    enabled: !!selectedStaff?.id
  });

  // Populate Edit form when selected staff changes
  useEffect(() => {
    if (selectedStaff) {
      setEditFormData({
        firstName: selectedStaff.firstName || '',
        lastName: selectedStaff.lastName || '',
        phone: selectedStaff.phone || '',
        designation: selectedStaff.designation || 'Picker',
        warehouseId: selectedStaff.warehouseId || 'UNASSIGNED'
      });
      refetchStaffTasks();
    }
  }, [selectedStaff, refetchStaffTasks]);

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/staff', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Staff member onboarded successfully');
      setIsDialogOpen(false);
      setFormData({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '', 
        role: 'STAFF',
        designation: 'Picker',
        warehouseId: 'UNASSIGNED',
        phone: ''
      });
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to onboard staff');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/staff/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Staff details updated successfully');
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update staff');
    }
  });

  const assignWarehouseMutation = useMutation({
    mutationFn: async ({ id, warehouseId }: { id: string; warehouseId: string }) => {
      const res = await api.patch(`/staff/${id}/warehouse`, { warehouseId });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Warehouse facility assigned successfully');
      setIsAssignWarehouseOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign facility');
    }
  });

  const assignTaskMutation = useMutation({
    mutationFn: async ({ staffId, data }: { staffId: string; data: any }) => {
      const res = await api.post(`/staff/${staffId}/assign-task`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Task assigned successfully');
      setIsAssignTaskOpen(false);
      setTaskFormData({ orderId: '', taskType: 'PICKING' });
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/staff/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Staff member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
    }
  });

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    onboardMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      designation: formData.role === 'WAREHOUSE_MANAGER' ? 'Warehouse Manager' : formData.designation,
      warehouseId: formData.warehouseId === 'UNASSIGNED' ? undefined : formData.warehouseId,
      phone: formData.phone || undefined
    });
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff?.id) return;
    updateMutation.mutate({
      id: selectedStaff.id,
      data: {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phone: editFormData.phone || null,
        designation: editFormData.designation,
        warehouseId: editFormData.warehouseId === 'UNASSIGNED' ? null : editFormData.warehouseId
      }
    });
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff?.id || !taskFormData.orderId) return;
    assignTaskMutation.mutate({
      staffId: selectedStaff.id,
      data: {
        orderId: taskFormData.orderId,
        taskType: taskFormData.taskType
      }
    });
  };

  const handleAssignWarehouse = (warehouseId: string) => {
    if (!selectedStaff?.id) return;
    assignWarehouseMutation.mutate({
      id: selectedStaff.id,
      warehouseId
    });
  };

  // Filter staff data based on UI filters
  const filteredStaff = (staffList || []).filter((s: any) => {
    const matchesWarehouse = filterWarehouse === 'ALL' || 
      (filterWarehouse === 'UNASSIGNED' && !s.warehouseId) ||
      s.warehouseId === filterWarehouse;
    
    const designationStr = s.designation || s.user?.role || 'STAFF';
    const matchesDesignation = filterDesignation === 'ALL' || designationStr === filterDesignation;
    
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && s.isActive) || 
      (filterStatus === 'INACTIVE' && !s.isActive);
      
    return matchesWarehouse && matchesDesignation && matchesStatus;
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Staff Member',
      cell: ({ row }) => {
        const name = `${row.original.firstName} ${row.original.lastName}`;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{name}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {row.original.designation || 'STAFF'}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'phone',
      header: 'Phone Details',
      cell: ({ row }) => <span>{row.original.phone || 'N/A'}</span>
    },
    {
      accessorKey: 'warehouse',
      header: 'Assigned Facility',
      cell: ({ row }) => <span>{row.original.warehouse?.name || 'Unassigned'}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'SUCCESS' : 'WARNING'} label={row.original.isActive ? 'ACTIVE' : 'INACTIVE'} />
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xl w-48">
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
              onClick={() => {
                setSelectedStaff(row.original);
                setIsProfileSheetOpen(true);
              }}
            >
              <User className="w-4 h-4 text-primary" /> View Task History
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
              onClick={() => {
                setSelectedStaff(row.original);
                setIsAssignWarehouseOpen(true);
              }}
            >
              <Building className="w-4 h-4 text-amber-500" /> Assign Facility
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
              onClick={() => {
                setSelectedStaff(row.original);
                setIsAssignTaskOpen(true);
              }}
            >
              <Activity className="w-4 h-4 text-emerald-500" /> Assign Task
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
              onClick={() => {
                setSelectedStaff(row.original);
                setIsEditOpen(true);
              }}
            >
              <Edit className="w-4 h-4 text-blue-500" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuItem 
              className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5 text-rose-600 focus:text-rose-600"
              onClick={() => {
                if (confirm(`Are you sure you want to remove ${row.original.firstName} ${row.original.lastName}?`)) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete Staff
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Workforce Management</h2>
          <p className="text-muted-foreground font-medium mt-1">Monitor performance metrics and manage assignments for warehouse staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="h-9 gap-2 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 rounded-xl shadow-md">
                <UserPlus className="w-4 h-4" /> Onboard Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Onboard New Staff</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleOnboard} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                    <Input 
                      required 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                    <Input 
                      required 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email</Label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</Label>
                  <Input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Temporary Password</Label>
                  <Input 
                    type="password" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Role</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                      <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                        <SelectItem value="STAFF">Warehouse Staff</SelectItem>
                        <SelectItem value="WAREHOUSE_MANAGER">Warehouse Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.role === 'STAFF' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Staff Designation</Label>
                      <Select value={formData.designation} onValueChange={(v) => setFormData({...formData, designation: v})}>
                        <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                          <SelectItem value="Picker">Picker</SelectItem>
                          <SelectItem value="Packer">Packer</SelectItem>
                          <SelectItem value="QC">QC Inspector</SelectItem>
                          <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Assign Warehouse</Label>
                  <Select value={formData.warehouseId} onValueChange={(v) => setFormData({...formData, warehouseId: v})}>
                    <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="Select Warehouse Location" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="UNASSIGNED">Leave Unassigned</SelectItem>
                      {warehouses.map((wh: any) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-4 h-10 rounded-xl" disabled={onboardMutation.isPending}>
                  {onboardMutation.isPending ? 'Creating Account...' : 'Onboard Staff Member'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Card className="border-none shadow-sm overflow-hidden h-full bg-white dark:bg-slate-900/50 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Staff Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Advanced Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Facility Filter</Label>
                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger className="h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="All Facility Sites" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="ALL">All Facilities</SelectItem>
                      <SelectItem value="UNASSIGNED">Unassigned Only</SelectItem>
                      {warehouses.map((wh: any) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Designation Filter</Label>
                  <Select value={filterDesignation} onValueChange={setFilterDesignation}>
                    <SelectTrigger className="h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="All Designations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="ALL">All Designations</SelectItem>
                      <SelectItem value="Picker">Picker</SelectItem>
                      <SelectItem value="Packer">Packer</SelectItem>
                      <SelectItem value="QC">QC Inspector</SelectItem>
                      <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                      <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Status Filter</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active (Online)</SelectItem>
                      <SelectItem value="INACTIVE">Inactive (Offline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground font-bold">Loading staff roster...</div>
              ) : (
                <DataTable columns={columns} data={filteredStaff} searchKey="name" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <StaffLeaderboard />
        </div>
      </div>

      {/* Edit Details Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Edit Staff Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                <Input 
                  required 
                  value={editFormData.firstName} 
                  onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} 
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                <Input 
                  required 
                  value={editFormData.lastName} 
                  onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} 
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone Number</Label>
              <Input 
                type="tel" 
                value={editFormData.phone} 
                onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Designation</Label>
              <Select value={editFormData.designation} onValueChange={(v) => setEditFormData({...editFormData, designation: v})}>
                <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="Picker">Picker</SelectItem>
                  <SelectItem value="Packer">Packer</SelectItem>
                  <SelectItem value="QC">QC Inspector</SelectItem>
                  <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="Warehouse Manager">Warehouse Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Assign Facility</Label>
              <Select value={editFormData.warehouseId} onValueChange={(v) => setEditFormData({...editFormData, warehouseId: v})}>
                <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full mt-4 h-10 rounded-xl" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Save Staff Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Facility Dialog */}
      <Dialog open={isAssignWarehouseOpen} onOpenChange={setIsAssignWarehouseOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Assign Facility</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-xs font-semibold text-slate-500">
              Assign {selectedStaff?.firstName} {selectedStaff?.lastName} to a specific warehouse location:
            </p>
            <Select 
              defaultValue={selectedStaff?.warehouseId || 'UNASSIGNED'} 
              onValueChange={handleAssignWarehouse}
            >
              <SelectTrigger className="w-full text-xs h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Select Warehouse Location" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                <SelectItem value="UNASSIGNED">Unassigned (None)</SelectItem>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Assign Active Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignTask} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Select Open Order</Label>
              <Select 
                value={taskFormData.orderId} 
                onValueChange={(v) => setTaskFormData({...taskFormData, orderId: v})}
              >
                <SelectTrigger className="w-full text-xs h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Select Order Number" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl max-h-48">
                  {orders.length === 0 ? (
                    <SelectItem value="NONE" disabled>No active orders</SelectItem>
                  ) : (
                    orders.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customerName} ({o.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Assignment Operation</Label>
              <Select 
                value={taskFormData.taskType} 
                onValueChange={(v) => setTaskFormData({...taskFormData, taskType: v})}
              >
                <SelectTrigger className="w-full text-xs h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="PICKING">Picking (Scan Items)</SelectItem>
                  <SelectItem value="PACKING">Packing (Verify & Box)</SelectItem>
                  <SelectItem value="DISPATCH">Dispatch Dispatching</SelectItem>
                  <SelectItem value="RETURN_VERIFY">Return Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full mt-4 h-11 rounded-xl font-bold" 
              disabled={assignTaskMutation.isPending || !taskFormData.orderId}
            >
              {assignTaskMutation.isPending ? 'Assigning...' : 'Assign Task to Staff'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task History Sidebar Sheet */}
      <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
        <SheetContent className="sm:max-w-[460px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-6">
          <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-900">
            <SheetTitle className="text-xl font-extrabold tracking-tight">Staff Task History</SheetTitle>
            <SheetDescription className="font-semibold text-slate-400">
              Overview of workloads and active status for {selectedStaff?.firstName} {selectedStaff?.lastName}.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Quick Profile Summary */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="font-extrabold">{selectedStaff?.firstName[0]}{selectedStaff?.lastName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-black text-sm">{selectedStaff?.firstName} {selectedStaff?.lastName}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedStaff?.designation || 'STAFF'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${selectedStaff?.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <span className="text-[10px] font-bold text-slate-500">{selectedStaff?.isActive ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  EFFICIENCY
                </div>
                <div className="text-2xl font-black tracking-tight">{selectedStaff?.performance?.toFixed(1) || '0.0'}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  TOTAL TASKS
                </div>
                <div className="text-2xl font-black tracking-tight">{staffTasks.length}</div>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</h4>
              <ScrollArea className="h-[280px] pr-2">
                {isTasksLoading ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">Loading task data...</div>
                ) : staffTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">No tasks assigned yet.</div>
                ) : (
                  <div className="space-y-3">
                    {staffTasks.map((t: any) => (
                      <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{t.taskType}</p>
                          <p className="text-[10px] font-bold text-slate-400">Order: {t.order?.orderNumber || 'Unknown'}</p>
                          <p className="text-[9px] font-bold text-slate-500">Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge 
                          className={`border-none rounded-lg text-[9px] font-black tracking-wider uppercase ${
                            t.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' :
                            t.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                            'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
