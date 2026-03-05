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
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface SettingsScreenProps {
    onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
    const { settings, updateSettings } = useAppStore();

    const openPrivacyPolicy = () => {
        // Placeholder for an actual privacy policy URL
        Linking.openURL('https://example.com/privacy');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                    <Text style={styles.headerBtnIcon}>←</Text>
                    <Text style={styles.headerBtnText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={styles.headerBtn} /> {/* Balancer */}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Security</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>Anonymous Crash Reporting</Text>
                            <Text style={styles.settingDescription}>
                                Help us improve the app by sending automated, anonymized crash reports. No personal data or document content is ever sent.
                            </Text>
                        </View>
                        <Switch
                            value={settings.anonymousCrashReporting}
                            onValueChange={(val) => updateSettings({ anonymousCrashReporting: val })}
                            trackColor={{ false: Colors.surfaceAlt, true: Colors.primary }}
                            thumbColor={Platform.OS === 'android' ? Colors.surface : undefined}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>Save Original Scans to Camera Roll</Text>
                            <Text style={styles.settingDescription}>
                                Automatically save a copy of your scanned documents to your device's photo library.
                            </Text>
                        </View>
                        <Switch
                            value={settings.saveToCameraRoll}
                            onValueChange={(val) => updateSettings({ saveToCameraRoll: val })}
                            trackColor={{ false: Colors.surfaceAlt, true: Colors.primary }}
                            thumbColor={Platform.OS === 'android' ? Colors.surface : undefined}
                        />
                    </View>

                    <TouchableOpacity style={styles.linkRow} onPress={openPrivacyPolicy}>
                        <Text style={styles.linkLabel}>Privacy Policy</Text>
                        <Text style={styles.linkChevron}>→</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>Exelent Scanner v1.0.0</Text>
                    <Text style={styles.footerText}>100% Offline AI Extraction</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtnIcon: {
        color: Colors.primary,
        fontSize: Typography.fontSizeXL,
        marginRight: Spacing.xs,
        marginTop: -3,
    },
    headerBtnText: {
        color: Colors.primary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    title: {
        flex: 2,
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
    },
    content: {
        padding: Spacing.md,
    },
    section: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingTextContainer: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    settingLabel: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
        marginBottom: 4,
    },
    settingDescription: {
        color: Colors.textMuted,
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
        color: Colors.primary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    linkChevron: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeLG,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeSM,
        marginBottom: 4,
    },
});
