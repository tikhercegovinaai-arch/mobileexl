import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useAppStore, ExtractionPhase } from '../store/useAppStore';
import { BatchProcessingService } from '../services/BatchProcessingService';
import { Typography, Spacing, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import SkeletonCard from '../components/SkeletonCard';

interface ExtractionScreenProps {
    onExtractionComplete: () => void;
    onExtractionError: () => void;
}

const PHASES: { id: ExtractionPhase; label: string; icon: string }[] = [
    { id: 'recognizing', label: 'Handwriting Recognition', icon: '✍️' },
    { id: 'redacting', label: 'PII Scrubbing', icon: '🛡️' },
    { id: 'structuring', label: 'Semantic Structuring', icon: '📊' },
];

export default function ExtractionScreen({ onExtractionComplete, onExtractionError }: ExtractionScreenProps) {
    const [currentDocStr, setCurrentDocStr] = React.useState('');
    const {
        capture,
        extraction,
        startExtractionJob,
        updateExtractionProgress,
        completeExtractionJob,
        failExtractionJob
    } = useAppStore();
    const { theme, isDark } = useTheme();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        // Only run if not already running or completed
        if (extraction.status !== 'idle') return;

        const runPipeline = async () => {
            if (!capture.preprocessedImageUris || capture.preprocessedImageUris.length === 0) {
                failExtractionJob("No images available");
                onExtractionError();
                return;
            }

            try {
                startExtractionJob(`job_${Date.now()}`);

                const structuredData: any = await BatchProcessingService.processBatch(
                    capture.preprocessedImageUris,
                    (overallProgress: number, currentIndex: number, total: number, phase: ExtractionPhase) => {
                        updateExtractionProgress(overallProgress, phase);
                        if (total > 1) {
                            setCurrentDocStr(`Processing Document ${currentIndex + 1} of ${total}`);
                        }
                    }
                );

                completeExtractionJob(structuredData);
                onExtractionComplete();

            } catch (error) {
                failExtractionJob(error instanceof Error ? error.message : "Unknown extraction error");
                onExtractionError();
            }
        };

        runPipeline();
    }, [capture.preprocessedImageUris, extraction.status, startExtractionJob, updateExtractionProgress, completeExtractionJob, failExtractionJob, onExtractionComplete, onExtractionError]);

    const activeIndex = useMemo(() => {
        return PHASES.findIndex(p => p.id === extraction.phase);
    }, [extraction.phase]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: theme.surface, borderColor: theme.border }, shadow(isDark ? '#000' : '#000', 10, 20, 0.3, 10)]}>
                {extraction.status === 'running' && (
                    <View style={{ width: '100%', marginBottom: Spacing.lg, alignItems: 'center' }}>
                        <SkeletonCard />
                        <Text style={[styles.title, { marginTop: Spacing.md, color: theme.textPrimary }]}>
                            {Math.round(extraction.progress)}%
                        </Text>
                    </View>
                )}

                <Text style={[styles.title, { color: theme.textPrimary }]}>AI Intelligence Engine</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {currentDocStr || "Initializing Pipeline..."}
                </Text>

                {/* Timeline */}
                <View style={styles.timeline}>
                    {PHASES.map((phase, idx) => {
                        const isDone = idx < activeIndex;
                        const isActive = idx === activeIndex;
                        return (
                            <View key={phase.id} style={styles.timelineItem}>
                                <View style={styles.lineWrapper}>
                                    <View style={[
                                        styles.dot,
                                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                                        isDone && { backgroundColor: '#4ade80', borderColor: '#4ade80' },
                                        isActive && { backgroundColor: theme.background, borderColor: theme.primary }
                                    ]}>
                                        {isDone && <Text style={styles.check}>✓</Text>}
                                    </View>
                                    {idx < PHASES.length - 1 && (
                                        <View style={[styles.line, { backgroundColor: theme.border }, isDone && { backgroundColor: '#4ade80' }]} />
                                    )}
                                </View>
                                <View style={styles.phaseInfo}>
                                    <Text style={[
                                        styles.phaseLabel,
                                        { color: theme.textMuted },
                                        (isActive || isDone) && { color: theme.textPrimary }
                                    ]}>
                                        {phase.icon} {phase.label}
                                    </Text>
                                    {isActive && <Text style={[styles.phaseSub, { color: theme.primary }]}>Active...</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {extraction.status === 'error' && (
                    <View style={[styles.errorBox, { backgroundColor: theme.error + '22' }]}>
                        <Text style={[styles.errorText, { color: theme.error }]}>⚠️ {extraction.errorMessage}</Text>
                    </View>
                )}
            </Animated.View>

            <Text style={[styles.footerText, { color: theme.textMuted }]}>On-Device Neural Processing Enabled</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
    },
    loaderContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    percentageCircle: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
    },
    title: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold as any,
        marginBottom: 8,
    },
    statusText: {
        fontSize: Typography.fontSizeSM,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    timeline: {
        width: '100%',
        marginTop: Spacing.md,
    },
    timelineItem: {
        flexDirection: 'row',
        height: 60,
    },
    lineWrapper: {
        alignItems: 'center',
        marginRight: Spacing.md,
        width: 20,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        zIndex: 1,
    },
    check: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 2,
    },
    phaseInfo: {
        flex: 1,
    },
    phaseLabel: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    phaseSub: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    errorBox: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        width: '100%',
    },
    errorText: {
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
    },
    footerText: {
        position: 'absolute',
        bottom: Spacing.xxl,
        fontSize: Typography.fontSizeXS,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});

