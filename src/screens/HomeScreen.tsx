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
import { hapticMedium, hapticLight } from '../utils/haptics';
import { enforceSecurityPolicy } from '../utils/security';

interface HomeScreenProps {
    onStartCapture: (isBatch: boolean) => void;
    onOpenSettings: () => void;
    onUpload: () => void;
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

export default function HomeScreen({ onStartCapture, onOpenSettings, onUpload }: HomeScreenProps) {
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
                    <Text style={[styles.appName, { color: theme.textPrimary }]}>Exelent</Text>
                    <Text style={[styles.tagline, { color: theme.textMuted }]}>AI Handwriting → Excel</Text>
                </View>
                <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { hapticLight(); onOpenSettings(); }} activeOpacity={0.7}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Hero area ─────────────────────────────────────────── */}
            <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
                <View style={[styles.heroIconWrapper, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
                    <Text style={styles.heroIcon}>✍️</Text>
                    <View style={[styles.glow, { backgroundColor: theme.primary + '10' }]} />
                </View>
                <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Transform Data</Text>
                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                    Point your camera at handwritten documents and let AI
                    convert them into structured tables — privately.
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
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{f.title}</Text>
                        <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{f.description}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim, transform: [{ scale: buttonScale }] }]}>
                <View style={styles.batchToggleContainer}>
                    <Text style={[styles.batchToggleLabel, { color: theme.textSecondary }]}>Batch Mode</Text>
                    <Switch
                        value={isBatchMode}
                        onValueChange={setIsBatchMode}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={theme.textPrimary}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.captureButton, 
                        { backgroundColor: theme.primary, ...shadow(theme.primary, 4, 12, 0.3, 6) } as any,
                        isBatchMode && { backgroundColor: theme.secondary, ...shadow(theme.secondary, 4, 12, 0.3, 6) } as any
                    ]}
                    onPress={async () => {
                        hapticMedium();
                        const isSecure = await enforceSecurityPolicy();
                        if (isSecure) {
                            onStartCapture(isBatchMode);
                        }
                    }}
                    activeOpacity={0.85}
                >
                    <Text style={styles.captureButtonIcon}>{isBatchMode ? '📑' : '📷'}</Text>
                    <Text style={styles.captureButtonText}>
                        {isBatchMode ? 'Start Batch Capture' : 'Start Capture'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                    onPress={() => {
                        hapticMedium();
                        onUpload();
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={styles.uploadButtonIcon}>☁️</Text>
                    <Text style={[styles.uploadButtonText, { color: theme.textSecondary }]}>Upload File</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Footer ───────────────────────────────────────────── */}
            <Text style={[styles.footer, { color: theme.textMuted }]}>Local Neural Engine · GDPR Ready</Text>
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
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: Typography.fontSizeSM,
        marginTop: 2,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    settingsIcon: {
        fontSize: 20,
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        zIndex: -1,
    },
    heroIcon: {
        fontSize: 44,
    },
    heroTitle: {
        fontSize: Typography.fontSize3XL,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },

    // Feature cards
    featureRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        flex: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    featureIcon: {
        fontSize: 24,
        marginBottom: 2,
    },
    featureTitle: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },
    featureDesc: {
        fontSize: 10,
        lineHeight: 14,
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
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    captureButtonIcon: {
        fontSize: Typography.fontSizeLG,
    },
    captureButtonText: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        color: 'white',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1.5,
        ...shadow('#000', 2, 8, 0.15, 3),
    },
    uploadButtonIcon: {
        fontSize: Typography.fontSizeLG,
    },
    uploadButtonText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },

    footer: {
        textAlign: 'center',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
});

