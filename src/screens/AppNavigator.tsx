import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import ExtractionScreen from './ExtractionScreen';
import ValidationScreen from './ValidationScreen';
import ColumnMappingScreen from './ColumnMappingScreen';
import ExportScreen from './ExportScreen';
import PrivacyGateScreen from './PrivacyGateScreen';
import PermissionGate from '../components/PermissionGate';
import { PermissionService, PermissionState } from '../services/PermissionService';
import { DocumentScannerService } from '../services/DocumentScannerService';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/theme';

type Screen = 'home' | 'permission' | 'preview' | 'extraction' | 'validation' | 'columnMapping' | 'export';

export default function AppNavigator() {
    const { setPreprocessedImage, resetSession, initializeValidation, isLocked } = useAppStore();

    const [screen, setScreen] = useState<Screen>('home');
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'undetermined',
        mediaLibrary: 'undetermined',
    });

    useEffect(() => {
        PermissionService.getStatuses().then(setPermissions);
    }, []);

    const launchScanner = async () => {
        const result = await DocumentScannerService.scanDocument();

        if (result.status === 'success' && result.images && result.images.length > 0) {
            setPreprocessedImage(result.images[0]);
            setScreen('preview');
        } else if (result.status === 'error') {
            Alert.alert('Scanner Error', result.error || 'Failed to scan document');
            setScreen('home');
        } else {
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
        resetSession();
        setScreen('home');
    };

    return (
        <GestureHandlerRootView style={styles.root}>
            {isLocked && <PrivacyGateScreen />}

            {!isLocked && screen === 'home' && (
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
                        resetSession();
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
