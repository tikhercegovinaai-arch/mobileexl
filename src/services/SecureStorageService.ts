/**
 * TypeScript declaration shim for SecureStorageService.
 * The real implementation is in SecureStorageService.native.ts and SecureStorageService.web.ts;
 * Metro resolves the correct platform file at bundle time.
 * This shim exists purely so TypeScript can find the type declarations.
 */
export { SecureStorageService } from './SecureStorageService.native';
