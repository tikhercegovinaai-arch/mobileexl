import { ValidationField } from '../store/useAppStore';

/**
 * RFC 4180-compliant CSV serializer.
 * Properly escapes fields containing commas, quotes, or newlines.
 */
export class CSVExportService {
    /**
     * Serialize an array of validation fields to CSV string.
     * Returns a string ready to write to file.
     */
    static serialize(fields: ValidationField[]): string {
        const headers = ['Label', 'Value', 'Confidence', 'Category'];
        const rows = fields.map((f) => [
            CSVExportService.escapeCSV(f.label),
            CSVExportService.escapeCSV(f.value),
            String(Math.round(f.confidence * 100)),
            CSVExportService.escapeCSV(f.category ?? ''),
        ]);

        return [
            headers.join(','),
            ...rows.map((r) => r.join(',')),
        ].join('\n');
    }

    /**
     * Escape a single CSV field per RFC 4180.
     */
    static escapeCSV(value: string): string {
        if (/[",\n\r]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
