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
import { Colors, Typography, Spacing, BorderRadius, shadow } from '../constants/theme';

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* ── Header ───────────────────────────────────────────── */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View>
                    <Text style={styles.appName}>Exelent</Text>
                    <Text style={styles.tagline}>AI Handwriting → Excel</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings} activeOpacity={0.7}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Hero area ─────────────────────────────────────────── */}
            <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
                <View style={styles.heroIconWrapper}>
                    <Text style={styles.heroIcon}>✍️</Text>
                    <View style={styles.glow} />
                </View>
                <Text style={styles.heroTitle}>Transform Data</Text>
                <Text style={styles.heroSubtitle}>
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
                                transform: [{ translateY: Animated.multiply(slideAnim, (i + 1) * 0.5) }]
                            }
                        ]}
                    >
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <Text style={styles.featureTitle}>{f.title}</Text>
                        <Text style={styles.featureDesc}>{f.description}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim, transform: [{ scale: buttonScale }] }]}>
                <View style={styles.batchToggleContainer}>
                    <Text style={styles.batchToggleLabel}>Batch Mode</Text>
                    <Switch
                        value={isBatchMode}
                        onValueChange={setIsBatchMode}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Colors.textPrimary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.captureButton, isBatchMode && styles.captureButtonBatch]}
                    onPress={() => onStartCapture(isBatchMode)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.captureButtonIcon}>{isBatchMode ? '📑' : '📷'}</Text>
                    <Text style={styles.captureButtonText}>
                        {isBatchMode ? 'Start Batch Capture' : 'Start Capture'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={onUpload}
                    activeOpacity={0.8}
                >
                    <Text style={styles.uploadButtonIcon}>☁️</Text>
                    <Text style={styles.uploadButtonText}>Upload File</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Footer ───────────────────────────────────────────── */}
            <Text style={styles.footer}>Local Neural Engine · GDPR Ready</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: Typography.fontSizeSM,
        color: Colors.textMuted,
        marginTop: 2,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
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
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.primary + '44',
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
        backgroundColor: Colors.primary + '10',
        zIndex: -1,
    },
    heroIcon: {
        fontSize: 44,
    },
    heroTitle: {
        fontSize: Typography.fontSize3XL,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textSecondary,
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
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.xs,
    },
    featureIcon: {
        fontSize: 24,
        marginBottom: 2,
    },
    featureTitle: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
        color: Colors.textPrimary,
    },
    featureDesc: {
        fontSize: 10,
        color: Colors.textMuted,
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
        color: Colors.textSecondary,
        fontWeight: Typography.fontWeightMedium,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.lg,
        ...shadow(Colors.primary, 4, 12, 0.3, 6),
    },
    captureButtonBatch: {
        backgroundColor: Colors.secondary,
        ...shadow(Colors.secondary, 4, 12, 0.3, 6),
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
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...shadow('#000', 2, 8, 0.15, 3),
    },
    uploadButtonIcon: {
        fontSize: Typography.fontSizeLG,
    },
    uploadButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },

    footer: {
        textAlign: 'center',
        fontSize: 10,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
});

