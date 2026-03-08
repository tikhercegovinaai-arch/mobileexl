import { OCRService } from './OCRService';
import { PIIRedactionService } from './PIIRedactionService';
import { LLMInferenceService } from './LLMInferenceService';
import { ExtractionPhase, useAppStore } from '../store/useAppStore';
import { runPool } from '../utils/concurrencyPool';

export interface BatchProgressCallback {
    (
        overallProgress: number,
        currentDocumentIndex: number,
        totalDocuments: number,
        phase: ExtractionPhase
    ): void;
}

export const BatchProcessingService = {
    /**
     * Processes an array of image URIs sequentially through the extraction pipeline.
     */
    async processBatch(uris: string[], onProgress: BatchProgressCallback): Promise<Record<string, unknown>> {
        const total = uris.length;
        if (total === 0) {
            throw new Error("No images provided for batch processing");
        }

        const { settings } = useAppStore.getState();
        const concurrency = settings.maxConcurrency || 2;
        const docProgresses = new Array(total).fill(0);
        const docPhases = new Array<ExtractionPhase>(total).fill('idle');

        const reportOverall = (index: number, progress: number, phase: ExtractionPhase) => {
            docProgresses[index] = progress;
            docPhases[index] = phase;
            
            // Overall progress is average of all docs
            const overall = docProgresses.reduce((sum, curr) => sum + curr, 0) / total;
            
            // For the callback, we "estimate" the most relevant index-phase pair, 
            // or we could change the callback signature. For now, keep it compatible.
            onProgress(overall, index, total, phase);
        };

        const allStructuredData = await runPool(
            uris.map((uri, i) => async (onItemProgress) => {
                // Phase 1: Security Audit (Mock)
                reportOverall(i, 0, 'initializing');
                await new Promise(r => setTimeout(r, 600)); // Mock security scan
                onItemProgress(10);
                reportOverall(i, 10, 'initializing');

                // Phase 2: OCR
                const text = await OCRService.extractText(uri, (prog: number) => {
                    const localProg = 10 + (prog * 0.3);
                    onItemProgress(localProg);
                    reportOverall(i, localProg, 'recognizing');
                });

                // Phase 3: PII Redaction
                const redactedText = await PIIRedactionService.redact(text, (prog: number) => {
                    const localProg = 40 + (prog * 0.2);
                    onItemProgress(localProg);
                    reportOverall(i, localProg, 'redacting');
                });

                // Phase 4: LLM Structuring
                const structuredData = await LLMInferenceService.structureData(redactedText, (prog: number) => {
                    const localProg = 60 + (prog * 0.3);
                    onItemProgress(localProg);
                    reportOverall(i, localProg, 'structuring');
                });

                // Phase 5: Finalizing (Digital Signature Mock)
                reportOverall(i, 90, 'finalizing');
                await new Promise(r => setTimeout(r, 400)); // Mock signing
                onItemProgress(100);
                reportOverall(i, 100, 'finalizing');

                return structuredData;
            }),
            concurrency
        );

        // Merge results into a single consolidated JSON structure
        onProgress(99, total, total, 'structuring');
        const consolidated = await LLMInferenceService.consolidateRecords(allStructuredData, (prog: number) => {
            // Consolidation is the last 1%
            onProgress(99 + (prog * 0.01), total, total, 'structuring');
        });
        
        onProgress(100, total, total, 'completed');
        return consolidated;
    },

};
