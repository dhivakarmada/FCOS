import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useVendors = () => {
  const queryClient = useQueryClient();

  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await api.get('/vendors');
      return data;
    },
  });

  const createVendor = useMutation({
    mutationFn: async (vendorData: any) => {
      const { data } = await api.post('/vendors', vendorData);
      return data;
    },
    onSuccess: () => {
      toast.success('Vendor onboarded successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });

  return {
    vendors: vendorsQuery.data,
    isLoading: vendorsQuery.isLoading,
    createVendor,
  };
};
