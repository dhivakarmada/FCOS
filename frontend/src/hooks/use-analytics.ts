import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAnalyticsStore } from '@/store/analytics-store';

export function useAnalytics() {
  const { period, vendorId } = useAnalyticsStore();

  const getParams = (baseParams: any = {}) => {
    if (vendorId) return { ...baseParams, vendorId };
    return baseParams;
  };

  const getDashboardStats = useQuery({
    queryKey: ['analytics', 'dashboard', vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard', { params: getParams() });
      return data;
    },
  });

  const getRevenueStats = useQuery({
    queryKey: ['analytics', 'revenue', period, vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/revenue', { params: getParams({ period }) });
      return data;
    },
  });

  const getDeliveryStats = useQuery({
    queryKey: ['analytics', 'delivery', vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/delivery', { params: getParams() });
      return data;
    },
  });

  const getReturnStats = useQuery({
    queryKey: ['analytics', 'returns', vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/returns', { params: getParams() });
      return data;
    },
  });

  const getStaffPerformance = useQuery({
    queryKey: ['analytics', 'staff', vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/performance', { params: getParams() });
      return data;
    },
  });

  const getPredictions = useQuery({
    queryKey: ['analytics', 'predictions', vendorId],
    queryFn: async () => {
      const { data } = await api.get('/analytics/predictions', { params: getParams() });
      return data;
    },
  });

  const isLoading = 
    getDashboardStats.isLoading || 
    getRevenueStats.isLoading || 
    getDeliveryStats.isLoading || 
    getReturnStats.isLoading || 
    getStaffPerformance.isLoading ||
    getPredictions.isLoading;

  return {
    dashboard: getDashboardStats.data,
    revenue: getRevenueStats.data,
    delivery: getDeliveryStats.data,
    returns: getReturnStats.data,
    performance: getStaffPerformance.data,
    predictions: getPredictions.data,
    isLoading,
  };
}
