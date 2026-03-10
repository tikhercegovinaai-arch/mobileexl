import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import { Spacing, shadow } from '../constants/theme';

/**
 * Premium Industrial-themed overlay for AI model downloads.
 * Uses a bottom-docked utilitarian aesthetic consistent with the extraction screen.
 */
export default function ModelDownloadOverlay() {
    const { modelDownload, updateModelDownload, resetModelDownload } = useAppStore();
    const { theme } = useTheme();
    const slideAnim = useRef(new Animated.Value(200)).current;

    const isVisible = modelDownload.isDownloading || modelDownload.isPaused;

    useEffect(() => {
        if (isVisible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 200,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        }
    }, [isVisible]);

    if (!isVisible && slideAnim.valueOf() === 200) return null;

    const progressPercent = Math.round(modelDownload.progress);
    const mbDownloaded = (modelDownload.bytesWritten / (1024 * 1024)).toFixed(1);
    const mbTotal = modelDownload.contentLength
        ? (modelDownload.contentLength / (1024 * 1024)).toFixed(1)
        : '??';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <View style={[styles.statusIndicator, { backgroundColor: modelDownload.isPaused ? theme.warning : theme.primary }]} />
                    <Text style={[styles.title, { color: theme.textPrimary }]}>AI_MODEL_SYNC</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {modelDownload.isPaused ? '[PAUSED]' : '[ACTIVE]'}
                    </Text>
                </View>
                <Text style={[styles.percentage, { color: theme.primary }]}>{progressPercent}%</Text>
            </View>

            <View style={[styles.progressBg, { backgroundColor: theme.surfaceAlt }]}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            backgroundColor: theme.primary,
                            width: `${modelDownload.progress}%`
                        }
                    ]}
                />
            </View>

            <View style={styles.footer}>
                <Text style={[styles.stats, { color: theme.textMuted }]}>
                    DL_SIZE: {mbDownloaded}MB / {mbTotal}MB
                </Text>
                <View style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: theme.border }]}
                        onPress={() => updateModelDownload({ isPaused: !modelDownload.isPaused, isDownloading: !!modelDownload.isPaused })}
                    >
                        <Text style={[styles.actionText, { color: theme.textPrimary }]}>
                            {modelDownload.isPaused ? 'RESUME' : 'PAUSE'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: theme.error, marginLeft: Spacing.sm }]}
                        onPress={() => resetModelDownload()}
                    >
                        <Text style={[styles.actionText, { color: theme.error }]}>ABORT</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {modelDownload.error && (
                <View style={[styles.errorBox, { backgroundColor: theme.error + '11' }]}>
                    <Text style={[styles.error, { color: theme.error }]}>
                        CRC_CHECK_FAILED: {modelDownload.error}
                    </Text>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        padding: Spacing.lg,
        borderWidth: 1,
        borderRadius: 2,
        ...shadow('#000000', 4, 12, 0.3, 8),
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: Spacing.md,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 6,
        height: 6,
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 8,
        fontFamily: 'Courier',
    },
    percentage: {
        fontSize: 18,
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
    progressBg: {
        height: 4,
        width: '100%',
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stats: {
        fontSize: 9,
        fontFamily: 'Courier',
        fontWeight: '700',
    },
    actionGroup: {
        flexDirection: 'row',
    },
    actionButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderWidth: 1,
        borderRadius: 1,
    },
    actionText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    errorBox: {
        marginTop: Spacing.sm,
        padding: 4,
        borderLeftWidth: 2,
        borderLeftColor: 'red',
    },
    error: {
        fontSize: 9,
        fontWeight: 'bold',
        fontFamily: 'Courier',
    },
});
