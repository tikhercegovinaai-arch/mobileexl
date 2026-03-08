import { Platform } from 'react-native';

/**
 * Certificate-pinning helper.
 *
 * Uses `react-native-ssl-pinning` on native platforms.
 * Falls back to plain `fetch` on web / test / development builds where the
 * native module is unavailable.
 *
 * Pin hashes should be SHA-256 public-key pins in Base64 for your API domain.
 * Rotate pins before certs expire — keep one current + one backup.
 */

// Add your API domain pin hashes here
const PINS: Record<string, string[]> = {
    'api.exelent.app': [
        // Primary cert pin (SHA-256 SPKI hash in Base64)
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        // Backup cert pin
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
};

/**
 * Perform a pinned HTTPS fetch.
 *
 * Delegates to react-native-ssl-pinning on iOS/Android, or plain fetch on web.
 */
export async function pinnedFetch(
    url: string,
    options?: RequestInit,
): Promise<Response> {
    if (Platform.OS === 'web') {
        return fetch(url, options);
    }

    try {
        const { fetch: sslFetch } = require('react-native-ssl-pinning');

        const hostname = new URL(url).hostname;
        const certs = PINS[hostname];

        if (!certs || certs.length === 0) {
            // No pin defined — fall back to normal fetch with warning
            console.warn(`[CertPin] No pins configured for ${hostname}, using unpinned fetch`);
            return fetch(url, options);
        }

        const response = await sslFetch(url, {
            ...options,
            sslPinning: {
                certs, // SHA-256 pins
            },
            timeoutInterval: 30_000,
        });

        return response;
    } catch (error: any) {
        // If native module missing (dev/Expo Go), fall back gracefully
        if (
            error?.code === 'MODULE_NOT_FOUND' ||
            error?.message?.includes?.('not installed')
        ) {
            console.warn('[CertPin] Native module unavailable, falling back to plain fetch');
            return fetch(url, options);
        }
        throw error;
    }
}

/**
 * Validate a pin hash format.
 */
export function isValidPinHash(hash: string): boolean {
    // SHA-256 Base64: 44 characters
    return /^[A-Za-z0-9+/]{43}=$/.test(hash);
}
