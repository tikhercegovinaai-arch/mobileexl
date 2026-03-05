/**
 * Native implementation of UploadService.
 * Uses expo-document-picker for all file types.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { UploadedFile, UploadResult, FileCategory, MIME_TYPES } from './UploadService';

export async function pickFiles(
    categories: FileCategory[],
    multiple = false,
): Promise<UploadResult> {
    try {
        // Special case: image-only → use image picker for better UX
        if (categories.length === 1 && categories[0] === 'image') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: multiple,
                quality: 0.9,
            });

            if (result.canceled) return { status: 'cancelled' };

            const files: UploadedFile[] = result.assets.map((a) => ({
                uri: a.uri,
                name: a.fileName ?? `image_${Date.now()}.jpg`,
                mimeType: a.mimeType ?? 'image/jpeg',
                size: a.fileSize,
            }));
            return { status: 'success', files };
        }

        // For all other types (or mixed): use document picker
        const mimeTypes = categories.flatMap((cat) => MIME_TYPES[cat]);

        const result = await DocumentPicker.getDocumentAsync({
            type: mimeTypes,
            multiple,
            copyToCacheDirectory: true,
        });

        if (result.canceled) return { status: 'cancelled' };

        const files: UploadedFile[] = result.assets.map((a) => ({
            uri: a.uri,
            name: a.name,
            mimeType: a.mimeType ?? 'application/octet-stream',
            size: a.size,
        }));
        return { status: 'success', files };
    } catch (e: any) {
        return { status: 'error', error: e?.message ?? 'File picker error' };
    }
}
