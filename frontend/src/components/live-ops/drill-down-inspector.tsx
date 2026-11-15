import { SystemEvent } from '@/store/live-ops-store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, Box, Building2, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  event: SystemEvent | null;
  onClose: () => void;
}

export function DrillDownInspector({ event, onClose }: Props) {
  if (!event) return null;

  const date = new Date(event.timestamp);

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-slate-950 border-slate-800 text-slate-300 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className={`border-none ${
              event.category === 'ORDER' ? 'bg-blue-500/20 text-blue-400' :
              event.category === 'INVENTORY' ? 'bg-emerald-500/20 text-emerald-400' :
              event.category === 'STAFF' ? 'bg-purple-500/20 text-purple-400' :
              event.category === 'RETURN' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {event.category}
            </Badge>
            <Badge variant="outline" className="border-slate-700 text-slate-400 uppercase tracking-widest text-[10px]">
              {event.severity}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-white leading-tight">
            {event.type}
          </SheetTitle>
          <SheetDescription className="text-slate-400 mt-1">
            {event.message}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            
            {/* Metadata Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Timestamp
                </p>
                <p className="text-sm font-mono text-slate-200">
                  {date.toLocaleTimeString()} <span className="text-slate-500">{date.getMilliseconds()}ms</span>
                </p>
              </div>
              
              {event.entityId && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Box className="w-3 h-3" /> Entity ID
                  </p>
                  <p className="text-sm font-mono text-blue-400 break-all">{event.entityId}</p>
                </div>
              )}

              {event.vendorId && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Vendor ID
                  </p>
                  <p className="text-sm font-mono text-slate-200 break-all">{event.vendorId}</p>
                </div>
              )}

              {event.actor && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Actor
                  </p>
                  <p className="text-sm font-mono text-slate-200 break-all">{event.actor}</p>
                </div>
              )}
            </div>

            {/* Raw Payload Section */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Raw JSON Payload</p>
              <div className="bg-[#0D1117] rounded-xl p-4 overflow-x-auto border border-slate-800">
                <pre className="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap break-words">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
