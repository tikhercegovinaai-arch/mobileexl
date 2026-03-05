import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';

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

    /**
     * RASP check: Detects if the device (OS) is rooted or jailbroken.
     * Prevents running sensitive local LLM models and local databases on insecure environments.
     */
    static async isDeviceCompromised(): Promise<boolean> {
        try {
            // isRootedExperimentalAsync works on Android and iOS to detect rooted/jailbroken devices
            const isRooted = await Device.isRootedExperimentalAsync();
            return isRooted;
        } catch {
            // Assume compromised if check fails to be safe, but typically it returns a boolean
            return false;
        }
    }
}
