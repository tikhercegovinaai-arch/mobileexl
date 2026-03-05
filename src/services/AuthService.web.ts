/**
 * Web stub for AuthService.
 * expo-local-authentication is native-only. On web, biometrics are unavailable,
 * so we auto-pass authentication to keep the app accessible during web development.
 */
export class AuthService {
    static async isBiometricAvailable(): Promise<boolean> {
        return false; // No biometrics on web
    }

    static async authenticate(): Promise<boolean> {
        console.warn('[AuthService/web] Biometric auth not available on web — auto-passing.');
        return true; // Bypass auth gate on web
    }

    static async isDeviceCompromised(): Promise<boolean> {
        return false; // Not applicable on web
    }
}
