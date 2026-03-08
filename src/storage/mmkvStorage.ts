/**
 * MMKV Storage adapter for Zustand persist middleware.
 * Provides synchronous, near-zero-latency reads on cold start.
 *
 * NOTE: In the test / web environment this gracefully falls back to an
 * in-memory map so the store still works without native modules.
 */
import type { StateStorage } from 'zustand/middleware';

let mmkvInstance: any = null;

function getMMKV() {
    if (mmkvInstance) return mmkvInstance;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { MMKV } = require('react-native-mmkv');
        mmkvInstance = new MMKV({ id: 'exelent-app-storage' });
        return mmkvInstance;
    } catch {
        // Fallback for environments where MMKV is unavailable (web / tests)
        return null;
    }
}

// In-memory fallback for non-native environments
const memoryStore = new Map<string, string>();

export const mmkvStorage: StateStorage = {
    getItem(name: string): string | null {
        const mmkv = getMMKV();
        if (mmkv) {
            return mmkv.getString(name) ?? null;
        }
        return memoryStore.get(name) ?? null;
    },

    setItem(name: string, value: string): void {
        const mmkv = getMMKV();
        if (mmkv) {
            mmkv.set(name, value);
        } else {
            memoryStore.set(name, value);
        }
    },

    removeItem(name: string): void {
        const mmkv = getMMKV();
        if (mmkv) {
            mmkv.delete(name);
        } else {
            memoryStore.delete(name);
        }
    },
};
