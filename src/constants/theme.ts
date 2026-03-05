// Design system tokens — colours, typography, spacing
export const Colors = {
    // Backgrounds
    background: '#0A0F1E',
    surface: '#111827',
    surfaceAlt: '#1F2937',
    card: '#1A2236',

    // Brand
    primary: '#3B82F6',       // Electric Blue
    primaryDark: '#1D4ED8',
    secondary: '#8B5CF6',     // Violet

    // Text
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    // States
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // UI
    border: '#374151',
    overlay: 'rgba(0,0,0,0.6)',
    cameraBoundary: 'rgba(59,130,246,0.7)',
};

export const Typography = {
    fontSizeXS: 11,
    fontSizeSM: 13,
    fontSizeMD: 15,
    fontSizeLG: 17,
    fontSizeXL: 20,
    fontSize2XL: 24,
    fontSize3XL: 30,

    fontWeightNormal: '400' as const,
    fontWeightMedium: '500' as const,
    fontWeightSemiBold: '600' as const,
    fontWeightBold: '700' as const,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
};
