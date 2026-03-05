/**
 * TypeScript declaration shim for DocumentScannerService.
 * The real implementation is in DocumentScannerService.native.ts and DocumentScannerService.web.ts;
 * Metro resolves the correct platform file at bundle time.
 * This shim exists purely so TypeScript can find the type declarations.
 */
export { DocumentScannerService, ScannerResult } from './DocumentScannerService.native';
