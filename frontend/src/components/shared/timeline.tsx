'use client';

import { Check, Clock, Truck, Package, PackageCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineStatus = 'CREATED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';

interface TimelineItem {
  status: TimelineStatus;
  title: string;
  description?: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusConfig: Record<TimelineStatus, { icon: any; color: string }> = {
  CREATED: { icon: Clock, color: 'bg-blue-500' },
  PACKED: { icon: Package, color: 'bg-purple-500' },
  SHIPPED: { icon: Truck, color: 'bg-orange-500' },
  OUT_FOR_DELIVERY: { icon: Truck, color: 'bg-yellow-500' },
  DELIVERED: { icon: PackageCheck, color: 'bg-green-500' },
  RETURNED: { icon: AlertCircle, color: 'bg-red-500' },
  CANCELLED: { icon: AlertCircle, color: 'bg-slate-500' },
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {items.map((item, index) => {
        const Config = statusConfig[item.status];
        const Icon = Config.icon;
        
        return (
          <div key={index} className="relative flex gap-4">
            {index !== items.length - 1 && (
              <span 
                className={cn(
                  "absolute left-[15px] top-[30px] h-[calc(100%-10px)] w-[2px]",
                  item.isCompleted ? "bg-primary" : "bg-muted"
                )} 
              />
            )}
            
            <div className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
              item.isCompleted ? "border-primary text-primary" : "border-muted text-muted-foreground",
              item.isCurrent && "scale-110 ring-4 ring-primary/20 border-primary"
            )}>
              {item.isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            <div className="flex flex-col gap-1 pb-4">
              <h4 className={cn(
                "text-sm font-semibold leading-none",
                item.isCurrent ? "text-primary" : "text-foreground"
              )}>
                {item.title}
              </h4>
              {item.description && (
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
              {item.timestamp && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {item.timestamp}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
