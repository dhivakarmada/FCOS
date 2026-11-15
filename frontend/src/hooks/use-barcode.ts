import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export type BarcodeActionType = 'STOCK_IN' | 'STOCK_OUT' | 'DISPATCH' | 'RETURN_VERIFY';

interface ScanPayload {
  code: string;
  actionType: BarcodeActionType;
  warehouseId?: string;
  binId?: string;
  orderId?: string;
  quantity?: number;
}

export const useBarcode = () => {
  const queryClient = useQueryClient();

  const scanBarcode = useMutation({
    mutationFn: async (payload: ScanPayload) => {
      const { data } = await api.post('/barcode/scan', payload);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries based on the action
      if (variables.actionType === 'STOCK_IN' || variables.actionType === 'STOCK_OUT') {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse'] });
        toast.success(`Stock updated for ${data.product?.sku || variables.code}`);
      }
      
      if (variables.actionType === 'DISPATCH') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['shipments'] });
        toast.success(`Order ${data.orderNumber} dispatched successfully`);
      }

      if (variables.actionType === 'RETURN_VERIFY') {
        queryClient.invalidateQueries({ queryKey: ['returns'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        toast.success(`Return verified for ${data.product?.sku || variables.code}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Barcode scan failed');
    }
  });

  return {
    scanBarcode,
    isLoading: scanBarcode.isPending,
  };
};
