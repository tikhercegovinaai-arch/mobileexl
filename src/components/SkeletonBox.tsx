import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonBoxProps {
    width: number | `${number}%`;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

/**
 * Shimmer skeleton placeholder.
 * Pulses between `surfaceAlt` and `border` for a loading effect.
 */
export default function SkeletonBox({ width, height, borderRadius = 6, style }: SkeletonBoxProps) {
    const { theme } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, [opacity]);

    return (
        <Animated.View
            accessibilityRole="none"
            accessibilityLabel="Loading placeholder"
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.surfaceAlt,
                    opacity,
                },
                style,
            ]}
        />
    );
}
