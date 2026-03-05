# Data Protection Impact Assessment (DPIA)
## AI Handwriting Extraction & Excel Integration
**Version:** 1.0
**Date:** 2026-03-05

### 1. Executive Summary
This Data Protection Impact Assessment (DPIA) evaluates the privacy risks associated with the Exelent application. The application's core objective is to locally process medical and personal handwritten documents into structured private Excel files mapping to predefined schemas. All processing is conducted exclusively on the mobile device to ensure data minimization, confidentiality, and integrity, following the principles of privacy by design.

### 2. Data Processing Operations
- **Input:** Raw camera photos of handwritten documents containing sensitive information.
- **Data Categories Processed:** Personal Identifiable Information (PII) including patient names, Dates of Birth, contact details (Email, Phone), Medical diagnoses, prescription histories, and identification numbers (e.g., SSN).
- **Processing Flow:** 
  1. Image Capture and Preprocessing (Binarization/Edge Detection).
  2. On-Device OCR to extract raw text logic.
  3. Local Regex-based PII Redaction mapping specific data vectors (SSN, Phone, Email) to placeholder tokens.
  4. Local AI Inference leveraging `react-native-llama` to structure the redacted data explicitly governed by Zod schemas.
  5. JSON string interpolation and formatting directly into native `.xlsx` files.
- **Storage:** Data resides strictly within the application's encrypted sandbox (`expo-secure-store`). Zero data is committed to the cloud or remote databases.

### 3. Necessity and Proportionality 
The application accesses only the minimum amount of data required to structure a specified Excel sheet. Data retention is limited to the active user session or explicit user invocation via the "Save to Files" OS intent. We do not aggregate telemetry or behavioral usage data to guarantee complete isolation.

### 4. Risk Assessment & Mitigation

| Risk Vector | Likelihood | Severity | Implemented Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Unauthorized Physical Access to App** | Medium | High | Biometric gating (`expo-local-authentication`) enforces FaceID/TouchID checks before the app can be accessed after backgrounding. |
| **Data Leakage via Cloud or Interception** | Low | High | Full offline pipeline architecture. Network requests for API are not used for extraction logic. Certificate Pinning implemented for any potential future outbound calls. |
| **Malicious Device Modification (Root/Jailbreak)** | Low | High | Active Runtime Application Self-Protection (RASP) module checks file systems at startup for Cydia/SuperUser binaries and denies execution on compromised environments. |
| **Inadequate Data Erasure** | Low | Medium | Secure storage mechanisms automatically clear transient memory buffers following successful extraction and Excel sharing generation. |
| **Application Memory Dump** | Medium | High | On-Device LLM (llama.cpp implementation) processes using `mlock` to keep memory in RAM where possible, avoiding unwanted pagefile writing. |

### 5. GDPR Compliance Matrix Summary
- [x] **Art. 5(1)(c) Data Minimization:** Guaranteed by the on-device regex-based PII redaction and explicit schema constraints.
- [x] **Art. 5(1)(f) Integrity and Confidentiality:** Encrypted local storage and biometrics implementations ensure the data cannot be accessed by unauthorized entities.
- [x] **Art. 25 Data Protection by Design and by Default:** Offline-by-default methodology with no external telemetry connections enforces comprehensive isolation.
- [x] **Art. 32 Security of Processing:** Certificate pinning, RASP, and OS-sharing dialogue limitations.

### 6. Assessment Outcome
Based on the mitigation measures applied across the software architecture, the residual risks to individuals' rights and freedoms have been reduced to an acceptable minimum. The implementation conforms to strict privacy-first engineering standards, eliminating external dependencies.

**DPIA Status:** APPROVED 
**Approved By:** Privacy & Engineering Leads
