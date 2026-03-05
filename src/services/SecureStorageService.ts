import * as SecureStore from 'expo-secure-store';

// ─── Key Registry ────────────────────────────────────────────────────────────
// All storage keys live here to prevent key-name drift across the codebase.
export const STORAGE_KEYS = {
    SESSION_ID: 'exelent_session_id',
    USER_PREFS: 'exelent_user_prefs',
    MODEL_CONFIG: 'exelent_model_config',
    LAST_EXPORT_PATH: 'exelent_last_export',
    ONBOARDING_DONE: 'exelent_onboarding_done',
    CONSENT_VERSION: 'exelent_consent_version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Options ─────────────────────────────────────────────────────────────────
// `requireAuthentication: true` links the key to biometric/device-passcode —
// added here as a future-proof option that is toggled on in Phase 6.
const DEFAULT_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// ─── Service ─────────────────────────────────────────────────────────────────
export const SecureStorageService = {
    /**
     * Write a JSON-serialisable value under an encrypted key.
     * Returns `true` on success, `false` on failure (never throws).
     */
    async write<T>(key: StorageKey, value: T): Promise<boolean> {
        try {
            const serialised = JSON.stringify(value);
            await SecureStore.setItemAsync(key, serialised, DEFAULT_OPTIONS);
            return true;
        } catch (error) {
            console.error(`[SecureStorage] write failed for key "${key}":`, error);
            return false;
        }
    },

    /**
     * Read and JSON-parse a stored value.
     * Returns `null` if the key does not exist or decryption fails.
     */
    async read<T>(key: StorageKey): Promise<T | null> {
        try {
            const raw = await SecureStore.getItemAsync(key, DEFAULT_OPTIONS);
            if (raw === null || raw === undefined) return null;
            return JSON.parse(raw) as T;
        } catch (error) {
            console.error(`[SecureStorage] read failed for key "${key}":`, error);
            return null;
        }
    },

    /**
     * Delete a stored value.
     * Returns `true` on success, `false` on failure.
     */
    async delete(key: StorageKey): Promise<boolean> {
        try {
            await SecureStore.deleteItemAsync(key, DEFAULT_OPTIONS);
            return true;
        } catch (error) {
            console.error(`[SecureStorage] delete failed for key "${key}":`, error);
            return false;
        }
    },

    /**
     * Check whether a key exists without reading its value.
     */
    async exists(key: StorageKey): Promise<boolean> {
        const val = await SecureStore.getItemAsync(key, DEFAULT_OPTIONS);
        return val !== null && val !== undefined;
    },

    /**
     * Purge all known session-scope keys — call on logout / session reset.
     */
    async clearSession(): Promise<void> {
        const sessionKeys: StorageKey[] = [
            STORAGE_KEYS.SESSION_ID,
            STORAGE_KEYS.LAST_EXPORT_PATH,
        ];
        await Promise.all(sessionKeys.map((k) => SecureStorageService.delete(k)));
        console.info('[SecureStorage] Session keys cleared.');
    },
} as const;
