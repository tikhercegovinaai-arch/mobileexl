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
            const text = await OCRService.extractText(uri, (prog: number) => {
                onProgress(baseProgress + (prog / 100) * docWeight * 0.33, i, total, 'recognizing');
            });

            // Phase 2: PII Redaction
            const redactedText = await PIIRedactionService.redact(text, (prog: number) => {
                onProgress(baseProgress + docWeight * 0.33 + (prog / 100) * docWeight * 0.33, i, total, 'redacting');
            });

            // Phase 3: LLM Structuring
            const structuredData = await LLMInferenceService.structureData(redactedText, (prog: number) => {
                onProgress(baseProgress + docWeight * 0.66 + (prog / 100) * docWeight * 0.34, i, total, 'structuring');
            });

            allStructuredData.push(structuredData);
        }

        // Merge results into a single consolidated JSON structure via LLM (Reduce Phase)
        return LLMInferenceService.consolidateRecords(allStructuredData, (prog: number) => {
            onProgress(100, total, total, 'structuring'); // Final progress push
        });
    },
};
