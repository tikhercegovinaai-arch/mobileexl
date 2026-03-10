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
import { Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
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
    const { theme } = useTheme();
    const viewRef = useRef<View>(null);

    React.useEffect(() => {
        glowOpacity.value = withTiming(isHighlighted ? 1 : 0, { duration: 150 });
    }, [isHighlighted]);

    const glowStyle = useAnimatedStyle(() => ({
        borderColor: isHighlighted ? theme.primary : theme.border,
        shadowOpacity: glowOpacity.value * 0.6,
        shadowColor: theme.primary,
        shadowRadius: 8,
        elevation: glowOpacity.value * 6,
    }), [isHighlighted, theme.primary, theme.border]);

    const handleLayout = useCallback(
        (e: LayoutChangeEvent) => {
            // e.target.measure can be undefined on the web
            if (viewRef.current) {
                viewRef.current.measure((_fx, _fy, w, h, px, py) => {
                    onLayout(columnKey, { x: px, y: py, width: w, height: h });
                });
            } else {
                // Fallback to relative layout if measure is somehow unavailable
                onLayout(columnKey, { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y, width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
            }
        },
        [columnKey, onLayout],
    );

    return (
        <Animated.View ref={viewRef} style={[styles.column, glowStyle, { backgroundColor: theme.surface }]} onLayout={handleLayout}>
            {/* Column header */}
            <View style={[styles.header, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerLabel, { color: theme.textPrimary }]}>{label}</Text>
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
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
                        <Text style={[styles.emptyHintText, { color: theme.textMuted }]}>Drop fields here</Text>
                    </View>
                ) : (
                    acceptedFields.map((f) => (
                        <View key={f.id} style={[styles.chip, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
                            <Text style={[styles.chipLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                                {f.label}
                            </Text>
                            <Text style={[styles.chipValue, { color: theme.textPrimary }]} numberOfLines={1}>
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
        borderBottomWidth: 1,
    },
    headerLabel: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },
    badge: {
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
        fontSize: Typography.fontSizeXS,
        fontStyle: 'italic',
    },
    chip: {
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderLeftWidth: 3,
    },
    chipLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
    },
    chipValue: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
});
