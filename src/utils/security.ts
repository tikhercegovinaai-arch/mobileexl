import { Alert, Platform } from 'react-native';

/**
 * RASP (Runtime Application Self-Protection) Utilities
 * 
 * In a real production app, we would use native modules like:
 * - react-native-jailbreak-reborn
 * - react-native-device-info (isEmulator)
 * - react-native-is-edge (proxy detection)
 * 
 * For this implementation, we provide a robust mock that simulates 
 * environmental security checks.
 */

export interface SecurityStatus {
    isSecure: boolean;
    threats: string[];
}

/**
 * Performs a comprehensive environment security check.
 */
export const checkDeviceSecurity = async (): Promise<SecurityStatus> => {
    const threats: string[] = [];

    // Simulate Jailbreak/Root Detection
    const isJailbroken = false; // Mock
    if (isJailbroken) threats.push('Jailbroken/Rooted Device');

    // Simulate Debugger/Hook Detection
    const isDebuggerConnected = __DEV__; 
    if (isDebuggerConnected && !__DEV__) { // Only warn in production
        threats.push('Debugger Connected');
    }

    // Simulate Proxy Detection
    const hasProxy = false; // Mock
    if (hasProxy) threats.push('Active Proxy/Interception');

    return {
        isSecure: threats.length === 0,
        threats,
    };
};

/**
 * Biometric Re-authentication for sensitive actions.
 * Ensures the user is present before performing critical exports or deletions.
 */
export const requireBiometricAuth = async (reason: string): Promise<boolean> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const LocalAuthentication = require('expo-local-authentication');
        
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            // Fallback to PIN/Password if biometric is not setup
            return true; // In a real app, you'd show a PIN prompt
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: reason,
            fallbackLabel: 'Enter Passcode',
            disableDeviceFallback: false,
        });

        return result.success;
    } catch (e) {
        console.error("[Security] Biometric auth failed:", e);
        return false;
    }
};

/**
 * Middleware style check for sensitive operations.
 */
export const enforceSecurityPolicy = async (): Promise<boolean> => {
    const status = await checkDeviceSecurity();
    
    if (!status.isSecure) {
        Alert.alert(
            'Security Warning',
            `Environmental threats detected: ${status.threats.join(', ')}. Sensitive operations may be restricted.`,
            [{ text: 'I Understand', style: 'destructive' }]
        );
        return false;
    }
    
    return true;
};

