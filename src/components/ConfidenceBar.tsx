import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface ConfidenceBarProps {
    /** Confidence score between 0 and 1 */
    confidence: number;
    /** Show numeric label (default true) */
    showLabel?: boolean;
}

/**
 * Color-coded confidence bar.
 * - ≥ 0.85  → success (green)
 * - 0.60–0.84 → warning (amber)
 * - < 0.60  → error (red)
 *
 * Animates fill width on mount.
 */
export default function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
    const { theme } = useTheme();
    const animWidth = useRef(new Animated.Value(0)).current;
    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    let barColor: string;
    let statusLabel: string;
    if (clampedConfidence >= 0.85) {
        barColor = theme.success;
        statusLabel = 'High';
    } else if (clampedConfidence >= 0.6) {
        barColor = theme.warning;
        statusLabel = 'Review';
    } else {
        barColor = theme.error;
        statusLabel = 'Low';
    }

    useEffect(() => {
        Animated.timing(animWidth, {
            toValue: clampedConfidence,
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, [clampedConfidence, animWidth]);

    const fillWidth = animWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View
            style={styles.wrapper}
            accessibilityLabel={`Confidence ${Math.round(clampedConfidence * 100)}%, ${statusLabel}`}
            accessibilityRole="progressbar"
        >
            <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
                <Animated.View
                    style={[
                        styles.fill,
                        { backgroundColor: barColor, width: fillWidth },
                    ]}
                />
            </View>
            {showLabel && (
                <Text style={[styles.label, { color: barColor }]}>
                    {Math.round(clampedConfidence * 100)}%
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    track: {
        flex: 1,
        height: 6,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    label: {
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightSemiBold,
        minWidth: 32,
        textAlign: 'right',
    },
});
