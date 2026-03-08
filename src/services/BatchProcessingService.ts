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
                // Phase 1: OCR
                const text = await OCRService.extractText(uri, (prog: number) => {
                    updateProgress(i, prog * 0.33, 'recognizing');
                });

                // Phase 2: PII Redaction
                const redactedText = await PIIRedactionService.redact(text, (prog: number) => {
                    updateProgress(i, 33 + (prog * 0.33), 'redacting');
                });

                // Phase 3: LLM Structuring
                const structuredData = await LLMInferenceService.structureData(redactedText, (prog: number) => {
                    updateProgress(i, 66 + (prog * 0.34), 'structuring');
                });

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
