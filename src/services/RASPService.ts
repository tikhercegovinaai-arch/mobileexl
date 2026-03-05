/**
 * TypeScript declaration shim for RASPService.
 * The real implementation is in RASPService.native.ts and RASPService.web.ts;
 * Metro resolves the correct platform file at bundle time.
 * This shim exists purely so TypeScript can find the type declarations.
 */
export { RASPService } from './RASPService.native';
