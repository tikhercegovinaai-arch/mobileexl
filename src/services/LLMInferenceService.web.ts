/**
 * LLM Inference Service - WEB Implementation (Mock)
 * This is a web-compatible mock implementation that doesn't use react-native-llama.
 * Used for web platform testing and development.
 */
export class LLMInferenceService {
    /**
     * Web fallback - no-op for web platform
     */
    static async initialize(_modelPath: string): Promise<void> {
        console.log("[LLMInferenceService.web] Initialize called (web platform - no-op)");
    }

    /**
     * Web mock implementation - always uses mock fallback
     */
    static async structureData(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<Record<string, unknown>> {
        console.log("[LLMInferenceService.web] structureData called (web platform - using mock)");
        return this._mockFallback(text, onProgress);
    }

    /**
     * Web mock implementation for consolidating records
     */
    static async consolidateRecords(
        records: Record<string, any>[],
        _onProgress?: (p: number) => void
    ): Promise<Record<string, unknown>> {
        console.log("[LLMInferenceService.web] consolidateRecords called (web platform)");
        if (records.length === 1) return records[0];
        return { consolidated: records };
    }

    /**
     * Mock fallback that simulates extraction from text
     */
    private static async _mockFallback(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<Record<string, unknown>> {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (onProgress) onProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    // Basic parsing to make the fallback feel slightly "real"
                    const extractedData: Record<string, unknown> = {
                        patientName: text.match(/Patient Name: (.*)/)?.[1] || "Unknown",
                        contactInfo: {
                            email: text.includes('[REDACTED_EMAIL]') ? '[REDACTED_EMAIL]' : null,
                            phone: text.includes('[REDACTED_PHONE]') ? '[REDACTED_PHONE]' : null,
                        },
                        visitSummary: {
                            diagnosis: text.match(/Diagnosis: (.*)/)?.[1] || "No diagnosis found",
                            prescriptions: []
                        }
                    };
                    resolve(extractedData);
                }
            }, 50);
        });
    }

    /**
     * Web fallback - no-op
     */
    static async release(): Promise<void> {
        console.log("[LLMInferenceService.web] Release called (web platform - no-op)");
    }
}
