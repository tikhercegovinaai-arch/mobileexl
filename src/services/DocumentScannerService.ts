import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ScannerResult {
    status: 'success' | 'cancelled' | 'error';
    images?: string[];
    error?: string;
}

// A4 paper at 300 DPI requires roughly 2480 x 3508 pixels.
// We'll enforce a minimum resolution equivalent to ~300 DPI on the longest edge (with some leeway for cropping).
const MIN_RESOLUTION_LONGEST_EDGE = 2000;

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
                // Post-process each image for quality, DPI validation, and binarization proxy
                const enhancedImages = await Promise.all(
                    scannedImages.map((uri) => this.validateAndEnhance(uri))
                );

                return { status: 'success', images: enhancedImages };
            }
            return { status: 'cancelled' };
        } catch (e: any) {
            console.error("[DocumentScannerService] Scanning failed:", e);
            if (e.message?.includes('Scan quality too low')) {
                return { status: 'error', error: e.message }; // Pass through validation errors to UI
            }
            return { status: 'error', error: e.message || 'Unknown error during scan' };
        }
    },

    /**
     * Validates image DPI/Resolution and runs enhancements.
     * Uses expo-image-manipulator to guarantee JPEG format and check resolution.
     */
    async validateAndEnhance(imageUri: string): Promise<string> {
        try {
            // Read properties and perform a lightweight standardizing pass.
            // In a full implementation, native modules specifically for binarization would be injected here.
            // For now, we use a basic manipulation pass to get dimensions and guarantee JPEG formatting.
            const result = await ImageManipulator.manipulateAsync(
                imageUri,
                [],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            const longestEdge = Math.max(result.width, result.height);

            // 1. DPI Validation
            // We expect at least ~300 DPI resolution for handwriting analysis.
            if (longestEdge < MIN_RESOLUTION_LONGEST_EDGE) {
                console.warn(`[DocumentScannerService] Low resolution scan detected: ${result.width}x${result.height}.`);
                // Enforce strict resolution requirement for accuracy:
                throw new Error("Scan quality too low. Please ensure good lighting, hold the camera closer, and scan the full page.");
            }

            // 2. Quality and Lighting Enhancement (Adaptive Binarization Proxy)
            // As expo-image-manipulator doesn't have an explicit binarization filter, 
            // the DocumentScanner config usually handles the binarization natively when set appropriately.
            // This pipeline step serves as the placeholder for advanced visual filters.

            return result.uri;
        } catch (e) {
            console.error("[DocumentScannerService] Validation/Enhancement failed:", e);
            throw e;
        }
    }
};
