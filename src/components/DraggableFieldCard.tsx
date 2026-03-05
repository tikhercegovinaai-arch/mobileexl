import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { ValidationField } from '../store/useAppStore';

interface DraggableFieldCardProps {
    field: ValidationField;
    onEdit?: (field: ValidationField) => void;
    onDrop?: (field: ValidationField, x: number, y: number) => void;
}

export const DraggableFieldCard: React.FC<DraggableFieldCardProps> = ({
    field,
    onEdit,
    onDrop
}) => {
    const isDragging = useSharedValue(false);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
        })
        .onUpdate((event) => {
            translationX.value = event.translationX;
            translationY.value = event.translationY;
        })
        .onEnd((event) => {
            isDragging.value = false;
            if (onDrop) {
                runOnJS(onDrop)(field, event.absoluteX, event.absoluteY);
            }
            translationX.value = withSpring(0);
            translationY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: isDragging.value ? 1.05 : 1 },
        ],
        zIndex: isDragging.value ? 100 : 1,
        elevation: isDragging.value ? 5 : 0,
        shadowOpacity: isDragging.value ? 0.3 : 0,
    }));

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return Colors.success;
        if (confidence >= 0.7) return Colors.warning;
        return Colors.error;
    };

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <View style={[styles.indicator, { backgroundColor: getConfidenceColor(field.confidence) }]} />
                <View style={styles.content}>
                    <Text style={styles.label}>{field.label}</Text>
                    <Text style={styles.value} numberOfLines={1}>{field.value}</Text>
                </View>
                <TouchableOpacity onPress={() => onEdit?.(field)} style={styles.editButton}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        marginVertical: Spacing.xs,
        padding: Spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    indicator: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: Spacing.sm,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: Typography.fontSizeXS,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textPrimary,
        fontWeight: Typography.fontWeightMedium,
        marginTop: 2,
    },
    editButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    editText: {
        fontSize: Typography.fontSizeXS,
        color: Colors.primary,
        fontWeight: Typography.fontWeightSemiBold,
    },
});
