import { create } from 'zustand';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface AnalyticsState {
  period: TimePeriod;
  vendorId: string | null; // For super admins to filter, null = global/own
  setPeriod: (period: TimePeriod) => void;
  setVendorId: (vendorId: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  period: 'daily',
  vendorId: null,
  setPeriod: (period) => set({ period }),
  setVendorId: (vendorId) => set({ vendorId }),
}));
