import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useAppStore, ExtractionPhase } from '../store/useAppStore';
import { BatchProcessingService } from '../services/BatchProcessingService';
import { Typography, Spacing, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SkeletonBox } from '../components/SkeletonBox';

interface ExtractionScreenProps {
    onExtractionComplete: () => void;
    onExtractionError: () => void;
}

const PHASES: { id: ExtractionPhase; label: string; icon: string }[] = [
    { id: 'initializing', label: 'Security Audit', icon: '🛡️' },
    { id: 'recognizing', label: 'Handwriting Recognition', icon: '✍️' },
    { id: 'redacting', label: 'PII Scrubbing', icon: '✂️' },
    { id: 'structuring', label: 'Semantic Structuring', icon: '📊' },
    { id: 'finalizing', label: 'Finalizing & Signing', icon: '🔏' },
];

export default function ExtractionScreen({ onExtractionComplete, onExtractionError }: ExtractionScreenProps) {
    const [currentDocStr, setCurrentDocStr] = React.useState('');
    const {
        capture,
        extraction,
        startExtractionJob,
        updateExtractionProgress,
        updateItemProgress,
        completeExtractionJob,
        failExtractionJob
    } = useAppStore();
    const { theme, isDark } = useTheme();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
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
                    (overallProgress, itemUpdate) => {
                        if (itemUpdate) {
                            const { index, progress, phase } = itemUpdate;
                            if (index >= 0) {
                                updateItemProgress(index, progress, phase);
                                // For overall phase, use the "youngest" active phase or the phase of the last item
                                updateExtractionProgress(overallProgress, phase);
                                if (capture.preprocessedImageUris.length > 1) {
                                    setCurrentDocStr(`OPTIMIZING_THREAD_${index} [${Math.round(progress)}%]`);
                                }
                            } else {
                                // Consolidation phase (index -1)
                                updateExtractionProgress(overallProgress, phase);
                                setCurrentDocStr("CONSOLIDATING_RECORDS...");
                            }
                        } else {
                            updateExtractionProgress(overallProgress);
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
            <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: theme.surface, borderColor: theme.border }]}>
                {extraction.status === 'running' && (
                    <View style={{ width: '100%', marginBottom: Spacing.lg, alignItems: 'center' }}>
                        <SkeletonBox height={160} />
                        <View style={styles.progressCounter}>
                            <Text style={[styles.monoText, { color: theme.primary, fontSize: 18 }]}>
                                {Math.round(extraction.progress)}%_CMP
                            </Text>
                        </View>
                    </View>
                )}

                {/* Summary Section */}
                <View style={styles.headerRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: extraction.status === 'running' ? theme.primary : theme.success }]} />
                    <Text style={[styles.title, { color: theme.textPrimary }]}>NEURAL_EXTRACT_CORE</Text>
                </View>

                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {currentDocStr || "INITIALIZING_PIPELINE..."}
                </Text>

                {/* Parallel Progress Bars (for batch) or Traditional Timeline (for single) */}
                {capture.preprocessedImageUris.length > 1 ? (
                    <View style={styles.parallelList}>
                        {capture.preprocessedImageUris.map((_, idx) => {
                            const prog = extraction.itemProgresses[idx] || 0;
                            const phase = extraction.itemPhases[idx] || 'idle';
                            return (
                                <View key={idx} style={styles.parallelItem}>
                                    <View style={styles.parallelHeader}>
                                        <Text style={[styles.monoText, { color: theme.textSecondary, fontSize: 10 }]}>
                                            DOC_{idx.toString().padStart(3, '0')}
                                        </Text>
                                        <Text style={[styles.monoText, { color: theme.primary, fontSize: 9 }]}>
                                            {phase.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[styles.progressBarContainer, { backgroundColor: theme.surfaceAlt }]}>
                                        <Animated.View 
                                            style={[
                                                styles.progressBar, 
                                                { 
                                                    backgroundColor: theme.primary,
                                                    width: `${prog}%` 
                                                }
                                            ]} 
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {PHASES.map((phase, idx) => {
                            const isDone = idx < activeIndex;
                            const isActive = idx === activeIndex;
                            return (
                                <View key={phase.id} style={styles.timelineItem}>
                                    <View style={styles.lineWrapper}>
                                        <View style={[
                                            styles.dot,
                                            { backgroundColor: 'transparent', borderColor: theme.border },
                                            isDone && { backgroundColor: theme.primary, borderColor: theme.primary },
                                            isActive && { backgroundColor: theme.surfaceAlt, borderColor: theme.primary }
                                        ]}>
                                            {isActive && <View style={[styles.activeInner, { backgroundColor: theme.primary }]} />}
                                        </View>
                                        {idx < PHASES.length - 1 && (
                                            <View style={[styles.line, { backgroundColor: theme.border }, isDone && { backgroundColor: theme.primary }]} />
                                        )}
                                    </View>
                                    <View style={styles.phaseInfo}>
                                        <Text style={[
                                            styles.phaseLabel,
                                            styles.monoText,
                                            { color: theme.textMuted },
                                            (isActive || isDone) && { color: theme.textPrimary }
                                        ]}>
                                            [{phase.id.toUpperCase()}] {phase.label}
                                        </Text>
                                        {isActive && <Text style={[styles.phaseSub, { color: theme.primary }]}>STATUS: ACTIVE</Text>}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {extraction.status === 'error' && (
                    <View style={[styles.errorBox, { backgroundColor: theme.error + '22', borderColor: theme.error, borderWidth: 1 }]}>
                        <Text style={[styles.errorText, { color: theme.error }]}>SYS_ERR: {extraction.errorMessage}</Text>
                    </View>
                )}
            </Animated.View>

            <Text style={[styles.footerText, { color: theme.textMuted }]}>SECURE_ON_DEVICE_NEURAL_LINK [OK]</Text>
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
        borderRadius: 2,
        padding: Spacing.xl,
        width: '100%',
        borderWidth: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    progressCounter: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statusText: {
        fontSize: 12,
        marginBottom: Spacing.xl,
        fontWeight: '600',
        opacity: 0.7,
    },
    timeline: {
        width: '100%',
        marginTop: Spacing.md,
    },
    timelineItem: {
        flexDirection: 'row',
        height: 50,
    },
    lineWrapper: {
        alignItems: 'center',
        marginRight: Spacing.md,
        width: 20,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 0, // Square dots for industrial feel
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    activeInner: {
        width: 4,
        height: 4,
    },
    line: {
        width: 1,
        flex: 1,
        marginVertical: 2,
    },
    phaseInfo: {
        flex: 1,
        paddingLeft: 4,
    },
    monoText: {
        fontFamily: 'Courier',
        fontWeight: '700',
    },
    phaseLabel: {
        fontSize: 13,
    },
    phaseSub: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 2,
    },
    errorBox: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        width: '100%',
    },
    errorText: {
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '700',
    },
    footerText: {
        position: 'absolute',
        bottom: Spacing.xxl,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    parallelList: {
        width: '100%',
        marginTop: Spacing.md,
    },
    parallelItem: {
        marginBottom: Spacing.md,
    },
    parallelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressBarContainer: {
        height: 4,
        width: '100%',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
});

