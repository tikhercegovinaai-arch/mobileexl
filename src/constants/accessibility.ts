import { Platform } from 'react-native';

/**
 * Accessibility labels and roles for interactive elements.
 *
 * Provides centralized a11y constants so labels stay consistent across the app.
 * Screens should import and spread these onto their interactive components.
 */

// ─── Common action labels ────────────────────────────────────────────────────

export const A11Y = {
    // Home screen
    homeScanButton: {
        accessibilityLabel: 'Scan document with camera',
        accessibilityRole: 'button' as const,
        accessibilityHint: 'Opens the camera scanner to capture a document',
    },
    homeUploadButton: {
        accessibilityLabel: 'Upload document from device',
        accessibilityRole: 'button' as const,
        accessibilityHint: 'Opens file picker to select a document image or PDF',
    },
    homeSettingsButton: {
        accessibilityLabel: 'Open settings',
        accessibilityRole: 'button' as const,
    },

    // Navigation
    backButton: {
        accessibilityLabel: 'Go back',
        accessibilityRole: 'button' as const,
    },
    closeButton: {
        accessibilityLabel: 'Close',
        accessibilityRole: 'button' as const,
    },

    // Extraction / Validation
    fieldRow: (label: string, confidence: number) => ({
        accessibilityLabel: `${label}, ${Math.round(confidence * 100)}% confidence`,
        accessibilityRole: 'adjustable' as const,
    }),
    editField: (label: string) => ({
        accessibilityLabel: `Edit ${label}`,
        accessibilityRole: 'button' as const,
    }),

    // Export
    exportCSV: {
        accessibilityLabel: 'Export as CSV',
        accessibilityRole: 'button' as const,
    },
    exportJSON: {
        accessibilityLabel: 'Export as JSON',
        accessibilityRole: 'button' as const,
    },
    exportExcel: {
        accessibilityLabel: 'Export as Excel spreadsheet',
        accessibilityRole: 'button' as const,
    },
    exportPDF: {
        accessibilityLabel: 'Export as PDF report',
        accessibilityRole: 'button' as const,
    },

    // Settings
    themeToggle: (current: string) => ({
        accessibilityLabel: `Theme: ${current}. Double-tap to cycle.`,
        accessibilityRole: 'switch' as const,
    }),
    hapticToggle: (enabled: boolean) => ({
        accessibilityLabel: `Haptic feedback ${enabled ? 'on' : 'off'}`,
        accessibilityRole: 'switch' as const,
    }),

    // Model download
    downloadProgress: (percent: number) => ({
        accessibilityLabel: `Model download ${percent}% complete`,
        accessibilityRole: 'progressbar' as const,
        accessibilityValue: { min: 0, max: 100, now: percent },
    }),
};

/**
 * Minimum touch-target size (in dp).
 * WCAG 2.1 Success Criterion 2.5.5.
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Helper to ensure a hit-slop that reaches the 44dp minimum.
 */
export function touchHitSlop(elementSize: number): {
    top: number;
    bottom: number;
    left: number;
    right: number;
} {
    const pad = Math.max(0, (MIN_TOUCH_TARGET - elementSize) / 2);
    return { top: pad, bottom: pad, left: pad, right: pad };
}
