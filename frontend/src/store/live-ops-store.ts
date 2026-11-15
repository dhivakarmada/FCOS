import { create } from 'zustand';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
export type EventCategory = 'ORDER' | 'INVENTORY' | 'STAFF' | 'SYSTEM' | 'RETURN';

export interface SystemEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  type: string;
  message: string;
  severity: EventSeverity;
  vendorId?: string;
  entityId?: string;
  actor?: string;
  payload: any;
}

export interface LiveOpsMetrics {
  eventsPerMinute: number;
  ordersPerMinute: number;
  returnsPerMinute: number;
  anomaliesDetected: number;
}

export interface AnomalyAlert {
  id: string;
  timestamp: number;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
}

interface LiveOpsState {
  events: SystemEvent[];
  maxEvents: number;
  filters: {
    categories: EventCategory[];
    search: string;
    showOnlyAnomalies: boolean;
  };
  metrics: LiveOpsMetrics;
  anomalies: AnomalyAlert[];
  
  // Actions
  ingestEvent: (event: Omit<SystemEvent, 'id' | 'timestamp'>) => void;
  setFilters: (filters: Partial<LiveOpsState['filters']>) => void;
  clearEvents: () => void;
  dismissAnomaly: (id: string) => void;
}

const MAX_WINDOW_EVENTS = 1000;
const METRICS_WINDOW_MS = 60 * 1000; // 1 minute

export const useLiveOpsStore = create<LiveOpsState>((set, get) => ({
  events: [],
  maxEvents: MAX_WINDOW_EVENTS,
  filters: {
    categories: ['ORDER', 'INVENTORY', 'STAFF', 'SYSTEM', 'RETURN'],
    search: '',
    showOnlyAnomalies: false,
  },
  metrics: {
    eventsPerMinute: 0,
    ordersPerMinute: 0,
    returnsPerMinute: 0,
    anomaliesDetected: 0,
  },
  anomalies: [],

  ingestEvent: (newEvent) => {
    const timestamp = Date.now();
    const id = `evt_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    
    const event: SystemEvent = {
      ...newEvent,
      id,
      timestamp,
    };

    set((state) => {
      // 1. Sliding window insertion (newest first)
      const newEvents = [event, ...state.events].slice(0, state.maxEvents);
      
      // 2. Metrics calculation (Trailing 1 minute)
      const oneMinuteAgo = timestamp - METRICS_WINDOW_MS;
      const windowEvents = newEvents.filter(e => e.timestamp >= oneMinuteAgo);
      
      const ordersPerMinute = windowEvents.filter(e => e.category === 'ORDER').length;
      const returnsPerMinute = windowEvents.filter(e => e.category === 'RETURN').length;
      
      const metrics: LiveOpsMetrics = {
        eventsPerMinute: windowEvents.length,
        ordersPerMinute,
        returnsPerMinute,
        anomaliesDetected: state.metrics.anomaliesDetected,
      };

      // 3. Simple Anomaly Detection
      const newAnomalies = [...state.anomalies];
      
      if (returnsPerMinute >= 3 && !state.anomalies.some(a => a.message.includes('Spike in returns'))) {
        newAnomalies.push({
          id: `anm_${timestamp}`,
          timestamp,
          severity: 'WARNING',
          message: `Spike in returns detected: ${returnsPerMinute} in the last minute.`,
        });
        metrics.anomaliesDetected++;
      }

      if (ordersPerMinute >= 50 && !state.anomalies.some(a => a.message.includes('High order velocity'))) {
        newAnomalies.push({
          id: `anm_${timestamp}`,
          timestamp,
          severity: 'WARNING',
          message: `High order velocity: ${ordersPerMinute} orders/min.`,
        });
      }

      return {
        events: newEvents,
        metrics,
        anomalies: newAnomalies,
      };
    });
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },

  dismissAnomaly: (id) => {
    set((state) => ({
      anomalies: state.anomalies.filter(a => a.id !== id)
    }));
  }
}));
