import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    Linking,
    Platform,
    ScrollView,
} from 'react-native';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore, ThemeMode } from '../store/useAppStore';
import { useTheme } from '../context/ThemeContext';

interface SettingsScreenProps {
    onBack: () => void;
}

const themeModes: { label: string; value: ThemeMode }[] = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
    { label: 'System', value: 'system' },
];

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
    const { settings, updateSettings } = useAppStore();
    const { theme } = useTheme();

    const openPrivacyPolicy = () => {
        Linking.openURL('https://example.com/privacy');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.headerBtn}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Text style={[styles.headerBtnIcon, { color: theme.primary }]}>←</Text>
                    <Text style={[styles.headerBtnText, { color: theme.primary }]}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ── Appearance ────────────────────────────────────────────── */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>

                    <Text style={[styles.settingLabel, { color: theme.textPrimary, marginBottom: Spacing.sm }]}>Theme</Text>
                    <View style={styles.segmentedRow}>
                        {themeModes.map((mode) => {
                            const isActive = settings.themeMode === mode.value;
                            return (
                                <TouchableOpacity
                                    key={mode.value}
                                    onPress={() => updateSettings({ themeMode: mode.value })}
                                    style={[
                                        styles.segmentBtn,
                                        { borderColor: theme.border },
                                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    accessibilityLabel={`Set theme to ${mode.label}`}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive }}
                                >
                                    <Text
                                        style={[
                                            styles.segmentLabel,
                                            { color: theme.textSecondary },
                                            isActive && { color: '#FFFFFF', fontWeight: Typography.fontWeightBold },
                                        ]}
                                    >
                                        {mode.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Privacy & Security ────────────────────────────────────── */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Privacy & Security</Text>

                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Anonymous Crash Reporting</Text>
                            <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                                Help us improve the app by sending automated, anonymized crash reports. No personal data or document content is ever sent.
                            </Text>
                        </View>
                        <Switch
                            value={settings.anonymousCrashReporting}
                            onValueChange={(val) => updateSettings({ anonymousCrashReporting: val })}
                            trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
                            thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Save Original Scans to Camera Roll</Text>
                            <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                                Automatically save a copy of your scanned documents to your device's photo library.
                            </Text>
                        </View>
                        <Switch
                            value={settings.saveToCameraRoll}
                            onValueChange={(val) => updateSettings({ saveToCameraRoll: val })}
                            trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
                            thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Require Biometric on Export</Text>
                            <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                                Require Face ID / fingerprint before exporting or sharing data.
                            </Text>
                        </View>
                        <Switch
                            value={settings.requireBiometricOnExport}
                            onValueChange={(val) => updateSettings({ requireBiometricOnExport: val })}
                            trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
                            thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Haptic Feedback</Text>
                            <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                                Enable vibration feedback on button presses and interactions.
                            </Text>
                        </View>
                        <Switch
                            value={settings.hapticsEnabled}
                            onValueChange={(val) => updateSettings({ hapticsEnabled: val })}
                            trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
                            thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
                        />
                    </View>

                    <TouchableOpacity style={styles.linkRow} onPress={openPrivacyPolicy}>
                        <Text style={[styles.linkLabel, { color: theme.primary }]}>Privacy Policy</Text>
                        <Text style={[styles.linkChevron, { color: theme.textMuted }]}>→</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerInfo}>
                    <Text style={[styles.footerText, { color: theme.textMuted }]}>Exelent Scanner v1.0.0</Text>
                    <Text style={[styles.footerText, { color: theme.textMuted }]}>100% Offline AI Extraction</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    headerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtnIcon: {
        fontSize: Typography.fontSizeXL,
        marginRight: Spacing.xs,
        marginTop: -3,
    },
    headerBtnText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    title: {
        flex: 2,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
    },
    content: {
        padding: Spacing.md,
    },
    section: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    segmentedRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    segmentBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    segmentLabel: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    settingTextContainer: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    settingLabel: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: Typography.fontSizeSM,
        lineHeight: 20,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    linkLabel: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    linkChevron: {
        fontSize: Typography.fontSizeLG,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    footerText: {
        fontSize: Typography.fontSizeSM,
        marginBottom: 4,
    },
});
