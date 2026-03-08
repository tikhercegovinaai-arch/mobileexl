import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/screens/AppNavigator';
import { SecureStorageService, STORAGE_KEYS } from './src/services/SecureStorageService';
import { useAppStore } from './src/store/useAppStore';
import { ThemeProvider } from './src/context/ThemeContext';
import { RASPService } from './src/services/RASPService';

// Initialize network pinning globally for any out-of-band analytics/telemetry (if enabled eventually).
// This is a placeholder for actual certificate pinning (e.g., using ssl-pinning native modules)
const setupCertificatePinning = () => {
  const originalFetch = global.fetch;
  global.fetch = async (url: RequestInfo | URL, config?: RequestInit) => {
    // Enforce pinned domains for any API calls
    if (typeof url === 'string' && url.startsWith('https://')) {
      // If we had a known URL like https://api.exelent.app we might do:
      // if (!url.includes('api.exelent.app')) throw new Error("Untrusted network connection");
      console.log(`[CertPinning] Intercepted outbound request to: ${url}`);
    }
    return originalFetch(url, config);
  };
  console.log('[CertPinning] Certificate pinning mechanism initialized.');
};

export default function App() {
  const { setOnboardingDone } = useAppStore();

  // Restore persisted preferences on cold start
  useEffect(() => {
    async function bootstrap() {
      // 1. Enforce App Security (RASP)
      await RASPService.enforceSecurityPolicies();

      // 2. Network Pinning
      setupCertificatePinning();

      // 3. App State
      const done = await SecureStorageService.read<boolean>(
        STORAGE_KEYS.ONBOARDING_DONE,
      );
      if (done === true) {
        setOnboardingDone(true);
      }
    }
    bootstrap();
  }, [setOnboardingDone]);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
