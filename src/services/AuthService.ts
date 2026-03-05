import * as LocalAuthentication from 'expo-local-authentication';

export class AuthService {
    /**
     * Checks if the device has biometric hardware and if it's enrolled.
     */
    static async isBiometricAvailable(): Promise<boolean> {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    }

    /**
     * Triggers the biometric authentication dialog.
     */
    static async authenticate(): Promise<boolean> {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access sensitive data',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
        });
        return result.success;
    }
}
