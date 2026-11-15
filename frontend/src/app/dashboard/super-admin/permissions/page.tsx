'use client';

import { useState, useEffect } from "react";
import { 
  Key, ShieldCheck, Plus, Check, Save,
  Lock, Trash2, RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface RolePermissionMap {
  [role: string]: {
    [permission: string]: boolean;
  };
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();

  // Local state initialized from query data
  const [roles, setRoles] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<RolePermissionMap>({});
  const [isCustomMap, setIsCustomMap] = useState<Record<string, boolean>>({});

  // Custom role creator input
  const [newRoleName, setNewRoleName] = useState("");

  // Queries
  const { data: rawRoles = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: async () => {
      const res = await api.get("/rbac/roles");
      return res.data;
    }
  });

  // Sync query data with local state
  useEffect(() => {
    if (rawRoles.length > 0) {
      const newRolesList: string[] = [];
      const newMatrix: RolePermissionMap = {};
      const newCustomMap: Record<string, boolean> = {};

      rawRoles.forEach((r: any) => {
        newRolesList.push(r.roleName);
        newMatrix[r.roleName] = r.permissions as Record<string, boolean>;
        newCustomMap[r.roleName] = r.isCustom;
      });

      setRoles(newRolesList);
      setMatrix(newMatrix);
      setIsCustomMap(newCustomMap);
    }
  }, [rawRoles]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (roleName: string) => {
      const res = await api.post("/rbac/roles", { roleName });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role created with default scopes");
      setNewRoleName("");
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create role");
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleName: string) => {
      const res = await api.delete(`/rbac/roles/${roleName}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Custom role deleted");
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete role");
    }
  });

  const savePoliciesMutation = useMutation({
    mutationFn: async (policies: RolePermissionMap) => {
      const res = await api.post("/rbac/policies/save", { policies });
      return res.data;
    },
    onSuccess: () => {
      toast.success("RBAC permission matrix saved successfully");
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save policies");
    }
  });

  // Permission groups
  const permissionGroups = [
    {
      name: "Orders Management",
      nodes: ["orders.read", "orders.create", "orders.update", "orders.override", "orders.split"]
    },
    {
      name: "Inventory Controls",
      nodes: ["inventory.read", "inventory.adjust", "inventory.transfer", "inventory.sync"]
    },
    {
      name: "Workforce & Staff",
      nodes: ["staff.read", "staff.assign", "staff.monitor", "staff.schedule"]
    },
    {
      name: "Finance & Billing",
      nodes: ["billing.read", "billing.manage", "billing.export"]
    },
    {
      name: "System Settings",
      nodes: ["system.monitor", "system.settings", "system.logs"]
    }
  ];

  const handleCheckboxToggle = (role: string, node: string) => {
    setMatrix(prev => {
      const nextMap = { ...prev };
      nextMap[role] = {
        ...nextMap[role],
        [node]: !nextMap[role]?.[node]
      };
      return nextMap;
    });
  };

  const handleSaveMatrix = () => {
    savePoliciesMutation.mutate(matrix);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    createRoleMutation.mutate(newRoleName);
  };

  const handleDeleteRole = (roleName: string) => {
    deleteRoleMutation.mutate(roleName);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Permission scopes refreshed");
  };

  const isSaving = savePoliciesMutation.isPending;
  const isRefreshing = isFetching;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading RBAC permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Key className="w-8 h-8 text-rose-500" />
            RBAC & Role Security
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Configure granular security permissions, manage warehouse levels, and authorize tenant feature access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-800">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button 
            onClick={handleSaveMatrix} 
            disabled={isSaving}
            className="h-9 gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold border-none"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Policies"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Permission Grid Matrix (ColSpan 3) */}
        <Card className="lg:col-span-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Security Matrix</CardTitle>
              <CardDescription>Grant specific function nodes to user roles.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3">
              IAM Engine active
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-slate-500 dark:text-slate-400 font-bold w-1/3">Permission Nodes</th>
                    {roles.map(role => (
                      <th key={role} className="p-4 text-slate-500 dark:text-slate-400 font-bold text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-[10px]">{role}</span>
                          {isCustomMap[role] && (
                            <button 
                              onClick={() => handleDeleteRole(role)}
                              className="text-[9px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5 mt-0.5 border border-transparent bg-transparent"
                              disabled={deleteRoleMutation.isPending}
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {permissionGroups.map(group => (
                    <tr key={group.name} className="contents">
                      {/* Group Header Row */}
                      <tr className="bg-slate-50/50 dark:bg-slate-950/30 font-bold text-slate-600 dark:text-slate-350">
                        <td colSpan={roles.length + 1} className="p-3 text-[10px] uppercase tracking-wider pl-4">
                          {group.name}
                        </td>
                      </tr>
                      {group.nodes.map(node => (
                        <tr key={node} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-3 pl-6 font-mono text-slate-600 dark:text-slate-300 font-medium">
                            {node}
                          </td>
                          {roles.map(role => {
                            const isGranted = matrix[role]?.[node] || false;
                            const isSuper = role === "SUPER_ADMIN";
                            return (
                              <td key={role} className="p-3 text-center">
                                <button
                                  type="button"
                                  disabled={isSuper} // Super Admin has permanent scopes
                                  onClick={() => handleCheckboxToggle(role, node)}
                                  className={`mx-auto w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                    isGranted 
                                      ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" 
                                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-350 dark:text-slate-700"
                                  } ${isSuper ? "opacity-60 cursor-not-allowed bg-rose-500/5" : ""}`}
                                >
                                  {isGranted && <Check className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Roles Panel */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" /> Create Custom Role
              </CardTitle>
              <CardDescription>Extend standard profiles for specific teams.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405">Role Name</label>
                  <Input 
                    placeholder="e.g. Lead Dispatcher"
                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg text-xs"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 border-none"
                  disabled={createRoleMutation.isPending}
                >
                  Add Role Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur shadow-sm text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" /> Warehouse Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400">
                Staff users are automatically locked to the warehouse they are scheduled to work in.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-650 dark:text-slate-350">Cross-Dock View</span>
                  <Badge variant="outline" className="text-[8px] bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-500 dark:text-rose-450 font-bold">SUPER_ADMIN ONLY</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-650 dark:text-slate-350">Cycle Count Adjustments</span>
                  <Badge variant="outline" className="text-[8px] bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-500 dark:text-amber-450 font-bold">MANAGER SCOPE</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
