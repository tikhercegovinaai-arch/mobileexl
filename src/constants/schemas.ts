import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Extraction Schemas
 * Defined using Zod for type-safety and converted to JSON Schema format 
 * to be used with llama.cpp grammar or local validation logic.
 */

const ExtractionSchemaZod = z.object({
    patientName: z.string().describe("Full name of the patient"),
    dateOfBirth: z.string().optional().describe("DOB in YYYY-MM-DD or DD/MM/YYYY format"),
    socialSecurity: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional().describe("SSN in XXX-XX-XXXX format"),
    contactInfo: z.object({
        email: z.string().email().optional(),
        phone: z.string().optional()
    }).optional(),
    visitSummary: z.object({
        reasonForVisit: z.string().optional(),
        diagnosis: z.string().optional(),
        prescriptions: z.array(z.string()).optional()
    }).optional()
});

export const EXTRACTION_SCHEMA = zodToJsonSchema(ExtractionSchemaZod as any, { target: "jsonSchema7" });

export type ExtractionData = z.infer<typeof ExtractionSchemaZod>;
