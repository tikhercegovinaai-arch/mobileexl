import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';

export interface PermissionState {
    camera: PermissionStatus;
    mediaLibrary: PermissionStatus;
}

// ─── PermissionService ────────────────────────────────────────────────────────

export const PermissionService = {
    /**
     * Check the current status of Camera and MediaLibrary permissions
     * without triggering a system dialog.
     */
    async getStatuses(): Promise<PermissionState> {
        const [cameraStatus, mediaStatus] = await Promise.all([
            Camera.getCameraPermissionsAsync(),
            MediaLibrary.getPermissionsAsync(),
        ]);

        return {
            camera: mapStatus(cameraStatus.status),
            mediaLibrary: mapStatus(mediaStatus.status),
        };
    },

    /**
     * Request Camera permission. Triggers the OS system dialog on first call.
     * Returns the resulting status.
     */
    async requestCamera(): Promise<PermissionStatus> {
        const { status } = await Camera.requestCameraPermissionsAsync();
        return mapStatus(status);
    },

    /**
     * Request MediaLibrary (photo saving) permission.
     */
    async requestMediaLibrary(): Promise<PermissionStatus> {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return mapStatus(status);
    },

    /**
     * Request all permissions required for Phase 1 in one call.
     * Returns the final combined state.
     */
    async requestAll(): Promise<PermissionState> {
        const [cameraRes, mediaRes] = await Promise.all([
            Camera.requestCameraPermissionsAsync(),
            MediaLibrary.requestPermissionsAsync(),
        ]);

        return {
            camera: mapStatus(cameraRes.status),
            mediaLibrary: mapStatus(mediaRes.status),
        };
    },

    /**
     * Returns true only if every required permission is granted.
     */
    allGranted(state: PermissionState): boolean {
        return state.camera === 'granted' && state.mediaLibrary === 'granted';
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStatus(status: string): PermissionStatus {
    switch (status) {
        case 'granted':
            return 'granted';
        case 'denied':
            return 'denied';
        case 'restricted':
        case 'blocked':
            return 'blocked';
        default:
            return 'undetermined';
    }
}
