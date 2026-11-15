'use client';

import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  ShoppingCart, 
  Truck, 
  RotateCcw, 
  BarChart3, 
  Users, 
  Bell, 
  Settings,
  LogOut,
  Building2,
  Activity,
  Server,
  ShieldAlert,
  ScanBarcode,
  PlayCircle,
  Radio,
  CreditCard,
  Cpu,
  Key,
  Blocks,
  LifeBuoy,
  Sparkles,
  Trophy,
  Code
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

const items = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Control Room", icon: Radio, url: "/dashboard/control-room" },
  { title: "Operations", icon: ScanBarcode, url: "/dashboard/operations" },
  { title: "Execution", icon: PlayCircle, url: "/dashboard/execution" },
  { title: "Inventory", icon: Package, url: "/dashboard/inventory" },
  { title: "Warehouse", icon: Warehouse, url: "/dashboard/warehouse" },
  { title: "Orders", icon: ShoppingCart, url: "/dashboard/orders" },
  { title: "Shipping", icon: Truck, url: "/dashboard/shipping" },
  { title: "Returns", icon: RotateCcw, url: "/dashboard/returns" },
  { title: "Analytics", icon: BarChart3, url: "/dashboard/analytics" },
  { title: "Staff", icon: Users, url: "/dashboard/staff" },
  { title: "Performance", icon: Trophy, url: "/dashboard/performance" },
  { title: "System", icon: Server, url: "/dashboard/system" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings" },
];

const systemItems = [
  { title: "Settings", icon: Settings, url: "/dashboard/settings" },
];

const superAdminItems = [
  { title: "Control Tower", icon: Activity, url: "/dashboard/super-admin" },
  { title: "User Management", icon: Users, url: "/dashboard/super-admin/users" },
  { title: "Live Ops", icon: Radio, url: "/dashboard/super-admin/live-ops" },
  { title: "System Health", icon: Server, url: "/dashboard/super-admin/system" },
  { title: "Vendors", icon: Building2, url: "/dashboard/super-admin/vendors" },
  { title: "Audit & Security", icon: ShieldAlert, url: "/dashboard/super-admin/audit" },
  { title: "Billing & Finance", icon: CreditCard, url: "/dashboard/super-admin/billing" },
  { title: "Notifications", icon: Bell, url: "/dashboard/super-admin/notifications" },
  { title: "Automation Rules", icon: Cpu, url: "/dashboard/super-admin/automation" },
  { title: "RBAC & Permissions", icon: Key, url: "/dashboard/super-admin/permissions" },
  { title: "Integrations", icon: Blocks, url: "/dashboard/super-admin/integrations" },
  { title: "Support & Tickets", icon: LifeBuoy, url: "/dashboard/super-admin/support" },
  { title: "AI Insights", icon: Sparkles, url: "/dashboard/super-admin/ai-insights" },
];

const managerItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard/warehouse" },
  { title: "Orders Manager", icon: ShoppingCart, url: "/dashboard/orders" },
  { title: "Picking Ops", icon: ScanBarcode, url: "/dashboard/warehouse/picking" },
  { title: "Packing Ops", icon: Package, url: "/dashboard/warehouse/packing" },
  { title: "QC Ops", icon: ShieldAlert, url: "/dashboard/warehouse/qc" },
  { title: "Dispatch & Ship", icon: Truck, url: "/dashboard/warehouse/dispatch" },
  { title: "Inventory Master", icon: Package, url: "/dashboard/inventory" },
  { title: "Facility Map", icon: Warehouse, url: "/dashboard/warehouse/monitoring" },
  { title: "Workforce", icon: Users, url: "/dashboard/warehouse/staff" },
  { title: "Task Boards", icon: Radio, url: "/dashboard/warehouse/tasks" },
  { title: "Returns Desk", icon: RotateCcw, url: "/dashboard/returns" },
  { title: "Ops Analytics", icon: BarChart3, url: "/dashboard/warehouse/analytics" },
  { title: "Shift Planner", icon: PlayCircle, url: "/dashboard/warehouse/shifts" },
  { title: "Facility Alerts", icon: Bell, url: "/dashboard/warehouse/notifications" },
  { title: "Escalations", icon: ShieldAlert, url: "/dashboard/warehouse/escalations" },
  { title: "Export Reports", icon: BarChart3, url: "/dashboard/warehouse/reports" },
  { title: "Audit Trail", icon: Activity, url: "/dashboard/warehouse/audit" },
  { title: "Facility Settings", icon: Settings, url: "/dashboard/warehouse/settings" },
  { title: "System", icon: Cpu, url: "/dashboard/warehouse/system" },
];

const vendorItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Products Catalog", icon: Building2, url: "/dashboard/vendor/products" },
  { title: "Inventory Master", icon: Package, url: "/dashboard/inventory" },
  { title: "Orders Manager", icon: ShoppingCart, url: "/dashboard/orders" },
  { title: "Returns Desk", icon: RotateCcw, url: "/dashboard/returns" },
  { title: "Shipment Tracking", icon: Truck, url: "/dashboard/shipping" },
  { title: "Business BI", icon: BarChart3, url: "/dashboard/analytics" },
  { title: "Billing & Finance", icon: CreditCard, url: "/dashboard/vendor/billing" },
  { title: "Warehouse Map", icon: Warehouse, url: "/dashboard/vendor/warehouses" },
  { title: "Brand Alerts", icon: Bell, url: "/dashboard/vendor/notifications" },
  { title: "Support Tickets", icon: LifeBuoy, url: "/dashboard/vendor/support" },
  { title: "Brand Settings", icon: Settings, url: "/dashboard/vendor/settings" },
  { title: "Channel Sync", icon: Blocks, url: "/dashboard/vendor/integrations" },
  { title: "Order Sources", icon: Radio, url: "/dashboard/vendor/order-sources" },
  { title: "Import Center", icon: ScanBarcode, url: "/dashboard/vendor/imports" },
  { title: "Developer Center", icon: Code, url: "/dashboard/vendor/developer" },
  { title: "Export Reports", icon: BarChart3, url: "/dashboard/vendor/reports" },
  { title: "Activity Audit", icon: Activity, url: "/dashboard/vendor/audit" },
  { title: "Team Management", icon: Users, url: "/dashboard/vendor/profile" },
  { title: "System", icon: Cpu, url: "/dashboard/vendor/system" },
];

const staffItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  { title: "My Tasks", icon: PlayCircle, url: "/dashboard/execution" },
  { title: "Picking", icon: ScanBarcode, url: "/dashboard/execution/picking" },
  { title: "Packing", icon: Package, url: "/dashboard/execution/packing" },
  { title: "QC Verification", icon: ShieldAlert, url: "/dashboard/execution/qc" },
  { title: "Dispatch", icon: Truck, url: "/dashboard/execution/dispatch" },
  { title: "Inventory Ops", icon: Warehouse, url: "/dashboard/execution/inventory" },
  { title: "Returns Desk", icon: RotateCcw, url: "/dashboard/execution/returns" },
  { title: "Scanner", icon: Radio, url: "/dashboard/execution/scanner" },
  { title: "Alerts Log", icon: Bell, url: "/dashboard/execution/notifications" },
  { title: "Report Issue", icon: ShieldAlert, url: "/dashboard/execution/issues" },
  { title: "Shift & Clock", icon: Activity, url: "/dashboard/execution/shifts" },
  { title: "My Performance", icon: BarChart3, url: "/dashboard/execution/performance" },
  { title: "Settings", icon: Settings, url: "/dashboard/execution/profile" },
  { title: "System", icon: Cpu, url: "/dashboard/execution/system" },
  { title: "System Settings", icon: Settings, url: "/dashboard/execution/system-settings" },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 font-extrabold text-2xl tracking-tighter text-primary">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">FCOS</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {(() => {
                const role = user?.role;
                const designation = user?.designation?.toUpperCase() || '';
                
                let sidebarItems = items;
                if (role === 'WAREHOUSE_MANAGER') {
                  sidebarItems = managerItems;
                } else if (role === 'VENDOR_ADMIN') {
                  sidebarItems = vendorItems;
                } else if (role === 'STAFF') {
                  sidebarItems = staffItems.filter((item) => {
                    const coreTitles = [
                      "Dashboard", "My Tasks", "Scanner", "Alerts Log", 
                      "Report Issue", "Shift & Clock", "My Performance", 
                      "Settings", "System", "System Settings"
                    ];
                    if (coreTitles.includes(item.title)) return true;
                    
                    if (designation.includes('PICK')) {
                      return item.title === 'Picking';
                    }
                    if (designation.includes('PACK')) {
                      return item.title === 'Packing';
                    }
                    if (designation.includes('QC') || designation.includes('AUDIT')) {
                      return item.title === 'QC Verification';
                    }
                    if (designation.includes('DISPATCH') || designation.includes('SHIP')) {
                      return item.title === 'Dispatch';
                    }
                    if (designation.includes('INVENTORY') || designation.includes('STOCK')) {
                      return item.title === 'Inventory Ops';
                    }
                    if (designation.includes('RETURN')) {
                      return item.title === 'Returns Desk';
                    }
                    
                    return true;
                  });
                }

                return sidebarItems.map((item) => {
                  const itemUrl = item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === itemUrl || (itemUrl !== '/dashboard' && pathname.startsWith(itemUrl + '/'))}
                        tooltip={item.title}
                        className="h-10 px-3 rounded-xl transition-all duration-200"
                      >
                        <Link href={itemUrl} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                });
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {user?.role !== 'SUPER_ADMIN' && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-10 px-3 rounded-xl transition-all duration-200"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-semibold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.role === 'SUPER_ADMIN' && (
          <SidebarGroup className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                      tooltip={item.title}
                      className="h-10 px-3 rounded-xl transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-semibold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              tooltip="Logout"
              className="h-10 px-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
