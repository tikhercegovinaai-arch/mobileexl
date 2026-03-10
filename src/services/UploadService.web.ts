/**
 * Web implementation of UploadService.
 * Uses an invisible <input type="file"> element injected into the DOM.
 */
import { UploadedFile, UploadResult, FileCategory, MIME_TYPES } from './UploadService.types';

function buildAcceptString(categories: FileCategory[]): string {
    return categories
        .flatMap((cat) => MIME_TYPES[cat])
        .concat(
            categories.includes('excel') ? ['.xlsx', '.xls'] : [],
            categories.includes('word') ? ['.doc', '.docx'] : [],
            categories.includes('pdf') ? ['.pdf'] : [],
            categories.includes('image') ? [] : [],
        )
        .join(',');
}

export async function pickFiles(
    categories: FileCategory[],
    multiple = false,
): Promise<UploadResult> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = multiple;
        input.accept = buildAcceptString(categories);

        input.onchange = async () => {
            if (!input.files || input.files.length === 0) {
                resolve({ status: 'cancelled' });
                return;
            }

            try {
                const files: UploadedFile[] = await Promise.all(
                    Array.from(input.files).map(
                        (file) =>
                            new Promise<UploadedFile>((res, rej) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    res({
                                        uri: e.target?.result as string,
                                        name: file.name,
                                        mimeType: file.type || 'application/octet-stream',
                                        size: file.size,
                                        content: e.target?.result as string,
                                    });
                                };
                                reader.onerror = () => rej(reader.error);
                                // For images use DataURL so they can be displayed directly;
                                // for other types use ArrayBuffer for parsing
                                if (file.type.startsWith('image/')) {
                                    reader.readAsDataURL(file);
                                } else {
                                    reader.readAsArrayBuffer(file);
                                }
                            }),
                    ),
                );
                resolve({ status: 'success', files });
            } catch (e: any) {
                resolve({ status: 'error', error: e?.message ?? 'File read failed' });
            }
        };

        input.oncancel = () => resolve({ status: 'cancelled' });
        // Trigger picker
        input.click();
    });
}
