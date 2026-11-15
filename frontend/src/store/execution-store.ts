import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TaskType = 'PICKING' | 'PACKING' | 'DISPATCH';

export interface ActiveTaskState {
  taskId: string | null;
  taskType: TaskType | null;
  orderId: string | null;
  scannedItems: Record<string, number>; // SKU -> quantity
  isVoiceEnabled: boolean;
  requiredItems: Array<{ sku: string; quantity: number; name: string }>;
  
  startTask: (taskId: string, taskType: TaskType, orderId: string, requiredItems: any[]) => void;
  scanItem: (sku: string) => { success: boolean; message: string };
  completeTask: () => void;
  pauseTask: () => void;
  toggleVoice: () => void;
}

export const useExecutionStore = create<ActiveTaskState>()(
  persist(
    (set, get) => ({
      taskId: null,
      taskType: null,
      orderId: null,
      scannedItems: {},
      isVoiceEnabled: true,
      requiredItems: [],

      startTask: (taskId, taskType, orderId, requiredItems) => {
        set({ taskId, taskType, orderId, requiredItems, scannedItems: {} });
      },

      scanItem: (sku) => {
        const state = get();
        if (!state.taskId) return { success: false, message: 'No active task' };

        // Depending on task type, logic might differ, but generally we map SKUs
        // For DISPATCH, the 'sku' might actually be a tracking number. We'll handle that via different requiredItems logic.
        
        const required = state.requiredItems.find(item => item.sku === sku);
        if (!required) {
          return { success: false, message: 'Wrong item scanned' };
        }

        const currentlyScanned = state.scannedItems[sku] || 0;
        if (currentlyScanned >= required.quantity) {
          return { success: false, message: 'Item already fully scanned' };
        }

        set((prev) => ({
          scannedItems: {
            ...prev.scannedItems,
            [sku]: currentlyScanned + 1
          }
        }));

        return { success: true, message: `Scanned ${sku} (${currentlyScanned + 1}/${required.quantity})` };
      },

      completeTask: () => {
        set({ taskId: null, taskType: null, orderId: null, requiredItems: [], scannedItems: {} });
      },

      pauseTask: () => {
        // Just unsets task but keeps it in the backend as IN_PROGRESS. Local state is cleared.
        // Wait, if it's paused, we might lose local scanned state. 
        // For simplicity, pausing drops local state. User has to rescan.
        set({ taskId: null, taskType: null, orderId: null, requiredItems: [], scannedItems: {} });
      },

      toggleVoice: () => {
        set((prev) => ({ isVoiceEnabled: !prev.isVoiceEnabled }));
      }
    }),
    {
      name: 'execution-storage',
    }
  )
);
