import { LLMInferenceService } from '../LLMInferenceService.web.ts';

// Mock environment variable if not present for testing logic
if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = "mock-key-for-testing";
}

async function verify() {
    console.log("--- LLMInferenceService Web Verification ---");
    
    if (process.env.EXPO_PUBLIC_GEMINI_API_KEY === "mock-key-for-testing") {
        console.warn("WARNING: EXPO_PUBLIC_GEMINI_API_KEY is not set. Using a mock key for demonstration.");
    }

    const testText = "Patient Name: Jane Doe\nDiagnosis: Hypertension\nPrescriptions: Lisinopril 10mg";
    
    console.log("\nTesting structureData...");
    try {
        const result = await LLMInferenceService.structureData(testText, (p) => {
            console.log(`Progress: ${p}%`);
        });
        console.log("Result keys:", Object.keys(result));
        if (result._confidence) {
            console.log("Confidence score for patientName:", (result as any)._confidence.patientName?.score);
        }
    } catch (e) {
        console.error("structureData failed:", e);
    }

    console.log("\nTesting consolidateRecords...");
    try {
        const records = [
            { patientName: "Jane Doe", visitSummary: { diagnosis: "Hypertension" } },
            { patientName: "Jane Doe", contactInfo: { phone: "555-1234" } }
        ];
        const consolidated = await LLMInferenceService.consolidateRecords(records, (p) => {
            console.log(`Progress: ${p}%`);
        });
        console.log("Consolidated Result keys:", Object.keys(consolidated));
    } catch (e) {
        console.error("consolidateRecords failed:", e);
    }
}

verify();
