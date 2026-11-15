'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  Mail, 
  Building, 
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@/store/auth-store';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Filter States
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form states
  const [editFormData, setEditFormData] = useState({
    role: 'STAFF',
    vendorId: 'NONE'
  });
  const [newPassword, setNewPassword] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await api.get('/vendors');
      return Array.isArray(data) ? data : (data.vendors || []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post('/users', userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddModalOpen(false);
      toast.success('User created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: res } = await api.patch(`/users/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      setIsResetModalOpen(false);
      setNewPassword('');
      toast.success('User updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 hover:bg-rose-200 border-none">Super Admin</Badge>;
      case 'VENDOR_ADMIN': return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 hover:bg-blue-200 border-none">Vendor Admin</Badge>;
      case 'WAREHOUSE_MANAGER': return <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 hover:bg-amber-200 border-none">Manager</Badge>;
      case 'STAFF': return <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-none">Staff</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    createMutation.mutate({
      ...data,
      vendorId: data.vendorId === 'NONE' ? null : data.vendorId
    });
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      data: {
        role: editFormData.role,
        vendorId: editFormData.vendorId === 'NONE' ? null : editFormData.vendorId
      }
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    updateMutation.mutate({
      id: selectedUser.id,
      data: { password: newPassword }
    });
  };

  const toggleUserActivation = (user: any) => {
    const isCurrentlyActive = !user.deletedAt;
    updateMutation.mutate({
      id: user.id,
      data: { isActive: !isCurrentlyActive }
    });
  };

  // Filters calculation
  const filteredUsers = (users || []).filter((u: any) => {
    const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
                     u.email.toLowerCase().includes(search.toLowerCase());
                     
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    
    const isActive = !u.deletedAt;
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && isActive) || 
      (filterStatus === 'DEACTIVATED' && !isActive);
      
    return nameMatch && matchesRole && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="flex flex-col pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">User Management</h1>
            <p className="text-slate-500 font-medium mt-1">Control access, manage roles, and monitor user status across the system.</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 font-black gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4" /> CREATE NEW USER
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Create User</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  Register a new user with specific role-based permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                    <Input name="firstName" required className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                    <Input name="lastName" required className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</Label>
                  <Input name="email" type="email" required className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Initial Password</Label>
                  <Input name="password" type="password" required className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">User Role</Label>
                  <Select name="role" defaultValue="STAFF">
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="VENDOR_ADMIN">Vendor Admin</SelectItem>
                      <SelectItem value="WAREHOUSE_MANAGER">Warehouse Manager</SelectItem>
                      <SelectItem value="STAFF">Execution Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Assign Vendor (Optional)</Label>
                  <Select name="vendorId" defaultValue="NONE">
                    <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                      <SelectItem value="NONE">System-Wide (None)</SelectItem>
                      {Array.isArray(vendors) && vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl font-black h-12" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'CREATING...' : 'FINALIZE USER CREATION'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
          {/* Controls Bar: Search & Advanced Filters */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1 max-w-lg">
                <div className="flex flex-col space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Role Filter</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-900 dark:text-slate-100">
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="VENDOR_ADMIN">Vendor Admin</SelectItem>
                      <SelectItem value="WAREHOUSE_MANAGER">Warehouse Manager</SelectItem>
                      <SelectItem value="STAFF">Execution Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 ml-1">Status Filter</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-900 dark:text-slate-100">
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active Accounts</SelectItem>
                      <SelectItem value="DEACTIVATED">Deactivated Accounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow className="border-none">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6">User Identity</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6">Role</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6">Organization</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest h-12 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => {
                const isActive = !user.deletedAt;
                return (
                  <TableRow key={user.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 uppercase">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Building className="w-3.5 h-3.5" />
                        {user.vendorId ? 'Vendor Associated' : 'System-Wide'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {isActive ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-none hover:bg-emerald-50">Active</Badge>
                      ) : (
                        <Badge className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-none hover:bg-rose-50">Deactivated</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl w-48 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditFormData({
                                role: user.role,
                                vendorId: user.vendorId || 'NONE'
                              });
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 text-blue-500" /> Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPassword('');
                              setIsResetModalOpen(true);
                            }}
                          >
                            <KeyRound className="w-4 h-4 text-amber-500" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                          <DropdownMenuItem 
                            className={`rounded-lg gap-2 cursor-pointer font-bold text-xs py-2.5 ${isActive ? 'text-rose-600 focus:text-rose-600' : 'text-emerald-600 focus:text-emerald-600'}`}
                            onClick={() => toggleUserActivation(user)}
                          >
                            {isActive ? (
                              <>
                                <XCircle className="w-4 h-4" /> Deactivate User
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="font-bold text-slate-400">No users match the search/filters</p>
            </div>
          )}
        </div>

      {/* Edit Role / Vendor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Edit Permissions</DialogTitle>
            <DialogDescription className="font-semibold text-slate-400">
              Update authorization role and organizational scope for {selectedUser?.firstName} {selectedUser?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUserSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">System Role</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(v) => setEditFormData({ ...editFormData, role: v })}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="VENDOR_ADMIN">Vendor Admin</SelectItem>
                  <SelectItem value="WAREHOUSE_MANAGER">Warehouse Manager</SelectItem>
                  <SelectItem value="STAFF">Execution Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Associated Vendor</Label>
              <Select 
                value={editFormData.vendorId} 
                onValueChange={(v) => setEditFormData({ ...editFormData, vendorId: v })}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="NONE">System-Wide (None)</SelectItem>
                  {vendors.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full mt-4 h-11 rounded-xl font-bold" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Apply Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Reset Password</DialogTitle>
            <DialogDescription className="font-semibold text-slate-400">
              Provide a new credential for {selectedUser?.firstName} {selectedUser?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">New Password</Label>
              <Input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-slate-100 h-11" 
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full mt-4 h-11 rounded-xl font-bold" disabled={updateMutation.isPending || !newPassword}>
              {updateMutation.isPending ? 'Resetting...' : 'Change Credential'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </RoleGuard>
);
}
