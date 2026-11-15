'use client';

import { useAuthStore, UserRole } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Restricted</h2>
            <p className="text-slate-500 font-medium mt-2">
              Your account level ({user.role}) does not have permission to access this sector of the Operating System.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="w-full h-12 rounded-2xl font-black bg-slate-900 hover:bg-slate-800"
          >
            RETURN TO CLEARANCE ZONE
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
