import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export const useStaffTasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const staffId = user?.id; // Assuming user.id is the staffId in this context

  const tasksQuery = useQuery({
    queryKey: ['staff-tasks', staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data } = await api.get(`/staff/${staffId}/tasks`);
      return data;
    },
    enabled: !!staffId,
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { data } = await api.patch(`/staff/tasks/${taskId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks', staffId] });
      // If task completes, we might also want to invalidate analytics/performance
      queryClient.invalidateQueries({ queryKey: ['staff-performance'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    updateTaskStatus,
  };
};
