import { Platform } from 'react-native';

/**
 * Biometric authentication gate.
 *
 * Wraps expo-local-authentication with lazy loading and platform guards.
 * Used to re-authenticate before export when `requireBiometricOnExport` is true.
 */
export class BiometricService {
    /**
     * Check whether the device supports biometric authentication.
     */
    static async isAvailable(): Promise<boolean> {
        if (Platform.OS === 'web') return false;

        try {
            const LocalAuth = require('expo-local-authentication');
            const hasHardware = await LocalAuth.hasHardwareAsync();
            if (!hasHardware) return false;

            const isEnrolled = await LocalAuth.isEnrolledAsync();
            return isEnrolled;
        } catch {
            return false;
        }
    }

    /**
     * Prompt the user for biometric / device passcode authentication.
     *
     * @returns true if authenticated successfully, false if cancelled or failed.
     */
    static async authenticate(
        promptMessage: string = 'Authenticate to continue',
    ): Promise<boolean> {
        if (Platform.OS === 'web') return true; // no-op on web

        try {
            const LocalAuth = require('expo-local-authentication');

            const result = await LocalAuth.authenticateAsync({
                promptMessage,
                disableDeviceFallback: false, // allow PIN fallback
                cancelLabel: 'Cancel',
            });

            return result.success;
        } catch {
            return false;
        }
    }

    /**
     * Get the type of biometric authentication available on the device.
     */
    static async getBiometricType(): Promise<'fingerprint' | 'face' | 'iris' | 'none'> {
        if (Platform.OS === 'web') return 'none';

        try {
            const LocalAuth = require('expo-local-authentication');
            const types: number[] = await LocalAuth.supportedAuthenticationTypesAsync();

            // expo-local-authentication AuthenticationType enum:
            // 1 = FINGERPRINT, 2 = FACIAL_RECOGNITION, 3 = IRIS
            if (types.includes(2)) return 'face';
            if (types.includes(1)) return 'fingerprint';
            if (types.includes(3)) return 'iris';
            return 'none';
        } catch {
            return 'none';
        }
    }
}
