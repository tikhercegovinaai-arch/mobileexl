// ─── Mocks ───────────────────────────────────────────────────────────────────
// Mock expo-secure-store before importing the service
const mockStore: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    setItemAsync: jest.fn(async (key: string, value: string) => {
        mockStore[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => mockStore[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
        delete mockStore[key];
    }),
}));

import {
    SecureStorageService,
    STORAGE_KEYS,
} from '../../src/services/SecureStorageService';

// ─── Clean slate between tests ────────────────────────────────────────────────
beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    jest.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SecureStorageService', () => {
    describe('write()', () => {
        it('serialises and stores a string value', async () => {
            const ok = await SecureStorageService.write(
                STORAGE_KEYS.SESSION_ID,
                'session_abc123',
            );
            expect(ok).toBe(true);
            expect(mockStore[STORAGE_KEYS.SESSION_ID]).toBe('"session_abc123"');
        });

        it('serialises and stores a complex object', async () => {
            const config = { model: 'Qwen2.5', quantization: '4bit', version: 2 };
            const ok = await SecureStorageService.write(
                STORAGE_KEYS.MODEL_CONFIG,
                config,
            );
            expect(ok).toBe(true);
            expect(JSON.parse(mockStore[STORAGE_KEYS.MODEL_CONFIG])).toEqual(config);
        });

        it('returns false and does not throw on storage error', async () => {
            const { setItemAsync } = require('expo-secure-store');
            setItemAsync.mockRejectedValueOnce(new Error('Keystore unavailable'));
            const ok = await SecureStorageService.write(
                STORAGE_KEYS.SESSION_ID,
                'x',
            );
            expect(ok).toBe(false);
        });
    });

    describe('read()', () => {
        it('returns null for a missing key', async () => {
            const val = await SecureStorageService.read(STORAGE_KEYS.SESSION_ID);
            expect(val).toBeNull();
        });

        it('round-trips a written value correctly', async () => {
            await SecureStorageService.write(STORAGE_KEYS.ONBOARDING_DONE, true);
            const val = await SecureStorageService.read<boolean>(
                STORAGE_KEYS.ONBOARDING_DONE,
            );
            expect(val).toBe(true);
        });

        it('round-trips a complex object', async () => {
            const prefs = { theme: 'dark', language: 'en', dpiMin: 300 };
            await SecureStorageService.write(STORAGE_KEYS.USER_PREFS, prefs);
            const result =
                await SecureStorageService.read<typeof prefs>(STORAGE_KEYS.USER_PREFS);
            expect(result).toEqual(prefs);
        });

        it('returns null on decryption error', async () => {
            const { getItemAsync } = require('expo-secure-store');
            getItemAsync.mockRejectedValueOnce(new Error('Decryption failed'));
            const val = await SecureStorageService.read(STORAGE_KEYS.SESSION_ID);
            expect(val).toBeNull();
        });
    });

    describe('delete()', () => {
        it('removes a stored key', async () => {
            await SecureStorageService.write(STORAGE_KEYS.SESSION_ID, 'to-delete');
            const deleted = await SecureStorageService.delete(STORAGE_KEYS.SESSION_ID);
            expect(deleted).toBe(true);
            const val = await SecureStorageService.read(STORAGE_KEYS.SESSION_ID);
            expect(val).toBeNull();
        });

        it('returns false on error', async () => {
            const { deleteItemAsync } = require('expo-secure-store');
            deleteItemAsync.mockRejectedValueOnce(new Error('Delete failed'));
            const ok = await SecureStorageService.delete(STORAGE_KEYS.SESSION_ID);
            expect(ok).toBe(false);
        });
    });

    describe('exists()', () => {
        it('returns false for a key that does not exist', async () => {
            const found = await SecureStorageService.exists(STORAGE_KEYS.SESSION_ID);
            expect(found).toBe(false);
        });

        it('returns true for a written key', async () => {
            await SecureStorageService.write(STORAGE_KEYS.SESSION_ID, 'abc');
            const found = await SecureStorageService.exists(STORAGE_KEYS.SESSION_ID);
            expect(found).toBe(true);
        });
    });

    describe('clearSession()', () => {
        it('removes only session-scoped keys, leaves others intact', async () => {
            await SecureStorageService.write(STORAGE_KEYS.SESSION_ID, 's1');
            await SecureStorageService.write(STORAGE_KEYS.LAST_EXPORT_PATH, '/tmp/out.xlsx');
            await SecureStorageService.write(STORAGE_KEYS.ONBOARDING_DONE, true);

            await SecureStorageService.clearSession();

            expect(await SecureStorageService.exists(STORAGE_KEYS.SESSION_ID)).toBe(false);
            expect(await SecureStorageService.exists(STORAGE_KEYS.LAST_EXPORT_PATH)).toBe(false);
            // Non-session key must survive
            expect(await SecureStorageService.exists(STORAGE_KEYS.ONBOARDING_DONE)).toBe(true);
        });
    });
});
