import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useWarehouse = (warehouseId?: string) => {
  const queryClient = useQueryClient();

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/warehouses');
      return data;
    },
  });

  const warehouseDetailsQuery = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return null;
      const { data } = await api.get(`/warehouses/${warehouseId}`);
      return data;
    },
    enabled: !!warehouseId,
  });

  const moveStock = useMutation({
    mutationFn: async ({ warehouseId, productId, fromBinId, toBinId, quantity }: any) => {
      const { data } = await api.post(`/warehouses/${warehouseId}/move-stock`, {
        productId,
        fromBinId,
        toBinId,
        quantity,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Stock transferred successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to move stock');
    }
  });

  return {
    warehouses: warehousesQuery.data,
    warehouse: warehouseDetailsQuery.data,
    isLoading: warehousesQuery.isLoading || warehouseDetailsQuery.isFetching,
    moveStock,
  };
};
