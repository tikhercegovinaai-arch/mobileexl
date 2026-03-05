import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { OCRService } from '../services/OCRService';
import { PIIRedactionService } from '../services/PIIRedactionService';
import { LLMInferenceService } from '../services/LLMInferenceService';
import { Colors, Spacing, Typography } from '../constants/theme';

interface ExtractionScreenProps {
    onExtractionComplete: () => void;
    onExtractionError: () => void;
}

export default function ExtractionScreen({ onExtractionComplete, onExtractionError }: ExtractionScreenProps) {
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
            if (!capture.preprocessedImageUri) {
                failExtractionJob("No image available");
                onExtractionError();
                return;
            }

            try {
                // Initialize the job with a random ID
                startExtractionJob(`job_${Date.now()}`);

                // Phase 1: OCR
                const text = await OCRService.extractText(capture.preprocessedImageUri, (prog) => {
                    updateExtractionProgress(prog, 'recognizing');
                });

                // Phase 2: PII Redaction
                const redactedText = await PIIRedactionService.redact(text, (prog) => {
                    updateExtractionProgress(prog, 'redacting');
                });

                // Phase 3: LLM Structuring
                const structuredData = await LLMInferenceService.structureData(redactedText, (prog) => {
                    updateExtractionProgress(prog, 'structuring');
                });

                completeExtractionJob(structuredData);
                onExtractionComplete();

            } catch (error) {
                failExtractionJob(error instanceof Error ? error.message : "Unknown extraction error");
                onExtractionError();
            }
        };

        runPipeline();
    }, [capture, extraction.status, startExtractionJob, updateExtractionProgress, completeExtractionJob, failExtractionJob, onExtractionComplete, onExtractionError]);

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
