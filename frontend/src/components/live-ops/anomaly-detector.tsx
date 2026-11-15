import { useLiveOpsStore } from '@/store/live-ops-store';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnomalyDetector() {
  const { anomalies, dismissAnomaly } = useLiveOpsStore();

  if (anomalies.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {anomalies.map((anomaly) => (
        <Alert 
          key={anomaly.id} 
          variant={anomaly.severity === 'CRITICAL' ? 'destructive' : 'default'}
          className={`relative border-l-4 ${
            anomaly.severity === 'CRITICAL' 
              ? 'bg-rose-50 border-l-rose-600 text-rose-900 border-t-0 border-r-0 border-b-0' 
              : anomaly.severity === 'WARNING'
                ? 'bg-amber-50 border-l-amber-500 text-amber-900 border-t-0 border-r-0 border-b-0'
                : 'bg-blue-50 border-l-blue-500 text-blue-900 border-t-0 border-r-0 border-b-0'
          }`}
        >
          <div className="flex items-start gap-3">
            {anomaly.severity === 'CRITICAL' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            ) : anomaly.severity === 'WARNING' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle className="font-bold tracking-tight">
                {anomaly.severity} DETECTED
              </AlertTitle>
              <AlertDescription className="font-medium opacity-90">
                {anomaly.message}
              </AlertDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 -mt-1 -mr-1 hover:bg-black/5"
              onClick={() => dismissAnomaly(anomaly.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
