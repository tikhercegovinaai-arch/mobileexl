import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import HomeScreen from './HomeScreen';
import PreviewScreen from './PreviewScreen';
import BatchReviewScreen from './BatchReviewScreen';
import ExtractionScreen from './ExtractionScreen';
import ValidationScreen from './ValidationScreen';
import ColumnMappingScreen from './ColumnMappingScreen';
import ExportScreen from './ExportScreen';
import PrivacyGateScreen from './PrivacyGateScreen';
import SettingsScreen from './SettingsScreen';
import OnboardingScreen from './OnboardingScreen';
import PermissionGate from '../components/PermissionGate';
import ErrorBoundary from '../components/ErrorBoundary';
import { ToastProvider } from '../components/ToastProvider';
import { PermissionService, PermissionState } from '../services/PermissionService';
import { DocumentScannerService } from '../services/DocumentScannerService';
import UploadScreen from './UploadScreen';
import { useAppStore } from '../store/useAppStore';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

type Screen = 'onboarding' | 'home' | 'permission' | 'preview' | 'batchReview' | 'extraction' | 'validation' | 'columnMapping' | 'export' | 'settings' | 'upload';

export default function AppNavigator() {
    const { isLocked, setLocked, initializeValidation, isOnboardingDone, setOnboardingDone } = useAppStore();

    const [screen, setScreen] = useState<Screen>(isOnboardingDone ? 'home' : 'onboarding');
    const [isSettingsVisible, setSettingsVisible] = useState(false);
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

    // ── Upload handlers ──────────────────────────────────────────────────────
    const handleUploadImagesReady = (uris: string[]) => {
        useAppStore.getState().setPreprocessedImages(uris);
        useAppStore.getState().setIsBatchMode(uris.length > 1);
        setScreen(uris.length > 1 ? 'batchReview' : 'preview');
    };

    const handleUploadStructuredData = (data: Record<string, unknown>) => {
        useAppStore.getState().initializeValidation(data);
        setScreen('validation');
    };

    const handleUploadTextContent = (text: string) => {
        // Treat extracted text as if it were a scanned image URI (special text URI)
        // Store it as a preprocessed item that BatchProcessingService can consume
        const textUri = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
        useAppStore.getState().setPreprocessedImages([textUri]);
        useAppStore.getState().setIsBatchMode(false);
        setScreen('extraction');
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

    const renderScreen = () => {
        switch (screen) {
            case 'onboarding':
                return (
                    <Animated.View key="onboarding" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <OnboardingScreen
                            onComplete={() => {
                                setOnboardingDone(true);
                                setScreen('home');
                            }}
                        />
                    </Animated.View>
                );
            case 'home':
                return (
                    <Animated.View key="home" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <HomeScreen
                            onStartCapture={handleStartCapture}
                            onOpenSettings={() => setSettingsVisible(true)}
                            onUpload={() => setScreen('upload')}
                        />
                        <SettingsScreen
                            visible={isSettingsVisible}
                            onClose={() => setSettingsVisible(false)}
                        />
                    </Animated.View>
                );
            case 'upload':
                return (
                    <Animated.View key="upload" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <UploadScreen
                            onBack={() => setScreen('home')}
                            onImagesReady={handleUploadImagesReady}
                            onStructuredData={handleUploadStructuredData}
                            onTextContent={handleUploadTextContent}
                        />
                    </Animated.View>
                );
            case 'permission':
                return (
                    <Animated.View key="permission" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <PermissionGate
                            status={permissions.camera === 'blocked' ? 'blocked' : 'denied'}
                            onRequestPermission={handlePermissionRequest}
                        />
                    </Animated.View>
                );
            case 'preview':
                return (
                    <Animated.View key="preview" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <PreviewScreen
                            onRetake={handleRetake}
                            onAccept={handleAccept}
                        />
                    </Animated.View>
                );
            case 'batchReview':
                return (
                    <Animated.View key="batchReview" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <BatchReviewScreen
                            onRetake={handleRetake}
                            onAccept={handleAccept}
                        />
                    </Animated.View>
                );
            case 'extraction':
                return (
                    <Animated.View key="extraction" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <ExtractionScreen
                            onExtractionComplete={handleExtractionComplete}
                            onExtractionError={handleExtractionError}
                        />
                    </Animated.View>
                );
            case 'validation':
                return (
                    <Animated.View key="validation" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <ValidationScreen
                            onBack={() => setScreen('home')}
                            onContinue={() => setScreen('columnMapping')}
                        />
                    </Animated.View>
                );
            case 'columnMapping':
                return (
                    <Animated.View key="columnMapping" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <ColumnMappingScreen
                            onBack={() => setScreen('validation')}
                            onContinue={() => setScreen('export')}
                        />
                    </Animated.View>
                );
            case 'export':
                return (
                    <Animated.View key="export" entering={FadeIn} exiting={FadeOut} style={styles.screen}>
                        <ExportScreen
                            onDone={() => {
                                useAppStore.getState().resetSession();
                                setScreen('home');
                            }}
                        />
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    return (
        <ThemeProvider>
            <AppContent
                isLocked={isLocked}
                renderScreen={renderScreen}
            />
        </ThemeProvider>
    );
}

/** Inner component that consumes theme context for dynamic styling */
function AppContent({
    isLocked,
    renderScreen,
}: {
    isLocked: boolean;
    renderScreen: () => React.ReactNode;
}) {
    const { theme, isDark } = useTheme();

    return (
        <ErrorBoundary>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
                <BottomSheetModalProvider>
                    <ToastProvider>
                        {isLocked && <PrivacyGateScreen />}
                        {!isLocked && renderScreen()}
                    </ToastProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    screen: {
        flex: 1,
    },
});

