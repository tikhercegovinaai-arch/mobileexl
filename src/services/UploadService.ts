export interface UploadedFile {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
    // Raw content for non-image types (ArrayBuffer on native, DataURL/ArrayBuffer on web)
    content?: string | ArrayBuffer;
}

export type FileCategory = 'image' | 'pdf' | 'excel' | 'word';

export interface UploadResult {
    status: 'success' | 'cancelled' | 'error';
    files?: UploadedFile[];
    error?: string;
}

export const MIME_TYPES: Record<FileCategory, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/gif'],
    pdf: ['application/pdf'],
    excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ],
    word: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
    ],
};

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

