import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';

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
    capturedImageUris: string[];
    preprocessedImageUris: string[];
    isBatchMode: boolean;
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

export interface ColumnMapping {
    columnKey: string;
    fieldIds: string[];
}

export interface ExtractionJob {
    jobId: string | null;
    status: 'idle' | 'running' | 'success' | 'error';
    phase: ExtractionPhase;
    progress: number; // 0–100
    errorMessage: string | null;
    extractedData: Record<string, unknown> | null;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'pdf';

export interface AppSettings {
    anonymousCrashReporting: boolean;
    saveToCameraRoll: boolean;
    themeMode: ThemeMode;
    hapticsEnabled: boolean;
    maxConcurrency: number;
    defaultExportFormat: ExportFormat;
    requireBiometricOnExport: boolean;
}

export interface ModelDownloadState {
    isDownloading: boolean;
    isPaused: boolean;
    progress: number;       // 0–100
    bytesWritten: number;
    contentLength: number;
    error: string | null;
}

export interface AppSessionState {
    isOnboardingDone: boolean;
    settings: AppSettings;
    currentRoute: AppRoute;
    capture: CaptureSession;
    extraction: ExtractionJob;
    validation: ValidationJob;
    columnMappings: ColumnMapping[];
    currentExportPath: string | null;
    isLocked: boolean;
    modelDownload: ModelDownloadState;

    // Actions
    setOnboardingDone: (done: boolean) => void;
    setRoute: (route: AppRoute) => void;
    setCapturedImages: (uris: string[]) => void;
    setPreprocessedImages: (uris: string[]) => void;
    setIsBatchMode: (isBatch: boolean) => void;
    startExtractionJob: (jobId: string) => void;
    updateExtractionProgress: (progress: number, phase?: ExtractionPhase) => void;
    completeExtractionJob: (data: Record<string, unknown>) => void;
    failExtractionJob: (message: string) => void;
    initializeValidation: (data: Record<string, unknown>) => void;
    updateField: (id: string, value: string) => void;
    setFieldCategory: (id: string, category: string) => void;
    mergeFields: (sourceId: string, targetId: string) => void;
    /** Split a field value at the given character index into two new fields */
    splitField: (id: string, splitIndex: number) => void;
    /** Assign the same category to multiple fields at once */
    batchUpdateCategory: (ids: string[], category: string) => void;
    setColumnMappings: (mappings: ColumnMapping[]) => void;
    removeColumnMapping: (columnKey: string) => void;
    setExportPath: (path: string | null) => void;
    setLocked: (locked: boolean) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    updateModelDownload: (update: Partial<ModelDownloadState>) => void;
    resetModelDownload: () => void;
    resetSession: () => void;
    lowConfidenceFields: () => ValidationField[];
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialCapture: CaptureSession = {
    sessionId: '',
    capturedImageUris: [],
    preprocessedImageUris: [],
    isBatchMode: false,
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

const initialModelDownload: ModelDownloadState = {
    isDownloading: false,
    isPaused: false,
    progress: 0,
    bytesWritten: 0,
    contentLength: 0,
    error: null,
};

const initialSettings: AppSettings = {
    anonymousCrashReporting: false,
    saveToCameraRoll: false,
    themeMode: 'dark',
    hapticsEnabled: true,
    maxConcurrency: 2,
    defaultExportFormat: 'xlsx',
    requireBiometricOnExport: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppSessionState>()(
    persist(
        (set, get) => ({
            isOnboardingDone: false,
            settings: initialSettings,
            currentRoute: 'Onboarding',
            capture: initialCapture,
            extraction: initialExtraction,
            validation: initialValidation,
            columnMappings: [],
            currentExportPath: null,
            isLocked: true,
            modelDownload: initialModelDownload,

            setOnboardingDone: (done) => set({ isOnboardingDone: done }),

            setRoute: (route) => set({ currentRoute: route }),

            setCapturedImages: (uris) =>
                set((state) => ({
                    capture: {
                        ...state.capture,
                        capturedImageUris: uris,
                        capturedAt: new Date(),
                        sessionId: `session_${Date.now()}`,
                    },
                })),

            setPreprocessedImages: (uris) =>
                set((state) => ({
                    capture: { ...state.capture, preprocessedImageUris: uris },
                })),

            setIsBatchMode: (isBatch) =>
                set((state) => ({
                    capture: { ...state.capture, isBatchMode: isBatch },
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
                                confidence: 0.7 + Math.random() * 0.3,
                                boundingBox: {
                                    x: 50 + Math.random() * 200,
                                    y: 100 + index * 50,
                                    width: 150,
                                    height: 40,
                                },
                                category: label.includes('.') ? label.split('.')[0] : 'General',
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

            splitField: (id, splitIndex) =>
                set((state) => {
                    const field = state.validation.fields.find((f) => f.id === id);
                    if (!field) return state;

                    const safeIndex = Math.max(1, Math.min(splitIndex, field.value.length - 1));
                    const partA = field.value.slice(0, safeIndex).trim();
                    const partB = field.value.slice(safeIndex).trim();
                    if (!partA || !partB) return state;

                    const fieldA: ValidationField = {
                        ...field,
                        id: `${field.id}_a`,
                        value: partA,
                    };
                    const fieldB: ValidationField = {
                        ...field,
                        id: `${field.id}_b`,
                        label: `${field.label} (2)`,
                        value: partB,
                    };

                    return {
                        validation: {
                            ...state.validation,
                            isDirty: true,
                            fields: state.validation.fields.flatMap((f) =>
                                f.id === id ? [fieldA, fieldB] : [f]
                            ),
                        },
                    };
                }),

            batchUpdateCategory: (ids, category) =>
                set((state) => ({
                    validation: {
                        ...state.validation,
                        isDirty: true,
                        fields: state.validation.fields.map((f) =>
                            ids.includes(f.id) ? { ...f, category } : f
                        ),
                    },
                })),

            setColumnMappings: (mappings) => set({ columnMappings: mappings }),

            removeColumnMapping: (columnKey) =>
                set((state) => ({
                    columnMappings: state.columnMappings.filter((m) => m.columnKey !== columnKey),
                })),

            setExportPath: (path) => set({ currentExportPath: path }),

            setLocked: (locked) => set({ isLocked: locked }),

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            updateModelDownload: (update) =>
                set((state) => ({
                    modelDownload: { ...state.modelDownload, ...update },
                })),

            resetModelDownload: () => set({ modelDownload: initialModelDownload }),

            resetSession: () =>
                set({
                    capture: initialCapture,
                    extraction: initialExtraction,
                    validation: initialValidation,
                    columnMappings: [],
                    currentRoute: 'Home',
                }),

            lowConfidenceFields: () => get().validation.fields.filter((f) => f.confidence < 0.7),
        }),
        {
            name: 'exelent-app-store',
            storage: createJSONStorage(() => mmkvStorage),
            version: 1,
            // Only persist safe, small slices — exclude live session data
            partialize: (state) => ({
                isOnboardingDone: state.isOnboardingDone,
                settings: state.settings,
                columnMappings: state.columnMappings,
            }),
            // Migration stub for future schema changes
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // v0 → v1: add new settings with defaults
                    return {
                        ...persistedState,
                        settings: {
                            ...initialSettings,
                            ...(persistedState?.settings ?? {}),
                        },
                    };
                }
                return persistedState as any;
            },
        }
    )
);
