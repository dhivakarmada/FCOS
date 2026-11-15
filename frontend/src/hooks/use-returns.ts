import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useReturns = (filters: any = {}) => {
  const queryClient = useQueryClient();

  const returnsQuery = useQuery({
    queryKey: ['returns', filters],
    queryFn: async () => {
      const { data } = await api.get('/returns', { params: filters });
      return data;
    },
  });

  const requestReturn = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data } = await api.post(`/returns`, { orderId, reason });
      return data;
    },
    onSuccess: () => {
      toast.success('Return request submitted');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const approveReturn = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/returns/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      toast.success('Return approved & stock restored');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const rejectReturn = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/returns/${id}/reject`);
      return data;
    },
    onSuccess: () => {
      toast.success('Return rejected');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  const refundReturn = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/returns/${id}/refund`);
      return data;
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  return {
    returns: returnsQuery.data,
    isLoading: returnsQuery.isLoading,
    refetch: returnsQuery.refetch,
    isFetching: returnsQuery.isFetching,
    requestReturn,
    approveReturn,
    rejectReturn,
    refundReturn,
  };
};
