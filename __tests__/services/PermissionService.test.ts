// Mock expo-camera and expo-media-library before importing the service
const mockCameraStatus = { status: 'undetermined' };
const mockMediaStatus = { status: 'undetermined' };

jest.mock('expo-camera', () => ({
    Camera: {
        getCameraPermissionsAsync: jest.fn(async () => mockCameraStatus),
        requestCameraPermissionsAsync: jest.fn(async () => mockCameraStatus),
    },
}));

jest.mock('expo-media-library', () => ({
    getPermissionsAsync: jest.fn(async () => mockMediaStatus),
    requestPermissionsAsync: jest.fn(async () => mockMediaStatus),
}));

import { PermissionService } from '../../src/services/PermissionService';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

beforeEach(() => {
    jest.clearAllMocks();
    (mockCameraStatus as any).status = 'undetermined';
    (mockMediaStatus as any).status = 'undetermined';
});

describe('PermissionService', () => {
    describe('getStatuses()', () => {
        it('returns undetermined when no permissions requested', async () => {
            const state = await PermissionService.getStatuses();
            expect(state.camera).toBe('undetermined');
            expect(state.mediaLibrary).toBe('undetermined');
        });

        it('maps "granted" status correctly', async () => {
            (mockCameraStatus as any).status = 'granted';
            (mockMediaStatus as any).status = 'granted';
            const state = await PermissionService.getStatuses();
            expect(state.camera).toBe('granted');
            expect(state.mediaLibrary).toBe('granted');
        });

        it('maps "restricted" to "blocked"', async () => {
            (mockCameraStatus as any).status = 'restricted';
            const state = await PermissionService.getStatuses();
            expect(state.camera).toBe('blocked');
        });
    });

    describe('requestCamera()', () => {
        it('returns granted when OS dialog is accepted', async () => {
            (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'granted',
            });
            const status = await PermissionService.requestCamera();
            expect(status).toBe('granted');
        });

        it('returns denied when OS dialog is rejected', async () => {
            (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'denied',
            });
            const status = await PermissionService.requestCamera();
            expect(status).toBe('denied');
        });
    });

    describe('requestAll()', () => {
        it('requests both permissions concurrently', async () => {
            (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'granted',
            });
            (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
                status: 'granted',
            });
            const state = await PermissionService.requestAll();
            expect(state.camera).toBe('granted');
            expect(state.mediaLibrary).toBe('granted');
        });
    });

    describe('allGranted()', () => {
        it('returns true only when both permissions are granted', () => {
            expect(
                PermissionService.allGranted({ camera: 'granted', mediaLibrary: 'granted' }),
            ).toBe(true);
        });

        it('returns false when camera is denied', () => {
            expect(
                PermissionService.allGranted({ camera: 'denied', mediaLibrary: 'granted' }),
            ).toBe(false);
        });

        it('returns false when mediaLibrary is blocked', () => {
            expect(
                PermissionService.allGranted({ camera: 'granted', mediaLibrary: 'blocked' }),
            ).toBe(false);
        });
    });
});
