import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { ValidationField } from '../store/useAppStore';

interface DraggableFieldCardProps {
    field: ValidationField;
    isSelected?: boolean;
    onEdit?: (field: ValidationField) => void;
    onDrop?: (field: ValidationField, x: number, y: number) => void;
    onLongPress?: (field: ValidationField) => void;
    onToggleSelect?: (field: ValidationField) => void;
}

const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return Colors.success;
    if (confidence >= 0.7) return Colors.warning;
    return Colors.error;
};

export const DraggableFieldCard: React.FC<DraggableFieldCardProps> = ({
    field,
    isSelected = false,
    onEdit,
    onDrop,
    onLongPress,
    onToggleSelect,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [editValue, setEditValue] = useState(field.value);

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

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onEnd(() => {
            if (onLongPress) runOnJS(onLongPress)(field);
        });

    const composed = Gesture.Exclusive(longPressGesture, gesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: isDragging.value ? 1.05 : 1 },
        ],
        zIndex: isDragging.value ? 100 : 1,
        elevation: isDragging.value ? 8 : 0,
        shadowOpacity: isDragging.value ? 0.35 : 0,
        shadowRadius: isDragging.value ? 10 : 0,
    }));

    const confidenceColor = getConfidenceColor(field.confidence);

    const handleEditSave = () => {
        onEdit?.({ ...field, value: editValue });
        setEditMode(false);
    };

    return (
        <GestureDetector gesture={composed}>
            <Animated.View
                style={[
                    styles.card,
                    animatedStyle,
                    isSelected && styles.cardSelected,
                ]}
            >
                {/* Confidence bar */}
                <View style={[styles.indicator, { backgroundColor: confidenceColor }]} />

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.label}>{field.label}</Text>
                        <View style={styles.confidencePill}>
                            <View style={[styles.pillDot, { backgroundColor: confidenceColor }]} />
                            <Text style={[styles.pillText, { color: confidenceColor }]}>
                                {Math.round(field.confidence * 100)}%
                            </Text>
                        </View>
                    </View>

                    {editMode ? (
                        <View style={styles.editRow}>
                            <TextInput
                                style={styles.editInput}
                                value={editValue}
                                onChangeText={setEditValue}
                                onSubmitEditing={handleEditSave}
                                autoFocus
                                returnKeyType="done"
                            />
                            <TouchableOpacity onPress={handleEditSave} style={styles.saveButton}>
                                <Text style={styles.saveText}>✓</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.value} numberOfLines={1}>
                            {field.value}
                        </Text>
                    )}

                    {field.category ? (
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{field.category}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Right actions */}
                {!editMode && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => {
                                setEditValue(field.value);
                                setEditMode(true);
                            }}
                            style={styles.actionButton}
                        >
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        {onToggleSelect && (
                            <TouchableOpacity
                                onPress={() => onToggleSelect(field)}
                                style={[styles.checkBox, isSelected && styles.checkBoxSelected]}
                            >
                                {isSelected && <Text style={styles.checkMark}>✓</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
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
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
    },
    cardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '18',
    },
    indicator: {
        width: 4,
        alignSelf: 'stretch',
        borderRadius: 2,
        marginRight: Spacing.sm,
    },
    content: {
        flex: 1,
        gap: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: Typography.fontSizeXS,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        flex: 1,
    },
    confidencePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    pillDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    pillText: {
        fontSize: 10,
        fontWeight: Typography.fontWeightBold,
    },
    value: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textPrimary,
        fontWeight: Typography.fontWeightMedium,
    },
    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.secondary + '33',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.secondary + '66',
    },
    categoryTagText: {
        color: Colors.secondary,
        fontSize: 9,
        fontWeight: Typography.fontWeightSemiBold,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    editInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.primary,
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        fontSize: Typography.fontSizeMD,
    },
    saveButton: {
        backgroundColor: Colors.success,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveText: {
        color: 'white',
        fontWeight: Typography.fontWeightBold,
        fontSize: Typography.fontSizeMD,
    },
    actions: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    actionButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    actionText: {
        fontSize: Typography.fontSizeXS,
        color: Colors.primary,
        fontWeight: Typography.fontWeightSemiBold,
    },
    checkBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBoxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkMark: {
        color: 'white',
        fontSize: 10,
        fontWeight: Typography.fontWeightBold,
    },
});
