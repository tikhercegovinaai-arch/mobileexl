# Data Protection Impact Assessment (DPIA) Template
## AI Handwriting Extraction & Excel Integration

### 1. Project Overview
**Objective:** Locally process medical/personal documents into structured private Excel files.
**Privacy Strategy:** Local-first processing, zero-cloud storage, on-device PII redaction.

### 2. Data Flow & Types
- **Input:** Raw camera photos of handwritten documents.
- **Data Categories:** Names, IDs (SSN), Medical diagnosis, contact details.
- **Processing:** OCR -> PII Redaction -> LLM Structuring -> Excel serialization.
- **Storage:** Data resides strictly within the application's encrypted sandbox (`expo-secure-store`).

### 3. Risk Assessment & Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| Unauthorized Access | Medium | High | Biometric (FaceID/Fingerprint) hardware gating implemented. |
| Data Leakage via Cloud | Low | High | Full offline pipeline; no telemetry or analytics enabled. |
| Screenshot/Recording | Medium | Low | Active prevention of screen capture in sensitive zones. |

### 4. GDPR Compliance Matrix
- [x] **Minimization:** Only requested fields are extracted.
- [x] **Integrity:** Local checksums used for document validation.
- [x] **Confidentiality:** Data wiped after explicit export session or session timeout.

---
**Review Date:** 2026-03-05
**DPIA Status:** APPROVED (Local Compliance Standard)
