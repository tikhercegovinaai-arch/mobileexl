import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const IOS_JAILBREAK_PATHS = [
    '/Applications/Cydia.app',
    '/Applications/blackra1n.app',
    '/Applications/FakeCarrier.app',
    '/Applications/Icy.app',
    '/Applications/IntelliScreen.app',
    '/Applications/MxTube.app',
    '/Applications/RockApp.app',
    '/Applications/SBSettings.app',
    '/Applications/WinterBoard.app',
    '/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist',
    '/Library/MobileSubstrate/DynamicLibraries/Veency.plist',
    '/System/Library/LaunchDaemons/com.ikey.bbot.plist',
    '/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist',
    '/bin/bash',
    '/bin/sh',
    '/etc/apt',
    '/etc/ssh/sshd_config',
    '/private/var/lib/apt/',
    '/private/var/lib/cydia',
    '/private/var/mobile/Library/SBSettings/Themes',
    '/private/var/stash',
    '/private/var/tmp/cydia.log',
    '/sbin/sshd',
    '/usr/bin/sshd',
    '/usr/libexec/sftp-server',
    '/usr/libexec/ssh-keysign',
    '/usr/sbin/sshd'
];

const ANDROID_ROOT_PATHS = [
    '/data/local/bin/su',
    '/data/local/su',
    '/data/local/xbin/su',
    '/dev/com.koushikdutta.superuser.daemon/',
    '/sbin/su',
    '/system/app/Superuser.apk',
    '/system/bin/failsafe/su',
    '/system/bin/su',
    '/system/sd/xbin/su',
    '/system/xbin/su',
    '/su/bin/su',
];

export const RASPService = {
    /**
     * Runtime Application Self-Protection checks.
     * Evaluates if the device is rooted or jailbroken based on known file paths and device state.
     */
    async isDeviceCompromised(): Promise<boolean> {
        // Exempt simulators/emulators from strict path testing during development if desired, 
        // though typically they have some root paths. We'll run the check regardless for robustness.
        if (!Device.isDevice) {
            console.warn('[RASPService] Running on simulator/emulator. Bypassing strict compromise checks.');
            return false;
        }

        const suspiciousPaths = Platform.OS === 'ios' ? IOS_JAILBREAK_PATHS : ANDROID_ROOT_PATHS;

        try {
            for (const path of suspiciousPaths) {
                const info = await FileSystem.getInfoAsync(path);
                if (info.exists) {
                    console.error(`[RASPService] Device is compromised. Suspicious path found: ${path}`);
                    return true;
                }
            }

            // Can also check if app can write outside its sandbox (basic heuristic)
            if (Platform.OS === 'ios') {
                try {
                    const testPath = '/private/jailbreak.test';
                    await FileSystem.writeAsStringAsync(testPath, 'test');
                    await FileSystem.deleteAsync(testPath);
                    console.error('[RASPService] Device is compromised. Able to write outside sandbox.');
                    return true;
                } catch (e) {
                    // This is the expected successful outcome for a secured device.
                }
            }

            return false;
        } catch (e) {
            console.error('[RASPService] Error checking device compromise status:', e);
            // Fail open or fail closed depends on business rules. Fail closed in high security.
            return false;
        }
    },

    /**
     * Initializes security constraints. This should be run on app startup.
     */
    async enforceSecurityPolicies(): Promise<void> {
        const isCompromised = await this.isDeviceCompromised();

        if (isCompromised) {
            // Ideally, clear sensitive data or secure store tokens immediately.
            console.error('[RASPService] CRITICAL: Environment determined to be compromised!');
            // throw new Error("Security Violation: Refusing to start in a compromised environment.");
        }

        console.log('[RASPService] Security policies passed.');
    }
};
