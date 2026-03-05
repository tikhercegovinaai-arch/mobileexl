import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Switch,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface HomeScreenProps {
    onStartCapture: (isBatch: boolean) => void;
    onOpenSettings: () => void;
}

const FEATURES = [
    {
        icon: '📷',
        title: 'Smart Capture',
        description: 'Auto-align and scan handwritten documents with precision',
    },
    {
        icon: '🤖',
        title: 'On-Device AI',
        description: 'Extract text privately — no internet required',
    },
    {
        icon: '📊',
        title: 'Excel Export',
        description: 'Structured data injected directly into .xlsx files',
    },
];

export default function HomeScreen({ onStartCapture, onOpenSettings }: HomeScreenProps) {
    const [isBatchMode, setIsBatchMode] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

            {/* ── Header ───────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.appName}>Exelent</Text>
                    <Text style={styles.tagline}>AI Handwriting → Excel</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* ── Hero area ─────────────────────────────────────────── */}
            <View style={styles.hero}>
                <View style={styles.heroIconWrapper}>
                    <Text style={styles.heroIcon}>✍️</Text>
                </View>
                <Text style={styles.heroTitle}>Capture & Extract</Text>
                <Text style={styles.heroSubtitle}>
                    Point your camera at any handwritten document and let on-device AI
                    transform it into structured spreadsheet data — privately.
                </Text>
            </View>

            {/* ── Feature cards ─────────────────────────────────────── */}
            <View style={styles.featureRow}>
                {FEATURES.map((f) => (
                    <View key={f.title} style={styles.featureCard}>
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <Text style={styles.featureTitle}>{f.title}</Text>
                        <Text style={styles.featureDesc}>{f.description}</Text>
                    </View>
                ))}
            </View>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <View style={styles.batchToggleContainer}>
                <Text style={styles.batchToggleLabel}>Batch Mode</Text>
                <Switch
                    value={isBatchMode}
                    onValueChange={setIsBatchMode}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.card}
                />
            </View>

            <TouchableOpacity
                style={styles.captureButton}
                onPress={() => onStartCapture(isBatchMode)}
                activeOpacity={0.85}
            >
                <Text style={styles.captureButtonIcon}>{isBatchMode ? '📑' : '📷'}</Text>
                <Text style={styles.captureButtonText}>
                    {isBatchMode ? 'Start Batch Capture' : 'Start Capture'}
                </Text>
            </TouchableOpacity>

            {/* ── Footer ───────────────────────────────────────────── */}
            <Text style={styles.footer}>All data processed on-device · GDPR Ready</Text>
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
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        fontSize: 22,
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: BorderRadius.xl,
        backgroundColor: `${Colors.primary}22`,
        borderWidth: 1,
        borderColor: `${Colors.primary}55`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
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
        fontSize: Typography.fontSizeXS,
        color: Colors.textMuted,
        lineHeight: 16,
    },

    // CTA
    batchToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
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
        paddingVertical: Spacing.md + 2,
        marginBottom: Spacing.lg,
    },
    captureButtonIcon: {
        fontSize: Typography.fontSizeLG,
    },
    captureButtonText: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightSemiBold,
        color: Colors.textPrimary,
    },

    footer: {
        textAlign: 'center',
        fontSize: Typography.fontSizeXS,
        color: Colors.textMuted,
        marginBottom: Spacing.md,
    },
});
