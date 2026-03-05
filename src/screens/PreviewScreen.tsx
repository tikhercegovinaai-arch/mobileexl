import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface PreviewScreenProps {
    onRetake: () => void;
    onAccept: () => void;
}

export default function PreviewScreen({ onRetake, onAccept }: PreviewScreenProps) {
    const { capture } = useAppStore();
    const uri = capture.preprocessedImageUri;

    if (!uri) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading Preview...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Review Scan</Text>
                <Text style={styles.headerSubtitle}>Ensure handwriting is legible</Text>
            </View>

            {/* ── Image Preview ── */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="contain"
                />
                {/* Helper overlay box for debugging bounding margins 
            Later, the Live Preview bounding boxes will be rendered here.
        */}
            </View>

            {/* ── Actions ── */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={onRetake}>
                    <Text style={[styles.buttonText, styles.retakeButtonText]}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={onAccept}>
                    <Text style={styles.buttonText}>Accept & Extract</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeMD,
    },
    header: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    headerTitle: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
    },
    headerSubtitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
        marginTop: Spacing.xs,
    },
    imageContainer: {
        flex: 1,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    retakeButton: {
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    retakeButtonText: {
        color: Colors.textPrimary,
    }
});
