import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Text,
    SafeAreaView,
    ActivityIndicator,
    LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';

interface PreviewScreenProps {
    onRetake: () => void;
    onAccept: () => void;
}

export default function PreviewScreen({ onRetake, onAccept }: PreviewScreenProps) {
    const { capture, validation } = useAppStore();
    const uri = capture.preprocessedImageUri;

    // Real pixel dimensions of the source image
    const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
    // Layout of the rendered container
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

    // Pinch-to-zoom shared values
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Resolve the actual pixel dimensions once the URI is known
    useEffect(() => {
        if (!uri) return;
        Image.getSize(
            uri,
            (w, h) => setImageDims({ width: w, height: h }),
            () => setImageDims({ width: 1000, height: 1400 }), // fallback
        );
    }, [uri]);

    const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    // Pinch gesture for zoom
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    // Pan gesture for panning while zoomed
    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    // Double-tap to reset
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture);
    const withDoubleTap = Gesture.Exclusive(doubleTap, composed);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

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
                <Text style={styles.headerSubtitle}>
                    Pinch to zoom · Double-tap to reset
                </Text>
            </View>

            {/* ── Image Preview with Scaled Overlay ── */}
            <View style={styles.imageContainer} onLayout={handleContainerLayout}>
                <GestureDetector gesture={withDoubleTap}>
                    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                        <Image
                            source={{ uri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                        {imageDims && containerSize && validation.fields.length > 0 && (
                            <BoundingBoxOverlay
                                imageWidth={imageDims.width}
                                imageHeight={imageDims.height}
                                containerWidth={containerSize.width}
                                containerHeight={containerSize.height}
                                fields={validation.fields}
                            />
                        )}
                    </Animated.View>
                </GestureDetector>

                {/* Zoom hint badge */}
                {imageDims && (
                    <View style={styles.dimsBadge}>
                        <Text style={styles.dimsText}>
                            {imageDims.width} × {imageDims.height} px
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Actions ── */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.retakeButton]}
                    onPress={onRetake}
                >
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
    dimsBadge: {
        position: 'absolute',
        bottom: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: Colors.overlay,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    dimsText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
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
    },
});
