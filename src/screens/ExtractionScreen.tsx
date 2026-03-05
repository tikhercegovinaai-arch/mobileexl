import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppStore, ExtractionPhase } from '../store/useAppStore';
import { BatchProcessingService } from '../services/BatchProcessingService';
import { Colors, Spacing, Typography } from '../constants/theme';

interface ExtractionScreenProps {
    onExtractionComplete: () => void;
    onExtractionError: () => void;
}

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
                            setCurrentDocStr(`Document ${currentIndex + 1} of ${total}`);
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

    const getPhaseMessage = () => {
        switch (extraction.phase) {
            case 'recognizing': return "Recognizing Handwriting...";
            case 'redacting': return "Redacting PII...";
            case 'structuring': return "Structuring Data...";
            case 'completed': return "Extraction Complete!";
            case 'failed': return "Extraction Failed";
            default: return "Initializing AI Engine...";
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>AI Extraction Engine</Text>
            <Text style={styles.subtitle}>{getPhaseMessage()}</Text>
            {currentDocStr ? <Text style={styles.docText}>{currentDocStr}</Text> : null}
            {extraction.phase !== 'idle' && extraction.phase !== 'failed' && extraction.phase !== 'completed' && (
                <Text style={styles.progressText}>{Math.round(extraction.progress)}%</Text>
            )}

            {extraction.status === 'error' && (
                <Text style={styles.errorText}>Error: {extraction.errorMessage}</Text>
            )}
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
    title: {
        fontSize: Typography.fontSize3XL,
        fontWeight: Typography.fontWeightBold as any,
        color: Colors.textPrimary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSizeMD,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    docText: {
        fontSize: Typography.fontSizeSM,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    progressText: {
        fontSize: Typography.fontSizeXL,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: Spacing.md,
    },
    errorText: {
        fontSize: Typography.fontSizeMD,
        color: Colors.error,
        marginTop: Spacing.md,
        textAlign: 'center',
    }
});
