import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import ExtractionScreen from './ExtractionScreen';
import ValidationScreen from './ValidationScreen';
import ColumnMappingScreen from './ColumnMappingScreen';
import ExportScreen from './ExportScreen';
import PrivacyGateScreen from './PrivacyGateScreen';
import SettingsScreen from './SettingsScreen';
import PermissionGate from '../components/PermissionGate';
import { PermissionService, PermissionState } from '../services/PermissionService';
import { DocumentScannerService } from '../services/DocumentScannerService';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';

type Screen = 'home' | 'permission' | 'preview' | 'batchReview' | 'extraction' | 'validation' | 'columnMapping' | 'export' | 'settings';

export default function AppNavigator() {
    const { isLocked, setLocked } = useAppStore();

    const [screen, setScreen] = useState<Screen>('home');
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'undetermined',
        mediaLibrary: 'undetermined',
    });

    useEffect(() => {
        PermissionService.getStatuses().then(setPermissions);

        // Auto-lock when app goes to background
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                setLocked(true);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const launchScanner = async (isBatch: boolean = false) => {
        const result = await DocumentScannerService.scanDocument({ isBatch });

        if (result.status === 'success' && result.images && result.images.length > 0) {
            useAppStore.getState().setIsBatchMode(isBatch);
            useAppStore.getState().setPreprocessedImages(result.images);
            if (isBatch || result.images.length > 1) {
                setScreen('batchReview' as Screen);
            } else {
                setScreen('preview');
            }
        } else if (result.status === 'error') {
            Alert.alert('Scanner Error', result.error || 'Failed to scan document');
            setScreen('home');
        } else {
            setScreen('home');
        }
    };

    const handleStartCapture = useCallback(async (isBatch: boolean = false) => {
        const current = await PermissionService.getStatuses();

        if (PermissionService.allGranted(current)) {
            await launchScanner(isBatch);
        } else if (current.camera === 'blocked') {
            setPermissions(current);
            setScreen('permission');
        } else {
            const result = await PermissionService.requestAll();
            setPermissions(result);
            if (PermissionService.allGranted(result)) {
                await launchScanner(isBatch);
            } else {
                setScreen('permission');
            }
        }
    }, []);

    const handlePermissionRequest = useCallback(async () => {
        const result = await PermissionService.requestAll();
        setPermissions(result);
        if (PermissionService.allGranted(result)) {
            await launchScanner(useAppStore.getState().capture.isBatchMode);
        }
    }, []);

    const handleRetake = () => {
        useAppStore.getState().setPreprocessedImages([]);
        launchScanner(useAppStore.getState().capture.isBatchMode);
    };

    const handleAccept = () => setScreen('extraction');

    const handleExtractionComplete = () => {
        const data = useAppStore.getState().extraction.extractedData;
        if (data) {
            initializeValidation(data);
            setScreen('validation');
        } else {
            handleExtractionError();
        }
    };

    const handleExtractionError = () => {
        useAppStore.getState().resetSession();
        setScreen('home');
    };

    return (
        <GestureHandlerRootView style={styles.root}>
            {isLocked && <PrivacyGateScreen />}

            {!isLocked && screen === 'home' && (
                <HomeScreen
                    onStartCapture={handleStartCapture}
                    onOpenSettings={() => setScreen('settings')}
                />
            )}

            {screen === 'settings' && (
                <SettingsScreen onBack={() => setScreen('home')} />
            )}

            {screen === 'permission' && (
                <PermissionGate
                    status={permissions.camera === 'blocked' ? 'blocked' : 'denied'}
                    onRequestPermission={handlePermissionRequest}
                />
            )}

            {screen === 'preview' && (
                <PreviewScreen
                    onRetake={handleRetake}
                    onAccept={handleAccept}
                />
            )}

            {screen === 'batchReview' && (
                // Temporarily going back to home until BatchReviewScreen is built
                <HomeScreen
                    onStartCapture={handleStartCapture}
                    onOpenSettings={() => setScreen('settings')}
                />
            )}

            {screen === 'extraction' && (
                <ExtractionScreen
                    onExtractionComplete={handleExtractionComplete}
                    onExtractionError={handleExtractionError}
                />
            )}

            {screen === 'validation' && (
                <ValidationScreen
                    onBack={() => setScreen('home')}
                    onContinue={() => setScreen('columnMapping')}
                />
            )}

            {screen === 'columnMapping' && (
                <ColumnMappingScreen
                    onBack={() => setScreen('validation')}
                    onContinue={() => setScreen('export')}
                />
            )}

            {screen === 'export' && (
                <ExportScreen
                    onDone={() => {
                        useAppStore.getState().resetSession();
                        setScreen('home');
                    }}
                />
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});
