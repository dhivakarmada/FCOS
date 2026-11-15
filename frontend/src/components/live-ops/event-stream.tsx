import { useLiveOpsStore, SystemEvent } from '@/store/live-ops-store';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, User, RotateCcw, AlertCircle, PlayCircle, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onEventClick: (event: SystemEvent) => void;
}

export function EventStream({ onEventClick }: Props) {
  const { events, filters } = useLiveOpsStore();
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);

  // Filter events based on active filters
  const filteredEvents = events.filter((e) => {
    // Category filter
    if (!filters.categories.includes(e.category)) return false;
    
    // Anomaly filter
    if (filters.showOnlyAnomalies && e.severity !== 'WARNING' && e.severity !== 'CRITICAL') return false;

    // Search filter
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (
        !e.type.toLowerCase().includes(s) &&
        !e.entityId?.toLowerCase().includes(s) &&
        !e.vendorId?.toLowerCase().includes(s) &&
        !e.message.toLowerCase().includes(s)
      ) {
        return false;
      }
    }

    return true;
  });

  // Limit rendering to top 200 to keep DOM extremely fast
  const displayEvents = filteredEvents.slice(0, 200);

  const getIcon = (category: string) => {
    switch (category) {
      case 'ORDER': return <Package className="w-4 h-4" />;
      case 'INVENTORY': return <Box className="w-4 h-4" />; // Assume Box or Package
      case 'STAFF': return <User className="w-4 h-4" />;
      case 'RETURN': return <RotateCcw className="w-4 h-4" />;
      case 'SYSTEM': return <AlertCircle className="w-4 h-4" />;
      default: return <PlayCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ORDER': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'INVENTORY': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'STAFF': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'RETURN': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (displayEvents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-[500px]">
        <Clock className="w-8 h-8 mb-4 opacity-50" />
        <p>Waiting for live events...</p>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar" 
      ref={streamRef}
      onScroll={() => {
        // If user scrolls down, disable auto-scroll
        if (streamRef.current) {
          const isAtTop = streamRef.current.scrollTop === 0;
          setIsAutoScroll(isAtTop);
        }
      }}
    >
      {!isAutoScroll && (
        <div className="sticky top-0 z-10 flex justify-center pb-2">
          <Badge 
            className="cursor-pointer bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20"
            onClick={() => {
              setIsAutoScroll(true);
              streamRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Resume Live Scroll
          </Badge>
        </div>
      )}

      {displayEvents.map((event) => {
        const time = new Date(event.timestamp);
        
        return (
          <div 
            key={event.id}
            onClick={() => onEventClick(event)}
            className="group flex gap-4 p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all border border-transparent hover:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Timeline Line */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getCategoryColor(event.category)}`}>
                {getIcon(event.category)}
              </div>
              <div className="w-px h-full bg-slate-800 group-last:hidden" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">
                    {time.toLocaleTimeString()}
                  </span>
                  <Badge variant="outline" className={`h-5 px-1.5 text-[10px] uppercase tracking-wider ${getCategoryColor(event.category)}`}>
                    {event.type.replace(/-/g, ' ')}
                  </Badge>
                  {event.severity === 'WARNING' && <Badge className="bg-amber-500/20 text-amber-500 h-5 px-1.5 text-[10px] border-amber-500/20">WARN</Badge>}
                  {event.severity === 'CRITICAL' && <Badge className="bg-rose-500/20 text-rose-500 h-5 px-1.5 text-[10px] animate-pulse border-rose-500/20">CRIT</Badge>}
                </div>
                {event.entityId && (
                  <span className="text-xs font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {event.entityId}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                {event.message}
              </p>
              
              {event.actor && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> {event.actor}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Box(props: any) {
  return <Package {...props} />; // Quick fallback if Box isn't exported from lucide-react directly
}
