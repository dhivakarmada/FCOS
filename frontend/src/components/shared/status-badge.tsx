'use client';

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusType = 
  | 'PENDING' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO' | 'NEUTRAL'
  | 'CREATED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusMap: Record<StatusType, { class: string; label: string }> = {
  PENDING: { class: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
  SUCCESS: { class: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400', label: 'Success' },
  WARNING: { class: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', label: 'Warning' },
  DANGER: { class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400', label: 'Danger' },
  INFO: { class: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', label: 'Info' },
  NEUTRAL: { class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400', label: 'Neutral' },
  
  CREATED: { class: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', label: 'Created' },
  PACKED: { class: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', label: 'Packed' },
  SHIPPED: { class: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', label: 'Shipped' },
  DELIVERED: { class: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400', label: 'Delivered' },
  RETURNED: { class: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400', label: 'Returned' },
  CANCELLED: { class: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400', label: 'Cancelled' },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.NEUTRAL;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider rounded-full border shadow-none",
        config.class,
        className
      )}
    >
      {label || config.label}
    </Badge>
  );
}
