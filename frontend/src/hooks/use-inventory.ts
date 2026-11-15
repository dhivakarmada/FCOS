import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useInventory = (filters: any = {}) => {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory/products', { params: filters });
      return data;
    },
  });

  const updateStock = useMutation({
    mutationFn: async (stockData: any) => {
      const { data } = await api.post('/inventory/stock/update', stockData);
      return data;
    },
    // Optimistic Update
    onMutate: async (newStock) => {
      await queryClient.cancelQueries({ queryKey: ['inventory'] });
      const previousInventory = queryClient.getQueryData(['inventory', filters]);
      
      queryClient.setQueryData(['inventory', filters], (old: any) => {
        // Find and update the specific product/item in the cache
        return old?.map((product: any) => {
          if (product.id === newStock.productId) {
            return {
              ...product,
              inventory: product.inventory.map((item: any) => {
                if (item.warehouseId === newStock.warehouseId && item.binId === newStock.binId) {
                  return { ...item, quantity: item.quantity + newStock.change };
                }
                return item;
              })
            };
          }
          return product;
        });
      });

      return { previousInventory };
    },
    onError: (err, newStock, context: any) => {
      queryClient.setQueryData(['inventory', filters], context.previousInventory);
      toast.error('Failed to update stock');
    },
    onSuccess: () => {
      toast.success('Stock updated');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    },
  });

  const createProduct = useMutation({
    mutationFn: async (productData: any) => {
      const { data } = await api.post('/inventory/products', productData);
      return data;
    },
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product');
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: responseData } = await api.put(`/inventory/products/${id}`, data);
      return responseData;
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const scanIn = useMutation({
    mutationFn: async (data: { barcode: string; quantity: number; warehouseId: string; binId: string; reason?: string }) => {
      const { data: responseData } = await api.post('/inventory/scan-in', data);
      return responseData;
    },
    onSuccess: () => {
      toast.success('Stock inbounded successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to scan inbound');
    }
  });

  const scanOut = useMutation({
    mutationFn: async (data: { barcode: string; quantity: number; orderId: string }) => {
      const { data: responseData } = await api.post('/inventory/scan-out', data);
      return responseData;
    },
    onSuccess: (data) => {
      toast.success(`Picked ${data.product.sku} for order`);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to scan outbound');
    }
  });

  const transferStock = useMutation({
    mutationFn: async (transferData: any) => {
      const { data } = await api.post('/inventory/stock/transfer', transferData);
      return data;
    },
    onSuccess: () => {
      toast.success('Stock transferred successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to transfer stock');
    }
  });

  return {
    products: Array.isArray(inventoryQuery.data) ? inventoryQuery.data : (inventoryQuery.data?.products || []),
    isLoading: inventoryQuery.isLoading,
    updateStock,
    transferStock,
    createProduct,
    updateProduct,
    deleteProduct,
    scanIn,
    scanOut,
  };
};
