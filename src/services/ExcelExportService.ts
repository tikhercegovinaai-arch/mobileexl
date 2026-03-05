import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { ValidationField } from '../store/useAppStore';

export class ExcelExportService {
    /**
     * Converts validation fields into an Excel file saved to the local cache.
     * Returns the URI of the generated file.
     */
    static async exportToExcel(fields: ValidationField[]): Promise<string> {
        // 1. Prepare data for Excel
        // Convert the flat field list into rows
        // If there are multiple fields with the same category, they should probably be in different columns or grouped by category.
        // For now, let's create a simple key-value sheet
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
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            encoding: FileSystem.EncodingType.Base64
        });

        return fileUri;
    }
}
