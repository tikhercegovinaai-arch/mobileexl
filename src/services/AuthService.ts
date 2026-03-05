/**
 * TypeScript declaration shim for AuthService.
 * The real implementation is in AuthService.native.ts and AuthService.web.ts;
 * Metro resolves the correct platform file at bundle time.
 * This shim exists purely so TypeScript can find the type declarations.
 */
export { AuthService } from './AuthService.native';
