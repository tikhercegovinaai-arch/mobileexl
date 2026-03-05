import { OCRService } from './OCRService';
import { PIIRedactionService } from './PIIRedactionService';
import { LLMInferenceService } from './LLMInferenceService';
import { ExtractionPhase } from '../store/useAppStore';

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

        const allStructuredData: any[] = [];

        for (let i = 0; i < total; i++) {
            const uri = uris[i];
            const baseProgress = (i / total) * 100;
            const docWeight = 100 / total;

            // Phase 1: OCR
            const text = await OCRService.extractText(uri, (prog) => {
                onProgress(baseProgress + (prog / 100) * docWeight * 0.33, i, total, 'recognizing');
            });

            // Phase 2: PII Redaction
            const redactedText = await PIIRedactionService.redact(text, (prog) => {
                onProgress(baseProgress + docWeight * 0.33 + (prog / 100) * docWeight * 0.33, i, total, 'redacting');
            });

            // Phase 3: LLM Structuring
            const structuredData = await LLMInferenceService.structureData(redactedText, (prog) => {
                onProgress(baseProgress + docWeight * 0.66 + (prog / 100) * docWeight * 0.34, i, total, 'structuring');
            });

            allStructuredData.push(structuredData);
        }

        // Merge results into a single consolidated JSON structure
        return this._mergeStructuredData(allStructuredData);
    },

    /**
     * Helper to merge multiple JSON outputs from the LLM into one cohesive dataset.
     */
    _mergeStructuredData(datasets: any[]): Record<string, unknown> {
        if (datasets.length === 1) return datasets[0];

        // Simplistic merge: If the data is objects, we create a wrapper with an array.
        // Or we just bundle them as an array under a `batchResults` key to avoid deep conflicts.
        return {
            batchResults: datasets
        };
    }
};
