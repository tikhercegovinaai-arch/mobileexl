import { ValidationField } from '../store/useAppStore';

/**
 * Structured JSON export with metadata envelope.
 */
export class JSONExportService {
    /**
     * Serialize validation fields to a structured JSON string.
     */
    static serialize(
        fields: ValidationField[],
        options?: { schemaVersion?: string; prettyPrint?: boolean }
    ): string {
        const { schemaVersion = '1.0.0', prettyPrint = true } = options ?? {};

        const payload = {
            schemaVersion,
            extractedAt: new Date().toISOString(),
            fieldCount: fields.length,
            fields: fields.map((f) => ({
                id: f.id,
                label: f.label,
                value: f.value,
                confidence: Math.round(f.confidence * 100) / 100,
                category: f.category ?? null,
                boundingBox: f.boundingBox ?? null,
            })),
        };

        return prettyPrint ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
    }
}
