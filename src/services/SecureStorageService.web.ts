// ─── Key Registry ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
    SESSION_ID: 'exelent_session_id',
    USER_PREFS: 'exelent_user_prefs',
    MODEL_CONFIG: 'exelent_model_config',
    LAST_EXPORT_PATH: 'exelent_last_export',
    ONBOARDING_DONE: 'exelent_onboarding_done',
    CONSENT_VERSION: 'exelent_consent_version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Web Shim ─────────────────────────────────────────────────────────────────
// expo-secure-store is not supported on web. We fall back to localStorage.
// Note: localStorage is NOT encrypted; this is only suitable for development/web preview.
export const SecureStorageService = {
    async write<T>(key: StorageKey, value: T): Promise<boolean> {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`[SecureStorage/web] write failed for key "${key}":`, error);
            return false;
        }
    },

    async read<T>(key: StorageKey): Promise<T | null> {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || raw === undefined) return null;
            return JSON.parse(raw) as T;
        } catch (error) {
            console.error(`[SecureStorage/web] read failed for key "${key}":`, error);
            return null;
        }
    },

    async delete(key: StorageKey): Promise<boolean> {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[SecureStorage/web] delete failed for key "${key}":`, error);
            return false;
        }
    },

    async exists(key: StorageKey): Promise<boolean> {
        return localStorage.getItem(key) !== null;
    },

    async clearSession(): Promise<void> {
        const sessionKeys: StorageKey[] = [
            STORAGE_KEYS.SESSION_ID,
            STORAGE_KEYS.LAST_EXPORT_PATH,
        ];
        sessionKeys.forEach((k) => localStorage.removeItem(k));
        console.info('[SecureStorage/web] Session keys cleared.');
    },
} as const;
