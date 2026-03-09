import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Skeleton matching a single validation field row.
 * Layout: short label block left, wider value block right, thin bar far right.
 */
export default function SkeletonFieldRow() {
    const { theme } = useTheme();

    return (
        <View
            style={[styles.row, { borderBottomColor: theme.border }]}
            accessibilityLabel="Loading field"
        >
            <SkeletonBox width={100} height={14} borderRadius={4} />
            <SkeletonBox width="50%" height={14} borderRadius={4} />
            <SkeletonBox width={48} height={8} borderRadius={4} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        gap: Spacing.sm,
    },
});
