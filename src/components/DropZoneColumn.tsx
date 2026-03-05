import React, { useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    LayoutRectangle,
    LayoutChangeEvent,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { ValidationField } from '../store/useAppStore';

export interface DropZoneColumnProps {
    columnKey: string;
    label: string;
    acceptedFields: ValidationField[];
    isHighlighted: boolean;
    onLayout: (key: string, rect: LayoutRectangle) => void;
}

export const DropZoneColumn: React.FC<DropZoneColumnProps> = ({
    columnKey,
    label,
    acceptedFields,
    isHighlighted,
    onLayout,
}) => {
    const glowOpacity = useSharedValue(0);

    React.useEffect(() => {
        glowOpacity.value = withTiming(isHighlighted ? 1 : 0, { duration: 150 });
    }, [isHighlighted]);

    const glowStyle = useAnimatedStyle(() => ({
        borderColor: isHighlighted ? Colors.primary : Colors.border,
        shadowOpacity: glowOpacity.value * 0.6,
        shadowColor: Colors.primary,
        shadowRadius: 8,
        elevation: glowOpacity.value * 6,
    }));

    const handleLayout = useCallback(
        (e: LayoutChangeEvent) => {
            e.target.measure((_fx, _fy, w, h, px, py) => {
                onLayout(columnKey, { x: px, y: py, width: w, height: h });
            });
        },
        [columnKey, onLayout],
    );

    return (
        <Animated.View style={[styles.column, glowStyle]} onLayout={handleLayout}>
            {/* Column header */}
            <View style={styles.header}>
                <Text style={styles.headerLabel}>{label}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{acceptedFields.length}</Text>
                </View>
            </View>

            {/* Accepted field chips */}
            <ScrollView
                contentContainerStyle={styles.chipList}
                showsVerticalScrollIndicator={false}
            >
                {acceptedFields.length === 0 ? (
                    <View style={styles.emptyHint}>
                        <Text style={styles.emptyHintText}>Drop fields here</Text>
                    </View>
                ) : (
                    acceptedFields.map((f) => (
                        <View key={f.id} style={styles.chip}>
                            <Text style={styles.chipLabel} numberOfLines={1}>
                                {f.label}
                            </Text>
                            <Text style={styles.chipValue} numberOfLines={1}>
                                {f.value}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    column: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        marginHorizontal: Spacing.xs,
        minHeight: 160,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        backgroundColor: Colors.surfaceAlt,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLabel: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
    },
    chipList: {
        padding: Spacing.xs,
        gap: Spacing.xs,
    },
    emptyHint: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    emptyHintText: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeXS,
        fontStyle: 'italic',
    },
    chip: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    chipLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    chipValue: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
});
