/**
 * FileParserService  
 * Converts uploaded non-image files into either:
 *  - `imageUris[]`  — for images (passed to existing camera pipeline)
 *  - `structuredData` — for Excel (fed directly into validation)
 *  - `textContent` — for PDF/Word (fed into LLM extraction like a scanned doc)
 */
import { UploadedFile } from './UploadService';
import * as XLSX from 'xlsx';

export type ParsedResult =
    | { type: 'images'; uris: string[] }
    | { type: 'structured'; data: Record<string, unknown> }
    | { type: 'text'; content: string; pages?: string[] };

export const FileParserService = {
    async parse(file: UploadedFile): Promise<ParsedResult> {
        const mime = file.mimeType.toLowerCase();

        // ── Images: pass URI directly ─────────────────────────────────────────
        if (mime.startsWith('image/')) {
            return { type: 'images', uris: [file.uri] };
        }

        // ── Excel ─────────────────────────────────────────────────────────────
        if (
            mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mime === 'application/vnd.ms-excel' ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls')
        ) {
            return await FileParserService._parseExcel(file);
        }

        // ── PDF ───────────────────────────────────────────────────────────────
        if (mime === 'application/pdf' || file.name.endsWith('.pdf')) {
            return await FileParserService._parsePdf(file);
        }

        // ── Word ──────────────────────────────────────────────────────────────
        if (
            mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mime === 'application/msword' ||
            file.name.endsWith('.docx') ||
            file.name.endsWith('.doc')
        ) {
            return await FileParserService._parseWord(file);
        }

        throw new Error(`Unsupported file type: ${mime}`);
    },

    async _parseExcel(file: UploadedFile): Promise<ParsedResult> {
        // content is an ArrayBuffer from FileReader
        const buffer = file.content as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Flatten rows into keyed data object (field per cell)
        const data: Record<string, unknown> = {};
        rows.forEach((row, i) => {
            Object.entries(row).forEach(([col, val]) => {
                data[`Row${i + 1}_${col}`] = val;
            });
        });

        return { type: 'structured', data };
    },

    async _parsePdf(file: UploadedFile): Promise<ParsedResult> {
        try {
            // Dynamically import pdfjs-dist legacy build to avoid import.meta Metro bundler error
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
            // Point worker to CDN to avoid bundling issues
            (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
                `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const buffer = file.content as ArrayBuffer;
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const pages: string[] = [];

            for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ')
                    .trim();
                pages.push(pageText);
            }

            return { type: 'text', content: pages.join('\n\n---\n\n'), pages };
        } catch (e: any) {
            console.error('[FileParserService] PDF parse error:', e);
            throw new Error('Failed to parse PDF: ' + (e?.message ?? 'Unknown error'));
        }
    },

    async _parseWord(file: UploadedFile): Promise<ParsedResult> {
        try {
            const mammoth = await import('mammoth');
            const buffer = file.content as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            return { type: 'text', content: result.value };
        } catch (e: any) {
            console.error('[FileParserService] Word parse error:', e);
            throw new Error('Failed to parse Word document: ' + (e?.message ?? 'Unknown error'));
        }
    },

    /**
     * Converts structured Excel data into ValidationField shape for initializeValidation.
     */
    structuredToValidationData(data: Record<string, unknown>): Record<string, unknown> {
        return data;
    },

    /**
     * Converts extracted text into a pseudo-structured object for the LLM extraction pipeline.
     */
    textToExtractionInput(text: string): string {
        return text;
    },
};
