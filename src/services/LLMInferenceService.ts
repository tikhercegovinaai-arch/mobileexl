/**
 * TypeScript declaration shim for LLMInferenceService.
 * The real implementation is in LLMInferenceService.native.ts and LLMInferenceService.web.ts;
 * Metro resolves the correct platform file at bundle time.
 * This shim exists purely so TypeScript can find the type declarations.
 */
export { LLMInferenceService } from './LLMInferenceService.native';
