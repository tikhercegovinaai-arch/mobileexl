export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined';

export interface PermissionState {
    camera: PermissionStatus;
    mediaLibrary: PermissionStatus;
}

export const PermissionService = {
    async getStatuses(): Promise<PermissionState> {
        return {
            camera: 'granted',
            mediaLibrary: 'granted',
        };
    },

    async requestCamera(): Promise<PermissionStatus> {
        return 'granted';
    },

    async requestMediaLibrary(): Promise<PermissionStatus> {
        return 'granted';
    },

    async requestAll(): Promise<PermissionState> {
        return {
            camera: 'granted',
            mediaLibrary: 'granted',
        };
    },

    allGranted(state: PermissionState): boolean {
        return state.camera === 'granted' && state.mediaLibrary === 'granted';
    },
};
