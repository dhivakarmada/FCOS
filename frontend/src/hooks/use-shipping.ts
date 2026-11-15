import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useShipping = () => {
  const queryClient = useQueryClient();

  const shipmentsQuery = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      // For now, we fetch orders and filter/map them to shipments
      const { data } = await api.get('/orders');
      return data;
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.get(`/shipping/${orderId}/calculate`);
      return data;
    },
  });

  const assignCourierMutation = useMutation({
    mutationFn: async ({ orderId, courierName }: { orderId: string; courierName: string }) => {
      const { data } = await api.post(`/shipping/${orderId}/assign-courier`, { courierName });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Courier assigned successfully');
    },
  });

  const generateLabelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/shipping/${orderId}/generate-label`);
      return data;
    },
    onSuccess: () => {
      toast.success('Shipping label generation queued');
    },
  });

  const trackQuery = (orderId: string | null) => useQuery({
    queryKey: ['track', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await api.get(`/shipping/${orderId}/track`);
      return data;
    },
    enabled: !!orderId,
  });

  return {
    shipments: shipmentsQuery.data?.orders || [],
    isLoading: shipmentsQuery.isLoading,
    calculate: calculateMutation,
    assignCourier: assignCourierMutation,
    generateLabel: generateLabelMutation,
    track: trackQuery,
  };
};
