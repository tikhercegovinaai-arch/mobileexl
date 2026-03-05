import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useAppStore, ExtractionPhase } from '../store/useAppStore';
import { BatchProcessingService } from '../services/BatchProcessingService';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

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
        <View style={styles.container}>
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <View style={styles.percentageCircle}>
                        <Text style={styles.percentageText}>{Math.round(extraction.progress)}%</Text>
                    </View>
                </View>

                <Text style={styles.title}>AI Intelligence Engine</Text>
                <Text style={styles.statusText}>
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
                                        isDone && styles.dotDone,
                                        isActive && styles.dotActive
                                    ]}>
                                        {isDone && <Text style={styles.check}>✓</Text>}
                                    </View>
                                    {idx < PHASES.length - 1 && (
                                        <View style={[styles.line, isDone && styles.lineDone]} />
                                    )}
                                </View>
                                <View style={styles.phaseInfo}>
                                    <Text style={[
                                        styles.phaseLabel,
                                        (isActive || isDone) && styles.phaseLabelActive
                                    ]}>
                                        {phase.icon} {phase.label}
                                    </Text>
                                    {isActive && <Text style={styles.phaseSub}>Active...</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {extraction.status === 'error' && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {extraction.errorMessage}</Text>
                    </View>
                )}
            </Animated.View>

            <Text style={styles.footerText}>On-Device Neural Processing Enabled</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
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
        color: Colors.primary,
    },
    title: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold as any,
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    statusText: {
        fontSize: Typography.fontSizeSM,
        color: Colors.textSecondary,
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
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 2,
        borderColor: Colors.border,
        zIndex: 1,
    },
    dotActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.background,
        transform: [{ scale: 1.2 }],
    },
    dotDone: {
        borderColor: Colors.success,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    check: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.border,
        marginVertical: 2,
    },
    lineDone: {
        backgroundColor: Colors.success,
    },
    phaseInfo: {
        flex: 1,
    },
    phaseLabel: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textMuted,
        fontWeight: Typography.fontWeightMedium,
    },
    phaseLabelActive: {
        color: Colors.textPrimary,
    },
    phaseSub: {
        fontSize: 10,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    errorBox: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: Colors.error + '22',
        borderRadius: BorderRadius.md,
        width: '100%',
    },
    errorText: {
        color: Colors.error,
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
    },
    footerText: {
        position: 'absolute',
        bottom: Spacing.xxl,
        fontSize: Typography.fontSizeXS,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});

