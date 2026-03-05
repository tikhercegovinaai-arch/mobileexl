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

export type ExtractionPhase = 'idle' | 'recognizing' | 'redacting' | 'structuring' | 'completed' | 'failed';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ValidationField {
    id: string;
    label: string;
    value: string;
    confidence: number;
    boundingBox?: BoundingBox;
    category?: string;
}

export interface ValidationJob {
    fields: ValidationField[];
    isDirty: boolean;
}

export interface ExtractionJob {
    jobId: string | null;
    status: 'idle' | 'running' | 'success' | 'error';
    phase: ExtractionPhase;
    progress: number; // 0–100
    errorMessage: string | null;
    extractedData: Record<string, unknown> | null;
}

export interface AppSessionState {
    isOnboardingDone: boolean;
    currentRoute: AppRoute;
    capture: CaptureSession;
    extraction: ExtractionJob;
    validation: ValidationJob;
    currentExportPath: string | null;
    isLocked: boolean;

    // Actions
    setOnboardingDone: (done: boolean) => void;
    setRoute: (route: AppRoute) => void;
    setCapturedImage: (uri: string) => void;
    setPreprocessedImage: (uri: string) => void;
    startExtractionJob: (jobId: string) => void;
    updateExtractionProgress: (progress: number, phase?: ExtractionPhase) => void;
    completeExtractionJob: (data: Record<string, unknown>) => void;
    failExtractionJob: (message: string) => void;
    initializeValidation: (data: Record<string, unknown>) => void;
    updateField: (id: string, value: string) => void;
    setFieldCategory: (id: string, category: string) => void;
    mergeFields: (sourceId: string, targetId: string) => void;
    setExportPath: (path: string | null) => void;
    setLocked: (locked: boolean) => void;
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
    phase: 'idle',
    progress: 0,
    errorMessage: null,
    extractedData: null,
};

const initialValidation: ValidationJob = {
    fields: [],
    isDirty: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppSessionState>((set) => ({
    isOnboardingDone: false,
    currentRoute: 'Onboarding',
    capture: initialCapture,
    extraction: initialExtraction,
    validation: initialValidation,
    currentExportPath: null,
    isLocked: true,

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
                phase: 'recognizing',
                progress: 0,
            },
        }),

    updateExtractionProgress: (progress, phase) =>
        set((state) => ({
            extraction: {
                ...state.extraction,
                progress,
                ...(phase ? { phase } : {}),
            },
        })),

    completeExtractionJob: (data) =>
        set((state) => ({
            extraction: {
                ...state.extraction,
                status: 'success',
                phase: 'completed',
                progress: 100,
                extractedData: data,
            },
        })),

    failExtractionJob: (message: string) =>
        set((state) => ({
            extraction: {
                ...state.extraction,
                status: 'error',
                errorMessage: message,
            },
        })),

    initializeValidation: (data) => {
        // Transform structured data into validation fields
        // Mocking bounding boxes and confidence for demonstration
        const fields: ValidationField[] = [];
        let index = 0;

        const processObject = (obj: any, prefix = '') => {
            for (const key in obj) {
                const value = obj[key];
                const label = prefix ? `${prefix}.${key}` : key;

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    processObject(value, label);
                } else if (value !== null) {
                    fields.push({
                        id: `field_${index++}`,
                        label,
                        value: String(value),
                        confidence: 0.7 + Math.random() * 0.3, // Mock confidence
                        boundingBox: {
                            x: 50 + Math.random() * 200,
                            y: 100 + index * 50,
                            width: 150,
                            height: 40
                        },
                        category: label.includes('.') ? label.split('.')[0] : 'General'
                    });
                }
            }
        };

        processObject(data);
        set({ validation: { fields, isDirty: false } });
    },

    updateField: (id, value) =>
        set((state) => ({
            validation: {
                ...state.validation,
                isDirty: true,
                fields: state.validation.fields.map((f) =>
                    f.id === id ? { ...f, value } : f
                ),
            },
        })),

    setFieldCategory: (id, category) =>
        set((state) => ({
            validation: {
                ...state.validation,
                isDirty: true,
                fields: state.validation.fields.map((f) =>
                    f.id === id ? { ...f, category } : f
                ),
            },
        })),

    mergeFields: (sourceId, targetId) =>
        set((state) => {
            const source = state.validation.fields.find((f) => f.id === sourceId);
            const target = state.validation.fields.find((f) => f.id === targetId);
            if (!source || !target) return state;

            return {
                validation: {
                    ...state.validation,
                    isDirty: true,
                    fields: state.validation.fields
                        .filter((f) => f.id !== sourceId)
                        .map((f) =>
                            f.id === targetId
                                ? { ...f, value: `${f.value} ${source.value}` }
                                : f
                        ),
                },
            };
        }),

    setExportPath: (path) => set({ currentExportPath: path }),

    setLocked: (locked) => set({ isLocked: locked }),

    resetSession: () =>
        set({
            capture: initialCapture,
            extraction: initialExtraction,
            validation: initialValidation,
            currentRoute: 'Home',
        }),
}));
