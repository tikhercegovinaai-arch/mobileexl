import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { ValidationField } from '../store/useAppStore';

// Animated SVG Rect for pulsing low-confidence fields
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface BoundingBoxOverlayProps {
    /** Actual pixel width of the source image */
    imageWidth: number;
    /** Actual pixel height of the source image */
    imageHeight: number;
    /** Width of the rendered container (logical pixels) */
    containerWidth: number;
    /** Height of the rendered container (logical pixels) */
    containerHeight: number;
    fields: ValidationField[];
    selectedFieldId?: string | null;
    onFieldPress?: (field: ValidationField) => void;
}

/** Returns green/yellow/red colour based on confidence 0–1 */
const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return Colors.success;
    if (confidence >= 0.7) return Colors.warning;
    return Colors.error;
};

/** Gradient ID prefix per field so each gets a unique SVG gradient */
const gradientId = (fieldId: string) => `grad_${fieldId.replace(/[^a-zA-Z0-9]/g, '_')}`;

// ─── Single animated field overlay ───────────────────────────────────────────

interface FieldBoxProps {
    field: ValidationField;
    scale: number;
    isSelected: boolean;
    onPress?: () => void;
}

function FieldBox({ field, scale, isSelected, onPress }: FieldBoxProps) {
    const opacity = useSharedValue(1);
    const isLow = field.confidence < 0.7;

    useEffect(() => {
        if (isLow) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                false,
            );
        } else {
            opacity.value = 1;
        }
    }, [isLow]);

    const animatedProps = useAnimatedProps(() => ({
        fillOpacity: opacity.value * 0.25,
    }));

    if (!field.boundingBox) return null;

    const { x, y, width, height } = field.boundingBox;
    const sx = x * scale;
    const sy = y * scale;
    const sw = width * scale;
    const sh = height * scale;
    const color = getConfidenceColor(field.confidence);
    const gid = gradientId(field.id);

    return (
        <G key={field.id}>
            {/* Gradient definition (inline per field so colours are self-contained) */}
            <Defs>
                <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
                </LinearGradient>
            </Defs>

            {/* Animated heat-map fill */}
            <AnimatedRect
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                fill={`url(#${gid})`}
                rx="4"
                animatedProps={animatedProps}
            />

            {/* Static border — thicker when selected */}
            <Rect
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                stroke={isSelected ? Colors.primary : color}
                strokeWidth={isSelected ? 3 : 1.5}
                fill="none"
                rx="4"
            />

            {/* Confidence badge */}
            <Rect
                x={sx}
                y={sy - 14}
                width={34}
                height={13}
                fill={color}
                rx="2"
            />
            <SvgText
                x={sx + 4}
                y={sy - 4}
                fontSize="8"
                fill="white"
                fontWeight="bold"
            >
                {Math.round(field.confidence * 100)}%
            </SvgText>

            {/* Transparent overlay for reliable cross-platform touch handling */}
            <Rect
                x={sx}
                y={sy - 14}
                width={Math.max(sw, 34)}
                height={sh + 14}
                fill="transparent"
                {...(Platform.OS === 'web' ? { onClick: onPress } as any : { onPress })}
            />
        </G>
    );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
    imageWidth,
    imageHeight,
    containerWidth,
    containerHeight,
    fields,
    selectedFieldId,
    onFieldPress,
}) => {
    // Uniform scale that fits imageWidth → containerWidth
    const scale = containerWidth / imageWidth;

    return (
        <View style={[StyleSheet.absoluteFill, styles.container]}>
            <Svg
                width={containerWidth}
                height={containerHeight}
                viewBox={`0 0 ${containerWidth} ${containerHeight}`}
            >
                {fields.map((field) => (
                    <FieldBox
                        key={field.id}
                        field={field}
                        scale={scale}
                        isSelected={field.id === selectedFieldId}
                        onPress={() => onFieldPress?.(field)}
                    />
                ))}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        pointerEvents: 'box-none',
    },
});
