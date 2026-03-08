import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface SkeletonBoxProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Industrial Skeleton Loader
 * Features "Scanline" pulse instead of simple fade.
 */
export const SkeletonBox = ({
    width = '100%',
    height = 100,
    borderRadius = 2,
    style,
}: SkeletonBoxProps) => {
    const { theme } = useTheme();
    const scanlinePos = useSharedValue(-20);

    useEffect(() => {
        scanlinePos.value = withRepeat(
            withTiming(120, {
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            -1,
            false
        );
    }, []);

    const scanlineStyle = useAnimatedStyle(() => ({
        top: `${scanlinePos.value}%`,
    }));

    return (
        <View
            style={[
                styles.container,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                },
                style,
            ]}
        >
            {/* Corner Crosshairs (Top Left) */}
            <View style={[styles.corner, styles.tl, { borderColor: theme.primary }]} />
            {/* Corner Crosshairs (Bottom Right) */}
            <View style={[styles.corner, styles.br, { borderColor: theme.primary }]} />

            <View style={styles.overflowHidden}>
                <Animated.View
                    style={[
                        styles.scanline,
                        { backgroundColor: theme.primary, opacity: 0.15 },
                        scanlineStyle,
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    overflowHidden: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 8,
        height: 8,
    },
    tl: {
        top: -1,
        left: -1,
        borderTopWidth: 2,
        borderLeftWidth: 2,
    },
    br: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 2,
        borderRightWidth: 2,
    },
    scanline: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        shadowColor: '#2196F3',
        shadowOpacity: 0.8,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
});
