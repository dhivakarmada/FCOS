import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect } from 'react';
import { useSocket } from './use-socket';

export const useStaffPerformance = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const leaderboardQuery = useQuery({
    queryKey: ['staff-leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/staff/performance/leaderboard');
      return data;
    },
  });

  const myStatsQuery = useQuery({
    queryKey: ['my-performance'],
    queryFn: async () => {
      const { data } = await api.get('/staff/performance/my-stats');
      return data;
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: { staffId: string; stats: any }) => {
      // Update individual stats if it's the current user
      queryClient.setQueryData(['my-performance'], (old: any) => {
        return data.stats;
      });

      // Invalidate leaderboard to fetch fresh rankings
      queryClient.invalidateQueries({ queryKey: ['staff-leaderboard'] });
    };

    socket.on('staff-performance-updated', handleUpdate);

    return () => {
      socket.off('staff-performance-updated', handleUpdate);
    };
  }, [socket, queryClient]);

  return {
    leaderboard: leaderboardQuery.data || [],
    myStats: myStatsQuery.data,
    isLoading: leaderboardQuery.isLoading || myStatsQuery.isLoading,
    refetch: () => {
      leaderboardQuery.refetch();
      myStatsQuery.refetch();
    },
  };
};
