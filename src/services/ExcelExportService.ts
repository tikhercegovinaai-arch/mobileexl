import * as XLSX from 'xlsx';
import { Paths, File, EncodingType } from 'expo-file-system';
import { ValidationField } from '../store/useAppStore';

/** Minimum column width in characters */
const MIN_COL_WIDTH = 10;

/** Header fill colour (Excel ARGB format) */
const HEADER_FILL = 'FF1F2937'; // surface dark
const HEADER_FONT_COLOR = 'FFF9FAFB'; // textPrimary

/** Map a confidence fraction to a colour (ARGB) */
function confidenceColor(fraction: number): string {
    if (fraction >= 0.9) return 'FF10B981'; // green
    if (fraction >= 0.7) return 'FFF59E0B'; // amber
    return 'FFEF4444'; // red
}

/** Compute the max content width for column auto-sizing */
function computeColWidths(rows: Record<string, string>[]): Record<string, number> {
    const widths: Record<string, number> = {};
    rows.forEach((row) => {
        Object.entries(row).forEach(([key, val]) => {
            widths[key] = Math.max(widths[key] ?? key.length, String(val).length, MIN_COL_WIDTH);
        });
    });
    return widths;
}

/** Apply auto-widths to a worksheet */
function applyColWidths(ws: XLSX.WorkSheet, widths: Record<string, number>): void {
    ws['!cols'] = Object.values(widths).map((wch) => ({ wch: Math.min(wch, 60) }));
}

export type ExportFormat = 'xlsx' | 'csv';

export class ExcelExportService {
    /**
     * Converts validation fields into an Excel workbook saved to the local cache.
     * Fields are grouped onto separate sheets by category plus a Summary sheet.
     */
    static async exportToExcel(
        fields: ValidationField[],
        options: { filename?: string; format?: ExportFormat } = {},
    ): Promise<string> {
        const { filename, format = 'xlsx' } = options;

        const wb = XLSX.utils.book_new();

        // ── Group fields by category ────────────────────────────────────────────
        const categories = Array.from(
            new Set(fields.map((f) => f.category ?? 'General')),
        );

        for (const cat of categories) {
            const categoryFields = fields.filter((f) => (f.category ?? 'General') === cat);
            const rows = categoryFields.map((f) => ({
                Label: f.label,
                Value: f.value,
                Confidence: `${Math.round(f.confidence * 100)}%`,
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            ExcelExportService._styleHeaderRow(ws, ['Label', 'Value', 'Confidence']);
            ExcelExportService._styleConfidenceColumn(ws, categoryFields, 'C');
            const widths = computeColWidths(rows);
            applyColWidths(ws, widths);
            XLSX.utils.book_append_sheet(wb, ws, cat.slice(0, 31)); // Excel sheet name max 31 chars
        }

        // ── Summary sheet ───────────────────────────────────────────────────────
        const summaryRows = fields.map((f) => ({
            Category: f.category ?? 'General',
            Label: f.label,
            Value: f.value,
            Confidence: `${Math.round(f.confidence * 100)}%`,
        }));
        const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
        ExcelExportService._styleHeaderRow(summaryWs, ['Category', 'Label', 'Value', 'Confidence']);
        ExcelExportService._styleConfidenceColumn(summaryWs, fields, 'D');
        applyColWidths(summaryWs, computeColWidths(summaryRows));
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // ── Metadata sheet ──────────────────────────────────────────────────────
        const metaRows = [
            { Key: 'Export Date', Value: new Date().toISOString() },
            { Key: 'Total Fields', Value: String(fields.length) },
            { Key: 'Categories', Value: categories.join(', ') },
            {
                Key: 'Average Confidence',
                Value: `${Math.round(
                    (fields.reduce((s, f) => s + f.confidence, 0) / (fields.length || 1)) * 100,
                )}%`,
            },
        ];
        const metaWs = XLSX.utils.json_to_sheet(metaRows);
        ExcelExportService._styleHeaderRow(metaWs, ['Key', 'Value']);
        applyColWidths(metaWs, { Key: 20, Value: 40 });
        XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

        // ── Write to file ───────────────────────────────────────────────────────
        const ext = format === 'csv' ? 'csv' : 'xlsx';
        const name = filename
            ? `${filename}.${ext}`
            : `Extraction_${Date.now()}.${ext}`;

        const wbout =
            format === 'csv'
                ? XLSX.utils.sheet_to_csv(summaryWs)
                : XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        const file = new File(Paths.cache, name);
        await file.write(wbout, {
            encoding: format === 'csv' ? EncodingType.UTF8 : EncodingType.Base64,
        });

        return file.uri;
    }

    /** Bold + dark background header row */
    private static _styleHeaderRow(ws: XLSX.WorkSheet, headers: string[]): void {
        headers.forEach((h, colIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
            if (!ws[cellAddress]) return;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: HEADER_FONT_COLOR } },
                fill: { patternType: 'solid', fgColor: { rgb: HEADER_FILL } },
                alignment: { horizontal: 'center' },
            };
        });
    }

    /** Colour-code the Confidence column based on value */
    private static _styleConfidenceColumn(
        ws: XLSX.WorkSheet,
        fields: ValidationField[],
        col: string,
    ): void {
        fields.forEach((f, rowIdx) => {
            const cellAddress = `${col}${rowIdx + 2}`; // +2: header is row 1, data starts row 2
            if (!ws[cellAddress]) return;
            ws[cellAddress].s = {
                font: {
                    bold: true,
                    color: { rgb: confidenceColor(f.confidence) },
                },
            };
        });
    }
}
