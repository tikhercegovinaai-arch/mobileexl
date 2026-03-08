import * as XLSX from 'xlsx';
import { Paths, File } from 'expo-file-system';
import * as Print from 'expo-print';
import { ValidationField } from '../store/useAppStore';
import { ExportFormat } from './ExcelExportService';
import { PDFTemplateService, PDFTemplateType } from './PDFTemplateService';

/**
 * Maps a column key to its ordered position in the output sheet.
 * Fields not present in the mapping are routed to a 'Misc' column.
 */
const DEFAULT_COLUMN_ORDER = [
    'Name',
    'Date',
    'Amount',
    'Address',
    'Reference',
    'Misc',
];

export interface InjectorColumnMapping {
    columnKey: string;
    fieldIds: string[];
}

export interface InjectorRow {
    [columnKey: string]: string;
}

export class ExcelInjectorService {
    /**
     * Builds a structured worksheet where each column corresponds to a mapped
     * category and each row holds the value(s) assigned to it.
     *
     * @param fields   The full set of validated fields from the store.
     * @param mappings Column-to-field-id associations from the ColumnMappingScreen.
     * @returns URI of the generated .xlsx file.
     */
    static async injectToExcel(
        fields: ValidationField[],
        mappings: InjectorColumnMapping[],
        options: { filename?: string; format?: ExportFormat; pdfTemplate?: PDFTemplateType } = {},
    ): Promise<string> {
        const { filename, format = 'xlsx', pdfTemplate = 'corporate' } = options;

        // Build a quick lookup from fieldId → field
        const fieldMap = new Map<string, ValidationField>(fields.map((f) => [f.id, f]));

        // Resolve mapped columns in order
        const usedColumns = mappings.map((m) => m.columnKey);
        const orderedColumns = [
            ...DEFAULT_COLUMN_ORDER.filter((c) => usedColumns.includes(c)),
            ...usedColumns.filter((c) => !DEFAULT_COLUMN_ORDER.includes(c)),
        ];

        // Find unmapped fields (not present in any mapping)
        const mappedIds = new Set(mappings.flatMap((m) => m.fieldIds));
        const unmappedFields = fields.filter((f) => !mappedIds.has(f.id));

        // Determine max rows needed
        const maxRows = Math.max(
            1,
            ...mappings.map((m) => m.fieldIds.length),
            unmappedFields.length,
        );

        // Build row array
        const rows: InjectorRow[] = Array.from({ length: maxRows }, () => ({}));

        // Fill mapped columns
        mappings.forEach((mapping) => {
            mapping.fieldIds.forEach((fid, rowIdx) => {
                const field = fieldMap.get(fid);
                if (field) {
                    rows[rowIdx][mapping.columnKey] = field.value;
                }
            });
        });

        // Fill unmapped into a 'Misc' column
        if (unmappedFields.length > 0) {
            unmappedFields.forEach((f, rowIdx) => {
                rows[rowIdx]['Misc (Unmapped)'] = `${f.label}: ${f.value}`;
            });
            orderedColumns.push('Misc (Unmapped)');
        }

        // All columns in order including unmapped
        const allColumns = [...new Set([...orderedColumns, ...Object.keys(rows[0] ?? {})])];

        // Normalise rows so every row has all columns
        const normRows = rows.map((row) => {
            const normalised: InjectorRow = {};
            allColumns.forEach((col) => {
                normalised[col] = row[col] ?? '';
            });
            return normalised;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(normRows, { header: allColumns });

        // Header styling
        allColumns.forEach((_, colIdx) => {
            const addr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
            if (!ws[addr]) return;
            ws[addr].s = {
                font: { bold: true, color: { rgb: 'FFF9FAFB' } },
                fill: { patternType: 'solid', fgColor: { rgb: 'FF1D4ED8' } },
                alignment: { horizontal: 'center' },
            };
        });

        // Auto column widths
        ws['!cols'] = allColumns.map((col) => {
            const maxLen = Math.max(
                col.length,
                ...normRows.map((r) => (r[col] ?? '').length),
                10,
            );
            return { wch: Math.min(maxLen, 60) };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Structured Data');

        if (format === 'pdf') {
            const html = PDFTemplateService.getTemplate(pdfTemplate, fields, {
                title: filename || 'Structured Extraction Report',
            });
            const { uri } = await Print.printToFileAsync({ html });
            return uri;
        }

        // Write
        const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'xlsx';
        const name = filename ? `${filename}.${ext}` : `Structured_${Date.now()}.${ext}`;

        let content: string | string[];
        let encoding: 'utf8' | 'base64' = 'base64';

        if (format === 'json') {
            content = JSON.stringify(normRows, null, 2);
            encoding = 'utf8';
        } else if (format === 'csv') {
            content = XLSX.utils.sheet_to_csv(ws);
            encoding = 'utf8';
        } else {
            content = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            encoding = 'base64';
        }

        const file = new File(Paths.cache, name);
        await file.write(content as string, {
            encoding,
        });

        return file.uri;
    }
}
