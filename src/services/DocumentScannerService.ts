import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';

export interface ScannerResult {
    status: 'success' | 'cancelled' | 'error';
    images?: string[];
    error?: string;
}

export const DocumentScannerService = {
    /**
     * Triggers the native document scanner overlay which handles
     * automatic edge detection, perspective warping, and thresholding.
     * 
     * This MVP relies on react-native-document-scanner-plugin.
     * Later this can be swapped with Scanbot without refactoring UI.
     */
    async scanDocument(options?: { isBatch?: boolean }): Promise<ScannerResult> {
        try {
            const { scannedImages } = await DocumentScanner.scanDocument({
                maxNumDocuments: options?.isBatch ? 50 : 1, // Allow multiple documents in batch mode
                responseType: ResponseType.ImageFilePath, // Keep memory low by using file URIs rather than Base64
            });

            if (scannedImages && scannedImages.length > 0) {
                return { status: 'success', images: scannedImages };
            }
            return { status: 'cancelled' };
        } catch (e: any) {
            console.error("[DocumentScannerService] Scanning failed:", e);
            return { status: 'error', error: e.message || 'Unknown error during scan' };
        }
    }
};
