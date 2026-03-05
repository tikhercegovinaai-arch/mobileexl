import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/screens/AppNavigator';
import { SecureStorageService, STORAGE_KEYS } from './src/services/SecureStorageService';
import { useAppStore } from './src/store/useAppStore';
import { Colors } from './src/constants/theme';

export default function App() {
  const { setOnboardingDone } = useAppStore();

  // Restore persisted preferences on cold start
  useEffect(() => {
    async function bootstrap() {
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
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
