import * as FileSystem from 'expo-file-system/legacy';

/**
 * Model Download Service
 * Handles fetching quantized GGUF models (e.g., Qwen-0.5B) to the device.
 * Stores them in the application's local documents directory.
 */
export const ModelDownloadService = {
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

        console.log("[ModelDownloadService] Starting download to:", path);

        const downloadResumable = FileSystem.createDownloadResumable(
            this.MODEL_URL,
            path,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                if (onProgress) onProgress(progress * 100);
            }
        );

        try {
            const result = await downloadResumable.downloadAsync();
            if (!result) throw new Error("Download failed");
            return result.uri;
        } catch (e) {
            console.error("[ModelDownloadService] Download failed:", e);
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
