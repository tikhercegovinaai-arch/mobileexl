import { ValidationField } from '../store/useAppStore';
import { PDFTemplateService, PDFTemplateType, PDFTemplateOptions } from './PDFTemplateService';

/**
 * PDF export service.
 * Generates an HTML document via PDFTemplateService and converts to PDF using react-native-html-to-pdf.
 * Lazy-loads the PDF library to avoid bloating the main bundle.
 */
export class PDFExportService {
    /**
     * Generate a PDF file from validation fields using a specific template.
     * Returns the file path of the generated PDF.
     */
    static async generate(
        fields: ValidationField[],
        templateType: PDFTemplateType = 'corporate',
        options: PDFTemplateOptions = { title: 'Exelent Extraction Report' }
    ): Promise<string> {
        const html = PDFTemplateService.getTemplate(templateType, fields, options);

        // Lazy-load to avoid bundling on import
        // Note: react-native-html-to-pdf is a native module
        const RNHTMLtoPDF = require('react-native-html-to-pdf');
        
        const result = await RNHTMLtoPDF.convert({
            html,
            fileName: `${options.title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            directory: 'Documents',
        });

        if (!result.filePath) {
            throw new Error('PDF generation failed: no file path returned');
        }

        return result.filePath;
    }
}
