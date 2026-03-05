import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { AggregatedData } from '../services/AnalyticsService';

interface AnalyticsDashboardProps {
    data: AggregatedData;
}

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // iOS blue
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
};

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    const hasData = data.totalSum > 0 || Object.keys(data.categoryTotals).length > 0;

    const pieChartData = useMemo(() => {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        let colorIndex = 0;

        return Object.entries(data.categoryTotals).map(([name, value]) => {
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            return {
                name,
                value,
                color,
                legendFontColor: Colors.textSecondary,
                legendFontSize: 12,
            };
        });
    }, [data.categoryTotals]);

    const barChartData = useMemo(() => {
        const labels = Object.keys(data.categoryTotals).map(cat => cat.substring(0, 10)); // Truncate long labels
        const datasetValues = Object.values(data.categoryTotals);

        return {
            labels: labels.length > 0 ? labels : ['None'],
            datasets: [
                {
                    data: datasetValues.length > 0 ? datasetValues : [0],
                },
            ],
        };
    }, [data.categoryTotals]);

    if (!hasData) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Not enough numerical data to generate analytics.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

            {/* Insights Section */}
            {data.insights.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Insights</Text>
                    {data.insights.map((insight, idx) => (
                        <View key={idx} style={styles.insightCard}>
                            <Text style={styles.insightIcon}>
                                {insight.type === 'summary' ? '📝' : insight.type === 'trend' ? '📈' : '⚠️'}
                            </Text>
                            <Text style={styles.insightText}>{insight.text}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Total Metric Card */}
            <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Total Value</Text>
                <Text style={styles.metricValue}>
                    {data.totalSum.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </Text>
            </View>

            {/* Pie Chart */}
            {pieChartData.length > 0 && (
                <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Distribution</Text>
                    <PieChart
                        data={pieChartData}
                        width={screenWidth - Spacing.lg * 2 - Spacing.md * 2} // container width
                        height={220}
                        chartConfig={chartConfig}
                        accessor={"value"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute
                    />
                </View>
            )}

            {/* Bar Chart */}
            {pieChartData.length > 0 && (
                <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Category Comparison</Text>
                    <BarChart
                        data={barChartData}
                        width={screenWidth - Spacing.lg * 2 - Spacing.md * 2}
                        height={220}
                        yAxisLabel="$"
                        yAxisSuffix=""
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.barChartStyle}
                    />
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.md,
        gap: Spacing.md,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    insightIcon: {
        fontSize: 20,
        marginRight: Spacing.sm,
    },
    insightText: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        lineHeight: 20,
    },
    metricCard: {
        backgroundColor: Colors.card,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    metricTitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        marginBottom: Spacing.xs,
    },
    metricValue: {
        color: Colors.primary,
        fontSize: Typography.fontSize3XL,
        fontWeight: Typography.fontWeightBold,
    },
    chartCard: {
        backgroundColor: Colors.card,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cardTitle: {
        alignSelf: 'flex-start',
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
        marginBottom: Spacing.md,
    },
    barChartStyle: {
        borderRadius: BorderRadius.md,
    }
});
