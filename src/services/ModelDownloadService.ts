import * as FileSystem from 'expo-file-system/legacy';
import { pinnedFetch } from './CertificatePinningService';
import { useAppStore } from '../store/useAppStore';


/**
 * Model Download Service
 * Handles fetching quantized GGUF models (e.g., Qwen-0.5B) to the device.
 * Stores them in the application's local documents directory.
 */
export const ModelDownloadService = {
    // Note: In real production, this domain would be added to PINS in CertificatePinningService
    MODEL_URL: "https://huggingface.co/Qwen/Qwen2-0.5B-Instruct-GGUF/resolve/main/qwen2-0_5b-instruct-q4_k_m.gguf",
    MODEL_FILENAME: "qwen2-0.5b-q4.gguf",

    async getModelPath(): Promise<string> {
        return `${FileSystem.documentDirectory}${this.MODEL_FILENAME}`;
    },

    async isModelDownloaded(): Promise<boolean> {
        const path = await this.getModelPath();
        const info = await FileSystem.getInfoAsync(path);
        return info.exists;
    },

    async downloadModel(onProgress?: (progress: number) => void): Promise<string> {
        const path = await this.getModelPath();
        const { modelDownload, updateModelDownload } = useAppStore.getState();

        console.log("[ModelDownloadService] Validating certificate pinning before download...");
        // 1. Certificate Pinning Validation
        await pinnedFetch(this.MODEL_URL, { method: 'HEAD' });

        // 2. Setup Resumable Download
        const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
            const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
            
            // Save current state to store for persistence
            updateModelDownload({
                progress,
                bytesWritten: downloadProgress.totalBytesWritten,
                contentLength: downloadProgress.totalBytesExpectedToWrite,
            });

            if (onProgress) onProgress(progress);
        };

        let downloadResumable: FileSystem.DownloadResumable;

        if (modelDownload.resumeData) {
            console.log("[ModelDownloadService] Re-instantiating from resumeData...");
            downloadResumable = FileSystem.createDownloadResumable(
                this.MODEL_URL,
                path,
                JSON.parse(modelDownload.resumeData).options || {},
                callback,
                modelDownload.resumeData
            );
        } else {
            console.log("[ModelDownloadService] Starting fresh download to:", path);
            downloadResumable = FileSystem.createDownloadResumable(
                this.MODEL_URL,
                path,
                {},
                callback
            );
        }

        try {
            updateModelDownload({ isDownloading: true, error: null });
            
            // Start or Resume
            const result = await downloadResumable.downloadAsync();

            if (result && result.uri) {
                updateModelDownload({ isDownloading: false, progress: 100, resumeData: null });
                return result.uri;
            }
            
            throw new Error("Download aborted without result");
        } catch (e) {
            // Save resumeData if possible
            if (downloadResumable.savable()) {
                const snapshot = await downloadResumable.savable();
                updateModelDownload({ resumeData: JSON.stringify(snapshot) });
            }
            
            console.error("[ModelDownloadService] Download failed:", e);
            updateModelDownload({ isDownloading: false, error: e instanceof Error ? e.message : "Download failed" });
            throw e;
        }
    },


    async deleteModel(): Promise<void> {
        const path = await this.getModelPath();
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
            await FileSystem.deleteAsync(path);
        }
    }
};
