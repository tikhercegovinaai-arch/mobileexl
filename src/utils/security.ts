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
