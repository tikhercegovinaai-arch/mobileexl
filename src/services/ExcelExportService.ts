import * as XLSX from 'xlsx';
import { Paths, File, EncodingType } from 'expo-file-system';
import { ValidationField } from '../store/useAppStore';

export class ExcelExportService {
    /**
     * Converts validation fields into an Excel file saved to the local cache.
     * Returns the URI of the generated file.
     */
    static async exportToExcel(fields: ValidationField[]): Promise<string> {
        // 1. Prepare data for Excel
        const data = fields.map(field => ({
            Category: field.category || 'General',
            Label: field.label,
            Value: field.value,
            Confidence: `${Math.round(field.confidence * 100)}%`
        }));

        // 2. Create Workbook and Worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

        // 3. Write workbook to string/buffer
        const wbout = XLSX.write(wb, {
            type: 'base64',
            bookType: 'xlsx'
        });

        // 4. Save to temporary directory
        const filename = `Extraction_${Date.now()}.xlsx`;

        // Using new SDK 55+ API
        const file = new File(Paths.cache, filename);

        // Write the base64 content
        await file.write(wbout, {
            encoding: EncodingType.Base64
        });

        return file.uri;
    }
}
