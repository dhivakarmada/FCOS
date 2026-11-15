import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'fcos-ui-storage',
    }
  )
);
