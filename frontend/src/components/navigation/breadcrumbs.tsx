'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
      <Link 
        href="/dashboard" 
        className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-4 w-4 opacity-40" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {label}
              </span>
            ) : (
              <Link 
                href={href}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

