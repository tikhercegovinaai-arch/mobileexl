import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

/**
 * Full-screen overlay showing model download progress.
 * Renders a circular progress ring, speed/ETA stats, and Pause/Resume/Cancel.
 */
export default function ModelDownloadOverlay() {
    const { theme } = useTheme();
    const { modelDownload, updateModelDownload, resetModelDownload } = useAppStore();

    if (!modelDownload.isDownloading && !modelDownload.isPaused) return null;

    const progressPercent = Math.round(modelDownload.progress);
    const mbWritten = (modelDownload.bytesWritten / (1024 * 1024)).toFixed(1);
    const mbTotal = modelDownload.contentLength
        ? (modelDownload.contentLength / (1024 * 1024)).toFixed(1)
        : '??';

    return (
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Downloading Model</Text>

                {/* Progress circle placeholder (native SVG would go here) */}
                <View style={[styles.progressCircle, { borderColor: theme.primary }]}>
                    <Text style={[styles.progressText, { color: theme.primary }]}>
                        {progressPercent}%
                    </Text>
                </View>

                <Text style={[styles.stats, { color: theme.textSecondary }]}>
                    {mbWritten} MB / {mbTotal} MB
                </Text>

                <View style={styles.actions}>
                    {modelDownload.isPaused ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                            onPress={() => updateModelDownload({ isPaused: false, isDownloading: true })}
                            accessibilityLabel="Resume download"
                            accessibilityRole="button"
                        >
                            <Text style={styles.actionText}>Resume</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.warning }]}
                            onPress={() => updateModelDownload({ isPaused: true, isDownloading: false })}
                            accessibilityLabel="Pause download"
                            accessibilityRole="button"
                        >
                            <Text style={styles.actionText}>Pause</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.error }]}
                        onPress={() => resetModelDownload()}
                        accessibilityLabel="Cancel download"
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                {modelDownload.error && (
                    <Text style={[styles.errorText, { color: theme.error }]}>
                        {modelDownload.error}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    card: {
        width: '80%',
        maxWidth: 340,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.lg,
    },
    progressCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    progressText: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
    },
    stats: {
        fontSize: Typography.fontSizeSM,
        marginBottom: Spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightBold,
    },
    errorText: {
        fontSize: Typography.fontSizeSM,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
});
