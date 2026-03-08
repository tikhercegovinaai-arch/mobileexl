import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Typography, Spacing } from '../constants/theme';
import { AggregatedData } from '../services/AnalyticsService';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsDashboardProps {
    data: AggregatedData;
}

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    const { theme, isDark } = useTheme();
    const hasData = data.totalSum > 0 || Object.keys(data.categoryTotals).length > 0;

    const chartConfig = useMemo(() => ({
        backgroundGradientFrom: theme.surface,
        backgroundGradientTo: theme.surface,
        color: (opacity = 1) => `rgba(${parseInt(theme.primary.slice(1,3), 16)}, ${parseInt(theme.primary.slice(3,5), 16)}, ${parseInt(theme.primary.slice(5,7), 16)}, ${opacity})`,
        labelColor: (opacity = 1) => theme.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForLabels: {
            fontFamily: 'Courier',
            fontSize: 10,
        }
    }), [theme]);

    const pieChartData = useMemo(() => {
        const colors = [theme.primary, theme.success, theme.warning, '#FF6384', '#36A2EB', '#FFCE56'];
        let colorIndex = 0;

        return Object.entries(data.categoryTotals).map(([name, value]) => {
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            return {
                name,
                value,
                color,
                legendFontColor: theme.textSecondary,
                legendFontSize: 10,
            };
        });
    }, [data.categoryTotals, theme]);

    const barChartData = useMemo(() => {
        const labels = Object.keys(data.categoryTotals).map(cat => cat.substring(0, 8).toUpperCase());
        const datasetValues = Object.values(data.categoryTotals);

        return {
            labels: labels.length > 0 ? labels : ['NONE'],
            datasets: [
                {
                    data: datasetValues.length > 0 ? datasetValues : [0],
                },
            ],
        };
    }, [data.categoryTotals]);

    if (!hasData) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.emptyText, styles.monoText, { color: theme.textMuted }]}>
                    [SYSTEM_ERR]: DATA_INSUFFICIENT_FOR_ANALYSIS
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>

            {/* Total Metric Card */}
            <View style={[styles.metricCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <View style={[styles.marker, { backgroundColor: theme.primary }]} />
                <Text style={[styles.metricTitle, styles.monoText, { color: theme.textSecondary }]}>AGGREGATED_TOTAL_VALUE</Text>
                <Text style={[styles.metricValue, styles.monoText, { color: theme.textPrimary }]}>
                    {data.totalSum.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                </Text>
            </View>

            {/* Insights Section */}
            {data.insights.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, styles.monoText, { color: theme.textPrimary }]}>PROCESS_INSIGHTS</Text>
                    {data.insights.map((insight, idx) => (
                        <View key={idx} style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.insightIndicator, { backgroundColor: insight.type === 'anomaly' ? theme.error : theme.primary }]} />
                            <Text style={[styles.insightText, { color: theme.textPrimary }]}>
                                <Text style={[styles.monoText, { fontWeight: 'bold' }]}>[{insight.type.toUpperCase()}]</Text> {insight.text}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Distribution Card */}
            {pieChartData.length > 0 && (
                <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, styles.monoText, { color: theme.textPrimary }]}>CATEGORY_DISTRIBUTION</Text>
                    <PieChart
                        data={pieChartData}
                        width={screenWidth - Spacing.lg * 2}
                        height={200}
                        chartConfig={chartConfig}
                        accessor={"value"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute
                    />
                </View>
            )}

            {/* Comparison Card */}
            {pieChartData.length > 0 && (
                <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, styles.monoText, { color: theme.textPrimary }]}>LINEAR_COMPARISON</Text>
                    <BarChart
                        data={barChartData}
                        width={screenWidth - Spacing.lg * 2}
                        height={220}
                        yAxisLabel="$"
                        yAxisSuffix=""
                        chartConfig={chartConfig}
                        verticalLabelRotation={0}
                        style={styles.barChartStyle}
                        fromZero
                    />
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        marginBottom: Spacing.md,
        letterSpacing: 1,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    insightIndicator: {
        width: 3,
        height: '100%',
        marginRight: Spacing.md,
    },
    insightText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
    },
    metricCard: {
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    marker: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        width: 40,
    },
    metricTitle: {
        fontSize: 10,
        marginBottom: Spacing.xs,
        letterSpacing: 1,
    },
    metricValue: {
        fontSize: Typography.fontSize2XL,
        fontWeight: '900',
    },
    chartCard: {
        padding: Spacing.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    cardTitle: {
        alignSelf: 'flex-start',
        fontSize: 11,
        fontWeight: '800',
        marginBottom: Spacing.md,
        letterSpacing: 1,
    },
    barChartStyle: {
        marginTop: Spacing.sm,
        paddingRight: 0,
    },
    monoText: {
        fontFamily: 'Courier',
    },
});
