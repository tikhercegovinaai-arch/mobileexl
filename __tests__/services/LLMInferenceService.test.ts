import { LLMInferenceService } from '../../src/services/LLMInferenceService';

describe('LLMInferenceService', () => {
    it('structures data correctly', async () => {
        const text = "Patient Name: John Doe\nContact: [REDACTED_EMAIL] / [REDACTED_PHONE]\nSSN: [REDACTED_SSN]";
        const data = await LLMInferenceService.structureData(text);

        expect(data).toEqual({
            patientName: 'John Doe',
            contactInfo: {
                email: '[REDACTED_EMAIL]',
                phone: '[REDACTED_PHONE]',
            },
            socialSecurity: '[REDACTED_SSN]',
            notes: text,
        });
    });

    it('calls onProgress callback', async () => {
        const text = "Some text";
        const onProgress = jest.fn();
        await LLMInferenceService.structureData(text, onProgress);

        expect(onProgress).toHaveBeenCalled();
        expect(onProgress).toHaveBeenLastCalledWith(100);
    });
});
