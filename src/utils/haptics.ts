/**
 * Typed haptic feedback helpers.
 *
 * All functions are no-ops on Web.
 * Reads `hapticsEnabled` from the app store on each call so that the
 * Settings toggle takes effect immediately.
 */
import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
    try {
        // Dynamic require avoids bundling expo-haptics on web
        Haptics = require('expo-haptics');
    } catch {
        /* expo-haptics not installed */
    }
}

function isEnabled(): boolean {
    try {
        const { useAppStore } = require('../store/useAppStore');
        return useAppStore.getState().settings.hapticsEnabled;
    } catch {
        return false;
    }
}

export async function hapticLight(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticMedium(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticHeavy(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function hapticSuccess(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function hapticWarning(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export async function hapticError(): Promise<void> {
    if (!Haptics || !isEnabled()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
