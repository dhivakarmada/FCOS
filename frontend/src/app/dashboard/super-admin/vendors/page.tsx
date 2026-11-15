'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Building2, Search, Filter, ShieldAlert, CheckCircle2, XCircle, Download, Plus } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

export default function VendorIntelligencePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    contactEmail: '',
    contactPhone: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    warehouseName: '',
    warehouseLocation: ''
  });
  const [allocationMode, setAllocationMode] = useState<'create' | 'existing'>('create');
  const [existingWarehouseId, setExistingWarehouseId] = useState('');

  const { data: warehousesList = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    }
  });

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendor-intelligence'],
    queryFn: async () => {
      const res = await api.get('/vendors/intelligence/rankings');
      return res.data;
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.post(`/vendors/${id}/toggle-status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Vendor ${data.isActive ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['vendor-intelligence'] });
    },
    onError: () => {
      toast.error('Failed to update vendor status');
    }
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/vendors/onboard', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Vendor onboarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsOnboardOpen(false);
      setAllocationMode('create');
      setExistingWarehouseId('');
      setFormData({
        vendorName: '',
        contactEmail: '',
        contactPhone: '',
        adminEmail: '',
        adminPassword: '',
        adminFirstName: '',
        adminLastName: '',
        warehouseName: '',
        warehouseLocation: ''
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to onboard vendor');
    }
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      vendorName: formData.vendorName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      adminEmail: formData.adminEmail,
      adminPassword: formData.adminPassword,
      adminFirstName: formData.adminFirstName,
      adminLastName: formData.adminLastName,
    };
    if (allocationMode === 'create') {
      payload.warehouseName = formData.warehouseName;
      payload.warehouseLocation = formData.warehouseLocation;
    } else {
      if (!existingWarehouseId) {
        toast.error('Please select an existing warehouse');
        return;
      }
      payload.existingWarehouseId = existingWarehouseId;
    }
    onboardMutation.mutate(payload);
  };

  const filteredVendors = vendors?.filter((v: any) => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Vendor Intelligence
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Monitor performance, revenue, and active status across all merchants.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => toast.info("Exporting vendor metrics...")}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          
          <Dialog open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold shadow-lg shadow-indigo-650/20">
                <Plus className="w-4 h-4" /> Onboard Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" /> Onboard New Vendor
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Create a new vendor profile, provision their initial admin user account, and allocate their default warehouse.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                {/* 1. Vendor Profile */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1.5">
                    1. Vendor Business Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendorName" className="text-xs font-semibold text-slate-350">Vendor Name</Label>
                      <Input
                        id="vendorName"
                        required
                        placeholder="e.g. Apex Retail Inc"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.vendorName}
                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-xs font-semibold text-slate-355">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        required
                        placeholder="e.g. +91 98765 43210"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-xs font-semibold text-slate-355">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      required
                      placeholder="e.g. contact@apexretail.com"
                      className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Admin User */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1.5">
                    2. Vendor Owner / Admin Account
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName" className="text-xs font-semibold text-slate-355">First Name</Label>
                      <Input
                        id="adminFirstName"
                        required
                        placeholder="e.g. John"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminLastName" className="text-xs font-semibold text-slate-355">Last Name</Label>
                      <Input
                        id="adminLastName"
                        required
                        placeholder="e.g. Doe"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-xs font-semibold text-slate-355">Admin Login Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        required
                        placeholder="e.g. admin@apexretail.com"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword" className="text-xs font-semibold text-slate-355">Password</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                 {/* 3. Default Warehouse */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      3. Allocate Initial Warehouse
                    </h4>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setAllocationMode('create')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200",
                          allocationMode === 'create'
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        Create New
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocationMode('existing')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200",
                          allocationMode === 'existing'
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        Use Existing
                      </button>
                    </div>
                  </div>

                  {allocationMode === 'create' ? (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in-50 duration-200">
                      <div className="space-y-2">
                        <Label htmlFor="warehouseName" className="text-xs font-semibold text-slate-355">Warehouse Name</Label>
                        <Input
                          id="warehouseName"
                          required={allocationMode === 'create'}
                          placeholder="e.g. Apex Central WH 1"
                          className="bg-slate-950 border-slate-800 text-white text-xs h-9 focus-visible:ring-indigo-500"
                          value={formData.warehouseName}
                          onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warehouseLocation" className="text-xs font-semibold text-slate-355">Location (City)</Label>
                        <Input
                          id="warehouseLocation"
                          required={allocationMode === 'create'}
                          placeholder="e.g. Mumbai"
                          className="bg-slate-950 border-slate-800 text-white text-xs h-9 focus-visible:ring-indigo-500"
                          value={formData.warehouseLocation}
                          onChange={(e) => handleInputChange('warehouseLocation', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in fade-in-50 duration-200">
                      <Label htmlFor="existingWarehouse" className="text-xs font-semibold text-slate-355">Select Existing Warehouse</Label>
                      <Select
                        value={existingWarehouseId}
                        onValueChange={setExistingWarehouseId}
                        required={allocationMode === 'existing'}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-xs h-9 focus-visible:ring-indigo-500">
                          <SelectValue placeholder="Select a warehouse..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                          {warehousesList && warehousesList.length > 0 ? (
                            warehousesList.map((wh: any) => (
                              <SelectItem key={wh.id} value={wh.id} className="focus:bg-slate-800 focus:text-white">
                                {wh.name} ({wh.location}) {wh.vendor ? `[Assigned: ${wh.vendor.name}]` : '[Shared / Global]'}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No warehouses found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">
                        * Note: If you select a Global / Shared warehouse, it will be assigned to this vendor as their default warehouse, but will remain accessible globally.
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-4 border-t border-slate-800">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-slate-450 hover:text-white"
                    onClick={() => setIsOnboardOpen(false)}
                    disabled={onboardMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    disabled={onboardMutation.isPending}
                  >
                    {onboardMutation.isPending ? 'Onboarding...' : 'Confirm Onboard'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search vendors by name or email..." 
            className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Revenue Generated</TableHead>
              <TableHead>Delivery Success</TableHead>
              <TableHead>RTO Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Loading vendor intelligence data...
                </TableCell>
              </TableRow>
            ) : filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No vendors found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor: any, index: number) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.contactEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{vendor.totalOrders.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-green-600 dark:text-green-500">
                    ₹{vendor.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 max-w-[60px]">
                        <div 
                          className={`h-2 rounded-full ${vendor.deliverySuccessRate > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                          style={{ width: `${Math.min(vendor.deliverySuccessRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{vendor.deliverySuccessRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.returnRate > 5 ? "destructive" : "secondary"} className="font-mono">
                      {vendor.returnRate}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vendor.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Blocked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {vendor.isActive ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm(`Are you sure you want to block ${vendor.name}? They will lose access to the platform immediately.`)) {
                            toggleStatusMutation.mutate({ id: vendor.id, isActive: false });
                          }
                        }}
                        disabled={toggleStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Block
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => toggleStatusMutation.mutate({ id: vendor.id, isActive: true })}
                        disabled={toggleStatusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Unblock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
