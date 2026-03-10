import { LLMInferenceService } from '../LLMInferenceService.web';

async function verify() {
    console.log("--- LLMInferenceService Web Verification ---");
    
    // Check if API key is present
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        console.warn("WARNING: EXPO_PUBLIC_GEMINI_API_KEY is not set. The service will use mock fallback.");
    }

    const testText = "Patient Name: Jane Doe\nDiagnosis: Hypertension\nPrescriptions: Lisinopril 10mg";
    
    console.log("\nTesting structureData...");
    try {
        const result = await LLMInferenceService.structureData(testText, (p) => {
            console.log(`Progress: ${p}%`);
        });
        console.log("Result:", JSON.stringify(result, null, 2));
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
        console.log("Consolidated Result:", JSON.stringify(consolidated, null, 2));
    } catch (e) {
        console.error("consolidateRecords failed:", e);
    }
}

verify();
