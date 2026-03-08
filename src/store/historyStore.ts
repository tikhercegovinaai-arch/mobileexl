import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';

export interface HistoryEntry {
    id: string;
    timestamp: string; // ISO string
    fileName: string;
    imageUris: string[];
    extractedData: Record<string, any>;
    confidenceHealth: 'excellent' | 'caution' | 'poor';
    averageConfidence: number;
    formatsExported: string[];
}

interface HistoryState {
    entries: HistoryEntry[];
    
    // Actions
    addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
    removeEntry: (id: string) => void;
    clearHistory: () => void;
    getEntry: (id: string) => HistoryEntry | undefined;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set, get) => ({
            entries: [],

            addEntry: (entry) => set((state) => ({
                entries: [
                    {
                        ...entry,
                        id: `hist_${Date.now()}`,
                        timestamp: new Date().toISOString(),
                    },
                    ...state.entries,
                ].slice(0, 100), // Limit to last 100 entries for performance
            })),

            removeEntry: (id) => set((state) => ({
                entries: state.entries.filter((e) => e.id !== id),
            })),

            clearHistory: () => set({ entries: [] }),

            getEntry: (id) => get().entries.find((e) => e.id === id),
        }),
        {
            name: 'exelent-history-store',
            storage: createJSONStorage(() => mmkvStorage),
            version: 1,
        }
    )
);
