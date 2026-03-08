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

        const updateProgress = (index: number, progress: number, phase: ExtractionPhase) => {
            docProgresses[index] = progress;
            const overall = docProgresses.reduce((sum, curr) => sum + curr, 0) / total;
            onProgress(overall, index, total, phase);
        };

        const allStructuredData = await runPool(
            uris.map((uri, i) => async () => {
                // Phase 1: Security Audit (Mock)
                updateProgress(i, 0, 'initializing');
                await new Promise(r => setTimeout(r, 600)); // Mock security scan
                updateProgress(i, 10, 'initializing');

                // Phase 2: OCR
                const text = await OCRService.extractText(uri, (prog: number) => {
                    updateProgress(i, 10 + (prog * 0.3), 'recognizing');
                });

                // Phase 3: PII Redaction
                const redactedText = await PIIRedactionService.redact(text, (prog: number) => {
                    updateProgress(i, 40 + (prog * 0.2), 'redacting');
                });

                // Phase 4: LLM Structuring
                const structuredData = await LLMInferenceService.structureData(redactedText, (prog: number) => {
                    updateProgress(i, 60 + (prog * 0.3), 'structuring');
                });

                // Phase 5: Finalizing (Digital Signature Mock)
                updateProgress(i, 90, 'finalizing');
                await new Promise(r => setTimeout(r, 400)); // Mock signing
                updateProgress(i, 100, 'finalizing');

                return structuredData;
            }),
            concurrency
        );

        // Merge results into a single consolidated JSON structure via LLM (Reduce Phase)
        return LLMInferenceService.consolidateRecords(allStructuredData, (prog: number) => {
            onProgress(100, total, total, 'structuring'); // Final progress push
        });
    },
};
