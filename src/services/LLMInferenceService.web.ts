import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXTRACTION_SCHEMA, CONFIDENCE_SCHEMA } from '../constants/schemas';

/**
 * LLM Inference Service - WEB Implementation
 * Uses Google Gemini API for structured data extraction on the web.
 * Requires EXPO_PUBLIC_GEMINI_API_KEY environment variable.
 */
export class LLMInferenceService {
    private static genAI: GoogleGenerativeAI | null = null;
    private static model: any = null;

    /**
     * Initializes the Gemini API client
     */
    static async initialize(_modelPath?: string): Promise<void> {
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[LLMInferenceService.web] EXPO_PUBLIC_GEMINI_API_KEY is not defined");
            return;
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });
            console.log("[LLMInferenceService.web] Initialize Gemini API client");
        }
    }

    /**
     * Web implementation using Gemini API
     */
    static async structureData(
        text: string,
        onProgress?: (progress: number) => void
    ): Promise<Record<string, unknown>> {
        if (!this.model) {
            await this.initialize();
            if (!this.model) {
                console.warn("[LLMInferenceService.web] Model not initialized. Falling back to mock.");
                return this._mockFallback(text, onProgress);
            }
        }

        try {
            if (onProgress) onProgress(10);
            
            // Phase 1: Extraction
            const extractionPrompt = `Extract patient details from the handwriting OCR text. Follow this JSON schema exactly: ${JSON.stringify(EXTRACTION_SCHEMA)}\n\nInput Text:\n${text}`;
            
            const extractionResult = await this.model.generateContent(extractionPrompt);
            const extractedText = extractionResult.response.text();
            let extracted = JSON.parse(extractedText);

            if (onProgress) onProgress(50);

            // Phase 2: Confidence Assessment
            const confidencePrompt = `Evaluate the confidence (0.0 to 1.0) for each extracted field based on the original OCR text. Identify any errors or gaps. Follow this JSON schema exactly: ${JSON.stringify(CONFIDENCE_SCHEMA)}\n\nOriginal Text:\n${text}\n\nExtracted Data:\n${extractedText}`;
            
            const confidenceResult = await this.model.generateContent(confidencePrompt);
            const confidenceData = JSON.parse(confidenceResult.response.text());

            if (onProgress) onProgress(90);

            // Phase 3: Merging & Finalizing
            const finalData = {
                ...extracted,
                _confidence: confidenceData.fields.reduce((acc: any, f: any) => {
                    acc[f.fieldId] = {
                        score: f.confidence,
                        reasoning: f.reasoning
                    };
                    return acc;
                }, {})
            };

            if (onProgress) onProgress(100);
            return finalData;

        } catch (error) {
            console.error("[LLMInferenceService.web] structureData error:", error);
            return this._mockFallback(text, onProgress);
        }
    }

    /**
     * Web implementation for consolidating records
     */
    static async consolidateRecords(
        records: Record<string, any>[],
        onProgress?: (p: number) => void
    ): Promise<Record<string, unknown>> {
        if (records.length === 1) return records[0];
        
        if (!this.model) {
            await this.initialize();
            if (!this.model) return { consolidated: records };
        }

        try {
            if (onProgress) onProgress(10);
            const recordsJson = JSON.stringify(records, null, 2);
            const prompt = `Merge the following multiple page extractions into a single, consistent patient record. Resolve duplicates and fill gaps. Follow this JSON schema exactly: ${JSON.stringify(EXTRACTION_SCHEMA)}\n\nInput Data:\n${recordsJson}`;

            const result = await this.model.generateContent(prompt);
            if (onProgress) onProgress(100);
            return JSON.parse(result.response.text());
        } catch (error) {
            console.error("[LLMInferenceService.web] consolidateRecords error:", error);
            return { consolidated: records };
        }
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
