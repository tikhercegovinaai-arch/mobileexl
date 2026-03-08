import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Skeleton placeholder for a list card (e.g. extraction result).
 * Layout: square thumbnail on left, 3 text lines on right.
 */
export default function SkeletonCard() {
    const { theme } = useTheme();

    return (
        <View
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            accessibilityLabel="Loading card"
        >
            <SkeletonBox width={64} height={64} borderRadius={BorderRadius.sm} />
            <View style={styles.textArea}>
                <SkeletonBox width="80%" height={14} />
                <SkeletonBox width="60%" height={12} style={{ marginTop: Spacing.sm }} />
                <SkeletonBox width="40%" height={12} style={{ marginTop: Spacing.sm }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        alignItems: 'center',
    },
    textArea: {
        flex: 1,
        marginLeft: Spacing.md,
    },
});
