'use client';

import { useActivityStore } from '@/store/activity-store';
import { formatDistanceToNow } from 'date-fns';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  RotateCcw, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = {
  order: ShoppingCart,
  inventory: Package,
  shipping: Truck,
  return: RotateCcw,
  staff: AlertCircle,
};

const colors = {
  order: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  inventory: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  shipping: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  return: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  staff: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export function ActivityFeed() {
  const { activities } = useActivityStore();

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <LayoutDashboard className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => {
        const Icon = icons[activity.type] || Package;
        return (
          <div key={activity.id} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-24px] before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
            <div className={cn(
              "absolute left-0 top-0 h-6 w-6 rounded-full flex items-center justify-center z-10",
              colors[activity.type]
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activity.title}
                </h4>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activity.description}
              </p>
              {activity.status && (
                <div className="mt-1">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    activity.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {activity.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { LayoutDashboard } from 'lucide-react';
