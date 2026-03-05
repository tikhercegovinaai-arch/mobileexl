export interface UploadedFile {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
    // Raw content for non-image types
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
