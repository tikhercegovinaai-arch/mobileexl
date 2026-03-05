import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';

import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import ExtractionScreen from './ExtractionScreen';
import ValidationScreen from './ValidationScreen';
import ExportScreen from './ExportScreen';
import PermissionGate from '../components/PermissionGate';
import { PermissionService, PermissionState } from '../services/PermissionService';
import { DocumentScannerService } from '../services/DocumentScannerService';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';

// Light-weight conditional navigation for Phase 2
type Screen = 'home' | 'permission' | 'preview' | 'extraction' | 'validation' | 'export';

export default function AppNavigator() {
    const { setPreprocessedImage, resetSession, initializeValidation } = useAppStore();

    const [screen, setScreen] = useState<Screen>('home');
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'undetermined',
        mediaLibrary: 'undetermined',
    });

    // Check permissions on mount
    useEffect(() => {
        PermissionService.getStatuses().then(setPermissions);
    }, []);

    const launchScanner = async () => {
        const result = await DocumentScannerService.scanDocument();

        if (result.status === 'success' && result.images && result.images.length > 0) {
            setPreprocessedImage(result.images[0]);
            setScreen('preview');
        } else if (result.status === 'error') {
            Alert.alert("Scanner Error", result.error || "Failed to scan document");
            setScreen('home');
        } else {
            // user cancelled the modal
            setScreen('home');
        }
    };

    const handleStartCapture = useCallback(async () => {
        const current = await PermissionService.getStatuses();

        if (PermissionService.allGranted(current)) {
            await launchScanner();
        } else if (current.camera === 'blocked') {
            setPermissions(current);
            setScreen('permission');
        } else {
            // First time or soft-denied — request
            const result = await PermissionService.requestAll();
            setPermissions(result);
            if (PermissionService.allGranted(result)) {
                await launchScanner();
            } else {
                setScreen('permission');
            }
        }
    }, []);

    const handlePermissionRequest = useCallback(async () => {
        const result = await PermissionService.requestAll();
        setPermissions(result);
        if (PermissionService.allGranted(result)) {
            await launchScanner();
        }
    }, []);

    const handleRetake = () => {
        setPreprocessedImage('');
        launchScanner();
    };

    const handleAccept = () => {
        setScreen('extraction');
    };

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
        resetSession();
        setScreen('home');
    };

    return (
        <View style={styles.root}>
            {screen === 'home' && (
                <HomeScreen
                    onStartCapture={handleStartCapture}
                    onOpenSettings={() => console.info('Settings available in Phase 6')}
                />
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

            {screen === 'extraction' && (
                <ExtractionScreen
                    onExtractionComplete={handleExtractionComplete}
                    onExtractionError={handleExtractionError}
                />
            )}
            {screen === 'validation' && (
                <ValidationScreen
                    onBack={() => setScreen('home')}
                    onContinue={() => setScreen('export')}
                />
            )}

            {screen === 'export' && (
                <ExportScreen
                    onDone={() => {
                        resetSession();
                        setScreen('home');
                    }}
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
