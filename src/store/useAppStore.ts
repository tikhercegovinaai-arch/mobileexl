import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRoute =
    | 'Home'
    | 'Camera'
    | 'Preview'
    | 'Validate'
    | 'ColumnMapping'
    | 'Export'
    | 'Settings'
    | 'Onboarding';

export interface CaptureSession {
    sessionId: string;
    capturedImageUri: string | null;
    preprocessedImageUri: string | null;
    capturedAt: Date | null;
}

export interface ExtractionJob {
    jobId: string | null;
    status: 'idle' | 'running' | 'success' | 'error';
    progress: number; // 0–100
    errorMessage: string | null;
    extractedData: Record<string, unknown> | null;
}

export interface AppSessionState {
    isOnboardingDone: boolean;
    currentRoute: AppRoute;
    capture: CaptureSession;
    extraction: ExtractionJob;

    // Actions
    setOnboardingDone: (done: boolean) => void;
    setRoute: (route: AppRoute) => void;
    setCapturedImage: (uri: string) => void;
    setPreprocessedImage: (uri: string) => void;
    startExtractionJob: (jobId: string) => void;
    updateExtractionProgress: (progress: number) => void;
    completeExtractionJob: (data: Record<string, unknown>) => void;
    failExtractionJob: (message: string) => void;
    resetSession: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialCapture: CaptureSession = {
    sessionId: '',
    capturedImageUri: null,
    preprocessedImageUri: null,
    capturedAt: null,
};

const initialExtraction: ExtractionJob = {
    jobId: null,
    status: 'idle',
    progress: 0,
    errorMessage: null,
    extractedData: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppSessionState>((set) => ({
    isOnboardingDone: false,
    currentRoute: 'Onboarding',
    capture: initialCapture,
    extraction: initialExtraction,

    setOnboardingDone: (done) => set({ isOnboardingDone: done }),

    setRoute: (route) => set({ currentRoute: route }),

    setCapturedImage: (uri) =>
        set((state) => ({
            capture: {
                ...state.capture,
                capturedImageUri: uri,
                capturedAt: new Date(),
                sessionId: `session_${Date.now()}`,
            },
        })),

    setPreprocessedImage: (uri) =>
        set((state) => ({
            capture: { ...state.capture, preprocessedImageUri: uri },
        })),

    startExtractionJob: (jobId) =>
        set({
            extraction: {
                ...initialExtraction,
                jobId,
                status: 'running',
                progress: 0,
            },
        }),

    updateExtractionProgress: (progress) =>
        set((state) => ({
            extraction: { ...state.extraction, progress },
        })),

    completeExtractionJob: (data) =>
        set((state) => ({
            extraction: {
                ...state.extraction,
                status: 'success',
                progress: 100,
                extractedData: data,
            },
        })),

    failExtractionJob: (message) =>
        set((state) => ({
            extraction: {
                ...state.extraction,
                status: 'error',
                errorMessage: message,
            },
        })),

    resetSession: () =>
        set({
            capture: initialCapture,
            extraction: initialExtraction,
            currentRoute: 'Home',
        }),
}));
