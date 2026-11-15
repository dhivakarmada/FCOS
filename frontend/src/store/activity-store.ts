import { create } from 'zustand';

export interface Activity {
  id: string;
  type: 'order' | 'inventory' | 'shipping' | 'return' | 'staff';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
}

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  addActivity: (activity) => 
    set((state) => ({
      activities: [
        {
          ...activity,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
        },
        ...state.activities,
      ].slice(0, 50), // Keep last 50 activities
    })),
  clearActivities: () => set({ activities: [] }),
}));
