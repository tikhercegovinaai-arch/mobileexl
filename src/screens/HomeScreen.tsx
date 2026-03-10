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
    Platform
} from 'react-native';
import { Spacing, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Camera, Brain, FileSpreadsheet, Settings } from 'lucide-react-native';
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
        icon: Camera,
        title: 'Smart Capture',
        description: 'Auto-align and scan handwritten documents',
    },
    {
        icon: Brain,
        title: 'On-Device AI',
        description: 'Extract text privately — no internet required',
    },
    {
        icon: FileSpreadsheet,
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
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(buttonScale, {
                toValue: 1,
                tension: 50,
                friction: 5,
                delay: 400,
                useNativeDriver: Platform.OS !== 'web',
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
                </View>
                <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { hapticLight(); onOpenSettings(); }} activeOpacity={0.7} testID="home-settings-button">
                    <Settings size={20} color={theme.textPrimary} />
                </TouchableOpacity>
            </Animated.View>

            {/* ── Hero area ─────────────────────────────────────────── */}
            <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
                <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Transform handwriting into structured data</Text>
                <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                    Capture logs, execute on-device neural extraction, and generate precise Excel partitions instantly.
                </Text>
            </Animated.View>

            {/* ── Feature cards ─────────────────────────────────────── */}
            <View style={styles.featureColumn}>
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
                        <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '15' }]}>
                            <f.icon size={24} color={theme.primary} />
                        </View>
                        <View style={styles.featureTextWrapper}>
                            <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{f.title}</Text>
                            <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{f.description}</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>

            <View style={{ flex: 1 }} />

            {/* ── CTA ───────────────────────────────────────────────── */}
            <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim, transform: [{ scale: buttonScale }] }]}>
                <View style={styles.batchToggleContainer}>
                    <Text style={[styles.batchToggleLabel, { color: theme.textSecondary }]}>BATCH MODE</Text>
                    <Switch
                        value={isBatchMode}
                        onValueChange={setIsBatchMode}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={theme.textPrimary}
                        testID="home-batch-mode-switch"
                    />
                </View>
                <TechnicalButton
                    label="Start Extraction"
                    variant="primary"
                    onPress={async () => {
                        const isSecure = await enforceSecurityPolicy();
                        if (isSecure) {
                            onStartCapture(isBatchMode);
                        }
                    }}
                    style={{ marginBottom: Spacing.md }}
                    testID="home-execute-scan-button"
                />

                <TechnicalButton
                    label="Import External Data"
                    variant="outline"
                    onPress={onUpload}
                    style={{ marginBottom: Spacing.xl }}
                    testID="home-import-button"
                />
            </Animated.View>

            {/* ── Footer ───────────────────────────────────────────── */}
            <Text style={[styles.footer, { color: theme.textMuted }]}>SECURE • ON-DEVICE • PRIVATE</Text>
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
        paddingTop: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    appName: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: Spacing.md,
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
        fontWeight: '500',
    },

    // Feature cards
    featureColumn: {
        flexDirection: 'column',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: Spacing.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    featureTextWrapper: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
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
        marginBottom: Spacing.md,
    },
    batchToggleLabel: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    // Footer
    footer: {
        fontSize: 12,
        textAlign: 'center',
        paddingBottom: Spacing.lg,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
