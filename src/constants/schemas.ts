/**
 * Extraction Schemas
 * Defined using JSON Schema format to be used with llama.cpp grammar
 * or local validation logic.
 */

export const EXTRACTION_SCHEMA = {
    type: "object",
    properties: {
        patientName: {
            type: "string",
            description: "Full name of the patient"
        },
        dateOfBirth: {
            type: "string",
            description: "DOB in YYYY-MM-DD or DD/MM/YYYY format"
        },
        socialSecurity: {
            type: "string",
            pattern: "^\\d{3}-\\d{2}-\\d{4}$",
            description: "SSN in XXX-XX-XXXX format"
        },
        contactInfo: {
            type: "object",
            properties: {
                email: { type: "string" },
                phone: { type: "string" }
            }
        },
        visitSummary: {
            type: "object",
            properties: {
                reasonForVisit: { type: "string" },
                diagnosis: { type: "string" },
                prescriptions: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        }
    },
    required: ["patientName"]
};

export type ExtractionData = {
    patientName: string;
    dateOfBirth?: string;
    socialSecurity?: string;
    contactInfo?: {
        email?: string;
        phone?: string;
    };
    visitSummary?: {
        reasonForVisit?: string;
        diagnosis?: string;
        prescriptions?: string[];
    };
};
