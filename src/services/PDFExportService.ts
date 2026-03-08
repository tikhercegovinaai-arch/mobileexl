import { ValidationField } from '../store/useAppStore';

/**
 * PDF export service.
 * Generates an HTML table and converts to PDF using react-native-html-to-pdf.
 * Lazy-loads the PDF library to avoid bloating the main bundle.
 */
export class PDFExportService {
    /**
     * Generate a PDF file from validation fields.
     * Returns the file path of the generated PDF.
     */
    static async generate(
        fields: ValidationField[],
        title: string = 'Exelent Extraction Report'
    ): Promise<string> {
        const html = PDFExportService.buildHTML(fields, title);

        // Lazy-load to avoid bundling on import
        const RNHTMLtoPDF = require('react-native-html-to-pdf');
        const result = await RNHTMLtoPDF.convert({
            html,
            fileName: `exelent_report_${Date.now()}`,
            directory: 'Documents',
        });

        if (!result.filePath) {
            throw new Error('PDF generation failed: no file path returned');
        }

        return result.filePath;
    }

    /**
     * Build an HTML table string from validation fields.
     */
    static buildHTML(fields: ValidationField[], title: string): string {
        const tableRows = fields
            .map(
                (f) =>
                    `<tr>
                        <td>${PDFExportService.escapeHTML(f.label)}</td>
                        <td>${PDFExportService.escapeHTML(f.value)}</td>
                        <td style="text-align:center">${Math.round(f.confidence * 100)}%</td>
                        <td>${PDFExportService.escapeHTML(f.category ?? '')}</td>
                    </tr>`
            )
            .join('\n');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 24px; color: #111827; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #6B7280; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #F3F4F6; text-align: left; padding: 8px 12px; border-bottom: 2px solid #D1D5DB; }
        td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; }
        tr:nth-child(even) td { background: #F9FAFB; }
    </style>
</head>
<body>
    <h1>${PDFExportService.escapeHTML(title)}</h1>
    <p class="meta">Generated ${new Date().toLocaleString()} · ${fields.length} fields</p>
    <table>
        <thead>
            <tr><th>Label</th><th>Value</th><th>Confidence</th><th>Category</th></tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
</body>
</html>`;
    }

    static escapeHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
