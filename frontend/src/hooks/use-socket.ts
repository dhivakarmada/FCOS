import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useActivityStore } from '@/store/activity-store';
import { toast } from 'sonner';

let socket: Socket | null = null;

export const useSocket = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const vendorId = useAuthStore((state) => state.user?.vendorId);

  useEffect(() => {
    if (!token || socket) return;

    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('order-status-updated', (data) => {
      toast.info(`Order ${data.orderNumber} is now ${data.status}`);
      useActivityStore.getState().addActivity({
        type: 'order',
        title: 'Order Status Updated',
        description: `Order ${data.orderNumber} changed to ${data.status}`,
        status: data.status,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socket.on('inventory-updated', (data) => {
      useActivityStore.getState().addActivity({
        type: 'inventory',
        title: 'Inventory Updated',
        description: `Stock level updated for product ${data.sku || data.productId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    });

    socket.on('invoice-generated', (data) => {
      toast.success(`Invoice generated for order ${data.orderId}`, {
        action: {
          label: 'Download',
          onClick: () => window.open(data.invoiceUrl, '_blank'),
        },
      });
      useActivityStore.getState().addActivity({
        type: 'shipping',
        title: 'Invoice Generated',
        description: `Ready for shipping: Order ${data.orderId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on('staff-status-changed', (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [token, queryClient]);

  return socket;
};
