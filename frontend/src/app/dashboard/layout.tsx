'use client';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { CommandPalette } from "@/components/search/command-palette";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useSocket } from "@/hooks/use-socket";
import { ErrorBoundary } from "@/components/common/error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useSocket();
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
    setMounted(true);
  }, [_hasHydrated, isAuthenticated, router]);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
        <CommandPalette />
      </SidebarInset>
    </SidebarProvider>
  );
}
