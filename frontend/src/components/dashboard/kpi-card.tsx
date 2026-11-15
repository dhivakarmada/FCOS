'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  className?: string;
  iconClassName?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconClassName,
}: KPICardProps) {
  return (
    <Card className={cn("border border-slate-100 shadow-none overflow-hidden group hover:border-slate-300 transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn(
              "p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500",
              iconClassName
            )}>
              <Icon className="w-5 h-5" />
            </div>
            {trend && trend.value > 0 && (
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                trend.isUp 
                  ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                  : "text-rose-600 bg-rose-50 border-rose-100"
              )}>
                {trend.isUp ? '+' : '-'}{trend.value}%
              </span>
            )}
          </div>
          
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              {title}
            </p>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 tabular-nums">
              {value}
            </h2>
            {description && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
