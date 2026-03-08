import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

type Range = '7d' | '30d' | '90d';

interface DateRangePickerProps {
    value: Range;
    onChange: (range: Range) => void;
}

const ranges: { label: string; value: Range }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
];

/**
 * Chip row for selecting analytics dashboard date range.
 */
export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.row}>
            {ranges.map((r) => {
                const isActive = value === r.value;
                return (
                    <TouchableOpacity
                        key={r.value}
                        onPress={() => onChange(r.value)}
                        style={[
                            styles.chip,
                            { borderColor: theme.border },
                            isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        accessibilityLabel={`Filter last ${r.label}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                { color: theme.textSecondary },
                                isActive && { color: '#FFFFFF' },
                            ]}
                        >
                            {r.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    chipText: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
});
