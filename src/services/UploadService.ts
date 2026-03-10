export * from './UploadService.types';
import { FileCategory, UploadResult } from './UploadService.types';

/**
 * pickFiles is implemented per-platform in UploadService.native.ts / UploadService.web.ts.
 * This stub keeps TypeScript happy; Metro replaces it at bundle time.
 */
export async function pickFiles(
    _categories: FileCategory[],
    _multiple?: boolean,
): Promise<UploadResult> {
    return { status: 'error', error: 'pickFiles: no platform implementation found' };
}
