import * as XLSX from 'xlsx';
import { Paths, File, EncodingType } from 'expo-file-system';
import { ValidationField } from '../store/useAppStore';
import { ExportFormat } from './ExcelExportService';

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
        options: { filename?: string; format?: ExportFormat } = {},
    ): Promise<string> {
        const { filename, format = 'xlsx' } = options;

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

        // Write
        const ext = format === 'csv' ? 'csv' : 'xlsx';
        const name = filename ? `${filename}.${ext}` : `Structured_${Date.now()}.${ext}`;

        const content =
            format === 'csv'
                ? XLSX.utils.sheet_to_csv(ws)
                : XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        const file = new File(Paths.cache, name);
        await file.write(content, {
            encoding: format === 'csv' ? EncodingType.UTF8 : EncodingType.Base64,
        });

        return file.uri;
    }
}
