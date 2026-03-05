import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    SafeAreaView,
    Image,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface PermissionGateProps {
    status: 'denied' | 'blocked' | 'undetermined' | 'requesting';
    onRequestPermission: () => void;
}

export default function PermissionGate({
    status,
    onRequestPermission,
}: PermissionGateProps) {
    const isBlocked = status === 'blocked';

    const handleAction = () => {
        if (isBlocked) {
            // Deep-link to the app's system Settings page
            Linking.openSettings();
        } else {
            onRequestPermission();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Icon */}
            <View style={styles.iconWrapper}>
                <Text style={styles.icon}>📷</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Camera Access Required</Text>

            {/* Description */}
            <Text style={styles.description}>
                Exelent needs access to your camera to capture handwritten documents
                for AI extraction. Your images are processed{' '}
                <Text style={styles.bold}>entirely on your device</Text> and are never
                sent to external servers.
            </Text>

            {/* Permission bullets */}
            <View style={styles.bulletList}>
                {[
                    '✓ No cloud uploads — fully offline',
                    '✓ Images are deleted after export',
                    '✓ No third-party access to your data',
                ].map((item) => (
                    <Text key={item} style={styles.bullet}>
                        {item}
                    </Text>
                ))}
            </View>

            {/* Status-specific warning */}
            {isBlocked && (
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                        Camera access was permanently denied. Please enable it in your
                        device Settings to continue.
                    </Text>
                </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleAction}
                activeOpacity={0.85}
            >
                <Text style={styles.buttonText}>
                    {isBlocked ? 'Open Settings' : 'Allow Camera Access'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    iconWrapper: {
        width: 96,
        height: 96,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.lg,
    },
    bold: {
        fontWeight: Typography.fontWeightSemiBold,
        color: Colors.textPrimary,
    },
    bulletList: {
        alignSelf: 'stretch',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    bullet: {
        fontSize: Typography.fontSizeSM,
        color: Colors.success,
        fontWeight: Typography.fontWeightMedium,
    },
    warningBox: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.error,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    warningText: {
        fontSize: Typography.fontSizeSM,
        color: Colors.error,
        lineHeight: 20,
    },
    button: {
        alignSelf: 'stretch',
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
        color: Colors.textPrimary,
    },
});
