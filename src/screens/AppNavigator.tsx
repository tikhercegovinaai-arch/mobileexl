import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import HomeScreen from './HomeScreen';
import CameraScreen, { CaptureResult } from './CameraScreen';
import PermissionGate from '../components/PermissionGate';
import { PermissionService, PermissionState } from '../services/PermissionService';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';

// ─── Navigator ────────────────────────────────────────────────────────────────
// Lightweight conditional navigator for Phase 1.
// Will be replaced with react-navigation stack once all screens are in place.

type Screen = 'home' | 'permission' | 'camera';

export default function AppNavigator() {
    const { setCapturedImage, resetSession } = useAppStore();

    const [screen, setScreen] = useState<Screen>('home');
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'undetermined',
        mediaLibrary: 'undetermined',
    });

    // Check permissions on mount
    useEffect(() => {
        PermissionService.getStatuses().then(setPermissions);
    }, []);

    // ── Navigate to camera (request permissions first) ──────────────────────────
    const handleStartCapture = useCallback(async () => {
        const current = await PermissionService.getStatuses();

        if (PermissionService.allGranted(current)) {
            setScreen('camera');
        } else if (current.camera === 'blocked') {
            setPermissions(current);
            setScreen('permission');
        } else {
            // First time or soft-denied — request
            const result = await PermissionService.requestAll();
            setPermissions(result);
            if (PermissionService.allGranted(result)) {
                setScreen('camera');
            } else {
                setScreen('permission');
            }
        }
    }, []);

    const handlePermissionRequest = useCallback(async () => {
        const result = await PermissionService.requestAll();
        setPermissions(result);
        if (PermissionService.allGranted(result)) {
            setScreen('camera');
        }
    }, []);

    // ── Capture complete ─────────────────────────────────────────────────────────
    const handleCapture = useCallback(
        (result: CaptureResult) => {
            setCapturedImage(result.uri);
            // TODO Phase 2: route to PreviewScreen → Preprocessing pipeline
            console.info('[Navigator] Capture complete, uri:', result.uri);
            setScreen('home');
        },
        [setCapturedImage],
    );

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <View style={styles.root}>
            {screen === 'home' && (
                <HomeScreen
                    onStartCapture={handleStartCapture}
                    onOpenSettings={() => console.info('Settings coming in Phase 6')}
                />
            )}

            {screen === 'permission' && (
                <PermissionGate
                    status={permissions.camera === 'blocked' ? 'blocked' : 'denied'}
                    onRequestPermission={handlePermissionRequest}
                />
            )}

            {screen === 'camera' && (
                <CameraScreen
                    onCapture={handleCapture}
                    onCancel={() => setScreen('home')}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});
