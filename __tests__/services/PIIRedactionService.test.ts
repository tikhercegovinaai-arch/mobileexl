import { PIIRedactionService } from '../../src/services/PIIRedactionService';

describe('PIIRedactionService', () => {
    it('redacts email addresses correctly', async () => {
        const text = "Contact John at john.doe@example.com for more info.";
        const redacted = await PIIRedactionService.redact(text);
        expect(redacted).toBe("Contact John at [REDACTED_EMAIL] for more info.");
    });

    it('redacts SSNs correctly', async () => {
        const text = "Patient SSN is 123-45-6789 and name is Jane.";
        const redacted = await PIIRedactionService.redact(text);
        expect(redacted).toBe("Patient SSN is [REDACTED_SSN] and name is Jane.");
    });

    it('redacts phone numbers correctly', async () => {
        const text = "Call me at (555) 123-4567 or 555-987-6543.";
        const redacted = await PIIRedactionService.redact(text);
        expect(redacted).toBe("Call me at [REDACTED_PHONE] or [REDACTED_PHONE].");
    });

    it('redacts multiple PII types in the same string', async () => {
        const text = "Name: John Doe, SSN: 987-65-4321, Email: jdoe@test.com, Phone: 123.456.7890.";
        const redacted = await PIIRedactionService.redact(text);
        expect(redacted).toBe("Name: John Doe, SSN: [REDACTED_SSN], Email: [REDACTED_EMAIL], Phone: [REDACTED_PHONE].");
    });

    it('calls onProgress callback', async () => {
        const text = "Some text";
        const onProgress = jest.fn();
        await PIIRedactionService.redact(text, onProgress);
        expect(onProgress).toHaveBeenCalled();
        expect(onProgress).toHaveBeenLastCalledWith(100);
    });
});
