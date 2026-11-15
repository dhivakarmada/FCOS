'use client';

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  Package,
  ShoppingCart,
  Warehouse as WarehouseIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isSearchOpen, setSearchOpen]);

  const runCommand = (command: () => void) => {
    setSearchOpen(false);
    command();
  };

  return (
    <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/orders'))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Search Orders</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/inventory'))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Search Inventory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/warehouse'))}>
            <WarehouseIcon className="mr-2 h-4 w-4" />
            <span>Warehouse Maps</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
