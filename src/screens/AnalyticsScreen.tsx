import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

export default function AnalyticsScreen() {
    const { validation } = useAppStore();
    const { theme } = useTheme();

    const screenWidth = Dimensions.get('window').width - Spacing.md * 2;

    const aggregatedData = useMemo(() => {
        const catCounts: Record<string, number> = {};
        let totalVal = 0;
        validation.fields.forEach((f) => {
            const cat = f.category || 'Uncategorized';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
            totalVal++;
        });

        // Mock daily series data based on total fields extracted today
        const mockDailySeries = [
            { date: 'Mon', value: Math.max(0, totalVal - 10) },
            { date: 'Tue', value: Math.max(0, totalVal - 5) },
            { date: 'Wed', value: Math.max(0, totalVal - 2) },
            { date: 'Thu', value: Math.max(0, totalVal) },
            { date: 'Fri', value: totalVal + 2 },
        ];

        return {
            totalFields: totalVal,
            categoryBreakdown: catCounts,
            dailySeries: mockDailySeries,
        };
    }, [validation.fields]);

    const pieData = Object.entries(aggregatedData.categoryBreakdown).map(([name, val], i) => ({
        name,
        population: val,
        color: i % 2 === 0 ? theme.primary : theme.success,
        legendFontColor: theme.textSecondary,
        legendFontSize: 12,
    }));

    const lineData = {
        labels: aggregatedData.dailySeries.map(d => d.date),
        datasets: [{ data: aggregatedData.dailySeries.map(d => d.value) }],
    };

    const chartConfig = {
        backgroundGradientFrom: theme.surface,
        backgroundGradientTo: theme.surfaceAlt,
        color: (opacity = 1) => `rgba(${parseInt(theme.primary.slice(1,3), 16)}, ${parseInt(theme.primary.slice(3,5), 16)}, ${parseInt(theme.primary.slice(5,7), 16)}, ${opacity})`,
        labelColor: (opacity = 1) => theme.textSecondary,
        strokeWidth: 2,
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.primary,
        },
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.header, { color: theme.textPrimary }]}>Analytics Dashboard</Text>
            
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Total Extracted Fields: {aggregatedData.totalFields}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Extraction Trend (This Week)</Text>
                <LineChart
                    data={lineData}
                    width={screenWidth - Spacing.md * 2}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                />
            </View>

            {pieData.length > 0 && (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Categories Breakdown</Text>
                    <PieChart
                        data={pieData}
                        width={screenWidth - Spacing.md * 2}
                        height={200}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[0, 0]}
                    />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    header: {
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.md,
    },
    chart: {
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.sm,
    },
});
