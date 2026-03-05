/**
 * Mock OCR Service
 * Integrates react-native-vision-camera or react-native-ml-kit-text-recognition
 * to extract raw bounding boxes and strings from the preprocessed document URI.
 */
export class OCRService {
    static async extractText(imageUri: string, onProgress?: (progress: number) => void): Promise<string> {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (onProgress) onProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve("Patient Name: John Doe\nSSN: 123-45-6789\nEmail: john.doe@example.com\nPhone: (555) 123-4567\nDiagnosis: Mild headache, prescribed rest.");
                }
            }, 150);
        });
    }
}
