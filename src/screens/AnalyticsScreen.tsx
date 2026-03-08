import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, shadow } from '../constants/theme';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { TechnicalButton } from '../components/TechnicalButton';
import { AnalyticsService } from '../services/AnalyticsService';

interface AnalyticsScreenProps {
    onBack: () => void;
}

export default function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
    const extraction = useAppStore((state) => state.extraction);
    
    // Injected context is better for theme
    const { theme: currentTheme, isDark: currentIsDark } = useTheme();

    const aggregatedData = useMemo(() => {
        // Use live extracted data if available, otherwise fallback to empty structure
        const data = extraction.extractedData || {};
        return AnalyticsService.aggregateData(data);
    }, [extraction.extractedData]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
            <StatusBar barStyle={currentIsDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { borderColor: currentTheme.border }]}>
                <View>
                    <Text style={[styles.title, styles.monoText, { color: currentTheme.textPrimary }]}>ANALYTICS_CORE_v1</Text>
                    <Text style={[styles.subtitle, styles.monoText, { color: currentTheme.textMuted }]}>DATA_INSIGHTS_ENGINE</Text>
                </View>
                <TechnicalButton
                    label="Back"
                    variant="outline"
                    onPress={onBack}
                    style={styles.backButton}
                />
            </View>

            <View style={styles.content}>
                <AnalyticsDashboard data={aggregatedData} />
            </View>

            {/* Status Footer */}
            <View style={[styles.footer, { borderTopColor: currentTheme.border }]}>
                <Text style={[styles.footerText, styles.monoText, { color: currentTheme.textMuted }]}>
                    STATUS: {extraction.status.toUpperCase()} | ENGINE: NEURAL_AGGREGATOR_V2
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 9,
        fontWeight: '600',
    },
    backButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: Spacing.sm,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        letterSpacing: 0.5,
    },
    monoText: {
        fontFamily: 'Courier',
    },
});
