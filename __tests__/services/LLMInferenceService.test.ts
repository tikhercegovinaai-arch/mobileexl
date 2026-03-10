import { LLMInferenceService } from '../../src/services/LLMInferenceService';

jest.mock('react-native-llama', () => ({
    initLlama: jest.fn().mockResolvedValue({
        completion: jest.fn(),
        release: jest.fn()
    })
}), { virtual: true });

describe('LLMInferenceService', () => {
    it('structures data correctly', async () => {
        const text = "Patient Name: John Doe\nContact: [REDACTED_EMAIL] / [REDACTED_PHONE]\nSSN: [REDACTED_SSN]";
        const data = await LLMInferenceService.structureData(text);

        expect(data).toEqual({
            _confidence: {
                "contactInfo.email": { reasoning: "Recognized standard pattern", score: 0.85 },
                patientName: { reasoning: "Clear printed text", score: 0.95 }
            },
            patientName: 'John Doe',
            contactInfo: {
                email: '[REDACTED_EMAIL]',
                phone: '[REDACTED_PHONE]',
            },
            visitSummary: {
                diagnosis: 'Normal',
                prescriptions: []
            }
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
