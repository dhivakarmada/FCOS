'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  LayoutDashboard,
  Warehouse,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const router = useRouter();
  const { user } = useAuthStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['global-search', search],
    queryFn: async () => {
      if (search.length < 2) return null;
      const res = await api.get(`/analytics/search?q=${encodeURIComponent(search)}`);
      return res.data;
    },
    enabled: search.length >= 2,
  });

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search for orders, vendors, SKUs, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? 'Searching across system...' : search.length < 2 ? 'Type at least 2 characters to search...' : 'No results found.'}
        </CommandEmpty>

        {/* Global Search Results */}
        {searchResults?.orders?.length > 0 && (
          <CommandGroup heading="Orders">
            {searchResults.orders.map((order: any) => (
              <CommandItem key={order.id} onSelect={() => runCommand(() => router.push(`/dashboard/orders/${order.id}`))}>
                <ShoppingCart className="mr-2 h-4 w-4 text-blue-500" />
                <span>{order.orderNumber} - {order.customerName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults?.products?.length > 0 && (
          <CommandGroup heading="Products & SKUs">
            {searchResults.products.map((product: any) => (
              <CommandItem key={product.id} onSelect={() => runCommand(() => router.push(`/dashboard/inventory/${product.id}`))}>
                <Package className="mr-2 h-4 w-4 text-orange-500" />
                <span>[{product.sku}] {product.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {user?.role === 'SUPER_ADMIN' && searchResults?.vendors?.length > 0 && (
          <CommandGroup heading="Merchants & Vendors">
            {searchResults.vendors.map((vendor: any) => (
              <CommandItem key={vendor.id} onSelect={() => runCommand(() => router.push(`/dashboard/super-admin/vendors?search=${encodeURIComponent(vendor.name)}`))}>
                <Warehouse className="mr-2 h-4 w-4 text-green-500" />
                <span>{vendor.name} ({vendor.contactEmail})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults?.warehouses?.length > 0 && (
          <CommandGroup heading="Facilities">
            {searchResults.warehouses.map((warehouse: any) => (
              <CommandItem key={warehouse.id} onSelect={() => runCommand(() => router.push(`/dashboard/warehouse/${warehouse.id}`))}>
                <Truck className="mr-2 h-4 w-4 text-indigo-500" />
                <span>{warehouse.name} ({warehouse.location})</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        
        {/* Default Navigation Commands */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/orders'))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Go to Orders</span>
          </CommandItem>
          {user?.role === 'SUPER_ADMIN' && (
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/super-admin'))}>
              <User className="mr-2 h-4 w-4 text-red-500" />
              <span>Go to Control Tower</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
