import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import ConfidenceBar from './ConfidenceBar';

interface ExtractionItem {
    id: string;
    label: string;
    value: string;
    confidence: number;
}

interface CategoryDetailViewProps {
    category: string;
    items: ExtractionItem[];
    onClose: () => void;
}

/**
 * Drill-down list of extractions for a tapped category in the analytics dashboard.
 */
export default function CategoryDetailView({ category, items, onClose }: CategoryDetailViewProps) {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{category}</Text>
                <Text style={[styles.count, { color: theme.textMuted }]}>{items.length} items</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.row, { borderBottomColor: theme.border }]}>
                        <View style={styles.labelCol}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{item.label}</Text>
                            <Text style={[styles.value, { color: theme.textPrimary }]} numberOfLines={1}>
                                {item.value}
                            </Text>
                        </View>
                        <View style={styles.barCol}>
                            <ConfidenceBar confidence={item.confidence} />
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={[styles.empty, { color: theme.textMuted }]}>No extractions</Text>
                }
            />

            <View style={styles.footer}>
                <Text
                    style={[styles.closeLink, { color: theme.primary }]}
                    onPress={onClose}
                    accessibilityRole="button"
                >
                    ← Back
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
    count: {
        fontSize: Typography.fontSizeSM,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    labelCol: {
        flex: 2,
    },
    barCol: {
        flex: 1,
    },
    label: {
        fontSize: Typography.fontSizeXS,
        marginBottom: 2,
    },
    value: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    empty: {
        textAlign: 'center',
        paddingVertical: Spacing.xl,
        fontSize: Typography.fontSizeSM,
    },
    footer: {
        marginTop: Spacing.md,
    },
    closeLink: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
});
