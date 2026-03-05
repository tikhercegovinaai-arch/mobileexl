/**
 * PII Redaction Service
 * Contains logic mimicking Microsoft Presidio but running locally.
 * Uses optimized regex patterns to detect standard PII and replaces them.
 */
export class PIIRedactionService {
    static async redact(text: string, onProgress?: (progress: number) => void): Promise<string> {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20;
                if (onProgress) onProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);

                    let redactedText = text;

                    // Email
                    redactedText = redactedText.replace(
                        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                        '[REDACTED_EMAIL]'
                    );

                    // SSN
                    redactedText = redactedText.replace(
                        /\b\d{3}-\d{2}-\d{4}\b/g,
                        '[REDACTED_SSN]'
                    );

                    // Phone (simplified)
                    redactedText = redactedText.replace(
                        /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
                        '[REDACTED_PHONE]'
                    );

                    resolve(redactedText);
                }
            }, 100);
        });
    }
}
