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
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore, ValidationField } from '../store/useAppStore';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { FieldManipulationSheet } from '../components/FieldManipulationSheet';
import { hapticLight, hapticMedium } from '../utils/haptics';

interface PreviewScreenProps {
    onRetake: () => void;
    onAccept: () => void;
}

export default function PreviewScreen({ onRetake, onAccept }: PreviewScreenProps) {
    const { capture, validation, updateField, mergeFields, splitField, batchUpdateCategory } = useAppStore();
    const { theme, isDark } = useTheme();
    const uri = capture.preprocessedImageUris[0];

    // Interactive correction state
    const [selectedField, setSelectedField] = useState<ValidationField | null>(null);
    const [showManipSheet, setShowManipSheet] = useState(false);

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

    const handleFieldPress = useCallback((field: ValidationField) => {
        setSelectedField(field);
        setShowManipSheet(true);
    }, []);

    if (!uri) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Preview...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Review Scan</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    Pinch to zoom · Double-tap to reset
                </Text>
            </View>

            {/* ── Image Preview with Scaled Overlay ── */}
            <View style={[styles.imageContainer, { backgroundColor: theme.surface, borderColor: theme.border }]} onLayout={handleContainerLayout}>
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
                                selectedFieldId={selectedField?.id}
                                onFieldPress={handleFieldPress}
                            />
                        )}
                    </Animated.View>
                </GestureDetector>

                {/* Field Manipulation Sheet */}
                <FieldManipulationSheet
                    visible={showManipSheet}
                    targetField={selectedField}
                    selectedIds={selectedField ? [selectedField.id] : []}
                    allFields={validation.fields}
                    onClose={() => setShowManipSheet(false)}
                    onSplit={(id, idx) => splitField(id, idx)}
                    onMerge={(src, tgt) => mergeFields(src, tgt)}
                    onBatchCategory={(ids, cat) => {
                        batchUpdateCategory(ids, cat);
                        setSelectedField(null);
                    }}
                />

                {/* Zoom hint badge */}
                {imageDims && (
                    <View style={[styles.dimsBadge, { backgroundColor: theme.surface + 'CC' }]}>
                        <Text style={[styles.dimsText, { color: theme.textSecondary }]}>
                            {imageDims.width} × {imageDims.height} px
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Actions ── */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.retakeButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                    onPress={() => {
                        hapticLight();
                        onRetake();
                    }}
                >
                    <Text style={[styles.buttonText, styles.retakeButtonText, { color: theme.textPrimary }]}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => {
                    hapticMedium();
                    onAccept();
                }}>
                    <Text style={[styles.buttonText, { color: 'white' }]}>Accept & Extract</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeMD,
    },
    header: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
    },
    headerSubtitle: {
        fontSize: Typography.fontSizeSM,
        marginTop: Spacing.xs,
    },
    imageContainer: {
        flex: 1,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    dimsBadge: {
        position: 'absolute',
        bottom: Spacing.sm,
        right: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    dimsText: {
        fontSize: Typography.fontSizeXS,
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    retakeButton: {
        borderWidth: 1,
    },
    retakeButtonText: {
    },
});
