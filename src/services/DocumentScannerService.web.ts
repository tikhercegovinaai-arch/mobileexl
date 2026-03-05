export interface ScannerResult {
    status: 'success' | 'cancelled' | 'error';
    images?: string[];
    error?: string;
}

export const DocumentScannerService = {
    /**
     * Web Mock for the native Document Scanner Plugin.
     * The native plugin crashes the web build, so this shim returns an error on web.
     */
    async scanDocument(options?: { isBatch?: boolean }): Promise<ScannerResult> {
        console.warn("[DocumentScannerService] Web platform is not supported for native document scanning.");
        // We return an error so the UI handles it gracefully instead of crashing
        return {
            status: 'error',
            error: 'Scanning is not supported on the web platform. Please use the mobile app or upload a file.'
        };
    },

    async validateAndEnhance(imageUri: string): Promise<string> {
        console.warn("[DocumentScannerService] validateAndEnhance is not supported on web.");
        return imageUri; // Pass through on web
    }
};
