import { create } from 'zustand';

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string | null;
  courierName: string | null;
  status: string;
  estimatedArrival: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  order: {
    orderNumber: string;
    customerName: string;
    city: string;
  };
}

interface ShippingState {
  selectedOrder: string | null;
  trackingOrder: string | null;
  filters: {
    search: string;
    status: string;
    courier: string;
  };
  setSelectedOrder: (id: string | null) => void;
  setTrackingOrder: (id: string | null) => void;
  setFilters: (filters: Partial<ShippingState['filters']>) => void;
}

export const useShippingStore = create<ShippingState>((set) => ({
  selectedOrder: null,
  trackingOrder: null,
  filters: {
    search: '',
    status: 'ALL',
    courier: 'ALL',
  },
  setSelectedOrder: (id) => set({ selectedOrder: id }),
  setTrackingOrder: (id) => set({ trackingOrder: id }),
  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters } 
  })),
}));
