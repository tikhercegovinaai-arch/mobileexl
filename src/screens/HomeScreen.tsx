import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Switch,
    Animated,
} from 'react-native';
import { Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import AnalyticsScreen from './AnalyticsScreen';
import HistoryScreen from './HistoryScreen';
import ModelDownloadOverlay from '../components/ModelDownloadOverlay';
import PermissionGate from '../components/PermissionGate';
import ErrorBoundary from '../components/ErrorBoundary';
import { hapticMedium, hapticLight } from '../utils/haptics';
import { enforceSecurityPolicy } from '../utils/security';
import { TechnicalButton } from '../components/TechnicalButton';


interface HomeScreenProps {
    onStartCapture: (isBatch: boolean) => void;
    onOpenSettings: () => void;
    onUpload: () => void;
    onViewAnalytics: () => void;
    onViewHistory: () => void;
}

const FEATURES = [
    {
        icon: '📷',
        title: 'Smart Capture',
        description: 'Auto-align and scan handwritten documents',
    },
    {
        icon: '🤖',
        title: 'On-Device AI',
        description: 'Extract text privately — no internet required',
    },
    {
        icon: '📊',
        title: 'Excel Export',
        description: 'Structured data into .xlsx files',
    },
];

export default function HomeScreen({ onStartCapture, onOpenSettings, onUpload, onViewAnalytics, onViewHistory }: HomeScreenProps) {
    const [isBatchMode, setIsBatchMode] = useState(false);
    const { theme, isDark } = useTheme();

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const buttonScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.spring(buttonScale, {
                toValue: 1,
                tension: 50,
                friction: 5,
                delay: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            {/* ── Header ───────────────────────────────────────────── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View>
                    <Text style={[styles.appName, styles.monoText, { color: theme.textPrimary }]}>EXELENT_OS_1.0</Text>
                    <Text style={[styles.tagline, styles.monoText, { color: theme.textMuted }]}>NEURAL_HANDWRITING_EXTRACTOR</Text>
                </View>
                <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { hapticLight(); onOpenSettings(); }} activeOpacity={0.7}>
                    <Text style={[styles.settingsIcon, { color: theme.textPrimary }]}>[CONFIG]</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Hero area ─────────────────────────────────────────── */}
            <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
                <View style={[styles.heroIconWrapper, { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }]}>
                    <View style={[styles.crosshair, styles.tl, { borderColor: theme.primary }]} />
                    <View style={[styles.crosshair, styles.br, { borderColor: theme.primary }]} />
                    <Text style={styles.heroIcon}>[AI]</Text>
                </View>
                <Text style={[styles.heroTitle, styles.monoText, { color: theme.textPrimary }]}>DATA_TRANSFORM_CORE</Text>
                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                    Capture handwritten logs. Execute neural extraction.
                    Generate structured CSV/XLSX partitions.
                </Text>
            </Animated.View>

            {/* ── Feature cards ─────────────────────────────────────── */}
            <View style={styles.featureRow}>
                {FEATURES.map((f, i) => (
                    <Animated.View
                        key={f.title}
                        style={[
                            styles.featureCard,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: Animated.multiply(slideAnim, (i + 1) * 0.5) }],
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                            }
                        ]}
                    >
                        <Text style={[styles.featureTitle, styles.monoText, { color: theme.primary }]}>{f.title.toUpperCase()}</Text>
                        <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{f.description}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim, transform: [{ scale: buttonScale }] }]}>
                <View style={styles.batchToggleContainer}>
                    <Text style={[styles.batchToggleLabel, styles.monoText, { color: theme.textSecondary }]}>MODE_BATCH</Text>
                    <Switch
                        value={isBatchMode}
                        onValueChange={setIsBatchMode}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={theme.textPrimary}
                    />
                </View>

                <TechnicalButton
                    label={isBatchMode ? '> EXECUTE_BATCH_SCAN' : '> EXECUTE_SCAN'}
                    variant="primary"
                    onPress={async () => {
                        const isSecure = await enforceSecurityPolicy();
                        if (isSecure) {
                            onStartCapture(isBatchMode);
                        }
                    }}
                    style={{ marginBottom: Spacing.lg }}
                />

                <TechnicalButton
                    label="[IMPORT_EXTERNAL_DATA]"
                    variant="outline"
                    onPress={onUpload}
                    style={{ marginBottom: Spacing.md }}
                />

                <TechnicalButton
                    label="[VIEW_SYSTEM_ANALYTICS]"
                    variant="outline"
                    onPress={onViewAnalytics}
                    style={{ marginBottom: Spacing.md }}
                />

                <TechnicalButton
                    label="[VIEW_EXTRACTION_HISTORY]"
                    variant="outline"
                    onPress={onViewHistory}
                />
            </Animated.View>

            {/* ── Footer ───────────────────────────────────────────── */}
            <Text style={[styles.footer, styles.monoText, { color: theme.textMuted }]}>STATUS: SECURE | NEURAL_LINK: ACTIVE | GDPR: [OK]</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    appName: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 9,
        marginTop: 4,
        letterSpacing: 1,
    },
    settingsButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
    },
    settingsIcon: {
        fontSize: 10,
        fontWeight: '900',
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroIconWrapper: {
        width: 80,
        height: 80,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        position: 'relative',
    },
    crosshair: {
        position: 'absolute',
        width: 10,
        height: 10,
    },
    tl: {
        top: -2,
        left: -2,
        borderTopWidth: 2,
        borderLeftWidth: 2,
    },
    br: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 2,
        borderRightWidth: 2,
    },
    heroIcon: {
        fontSize: 20,
        fontWeight: '900',
        fontFamily: 'Courier',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
        fontWeight: '600',
        opacity: 0.8,
    },

    // Feature cards
    featureRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        flex: 1,
        borderRadius: 0,
        padding: Spacing.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
        gap: 4,
    },
    featureTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    featureDesc: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '600',
    },

    // CTA
    ctaContainer: {
        width: '100%',
    },
    batchToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    batchToggleLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: 0,
        paddingVertical: 18,
        marginBottom: Spacing.lg,
    },
    captureButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: 0,
        paddingVertical: 12,
        borderWidth: 1,
    },
    uploadButtonText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    monoText: {
        fontFamily: 'Courier',
        fontWeight: '700',
    },
    footer: {
        textAlign: 'center',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
});

