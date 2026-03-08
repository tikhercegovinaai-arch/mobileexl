// Design system tokens — colours, typography, spacing
import { Platform } from 'react-native';

/**
 * Cross-platform shadow utility.
 * On native: returns shadowColor / shadowOffset / shadowOpacity / shadowRadius / elevation.
 * On web:    returns boxShadow (avoids react-native-web's "shadow* is deprecated" warning).
 *
 * @param color  CSS/RN color string
 * @param y      vertical offset in pixels (default 4)
 * @param blur   blur radius in pixels (default 8)
 * @param opacity  0–1 (default 0.25)
 * @param elevation  Android elevation (default 4)
 */
export function shadow(
    color: string,
    y = 4,
    blur = 8,
    opacity = 0.25,
    elevation = 4,
) {
    return Platform.select({
        web: {
            boxShadow: `0px ${y}px ${blur}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        },
        default: {
            shadowColor: color,
            shadowOffset: { width: 0, height: y },
            shadowOpacity: opacity,
            shadowRadius: blur,
            elevation,
        },
    });
}

// ─── Semantic Theme Token Interface ───────────────────────────────────────────

export interface ThemeTokens {
    // Backgrounds
    background: string;
    surface: string;
    surfaceAlt: string;
    card: string;
    headerBackground: string;

    // Brand
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string; // Industrial Orange

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // States
    success: string;
    warning: string;
    error: string;
    info: string;

    // UI
    border: string;
    gridLine: string;
    crosshairColor: string;
    overlay: string;
    cameraBoundary: string;
}

// ─── Dark Theme (Industrial Utilitarian) ─────────────────────────────────────

export const darkTheme: ThemeTokens = {
    background: '#0A0A0A', // Deeper Black
    surface: '#121212',
    surfaceAlt: '#1A1A1A',
    card: '#141414',
    headerBackground: '#000000',

    primary: '#2196F3', // Blueprint Blue
    primaryDark: '#1976D2',
    secondary: '#3F51B5',
    accent: '#FF5722', // Industrial Orange

    textPrimary: '#E0E0E0',
    textSecondary: '#A0A0A0',
    textMuted: '#606060',
    textInverse: '#121212',

    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    border: '#2A2A2A',
    gridLine: 'rgba(255, 255, 255, 0.03)',
    crosshairColor: 'rgba(33, 150, 243, 0.5)',
    overlay: 'rgba(0,0,0,0.8)',
    cameraBoundary: 'rgba(33, 150, 243, 0.7)',
};

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const lightTheme: ThemeTokens = {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#EEEEEE',
    card: '#FFFFFF',
    headerBackground: '#E0E0E0',

    primary: '#1D4ED8',
    primaryDark: '#1E3A8A',
    secondary: '#4338CA',
    accent: '#EA580C',

    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#7A7A7A',
    textInverse: '#F5F5F5',

    success: '#166534',
    warning: '#9A3412',
    error: '#991B1B',
    info: '#1D4ED8',

    border: '#D1D5DB',
    gridLine: 'rgba(0, 0, 0, 0.05)',
    crosshairColor: 'rgba(29, 78, 216, 0.4)',
    overlay: 'rgba(0,0,0,0.3)',
    cameraBoundary: 'rgba(29, 78, 216, 0.7)',
};

// ─── Legacy Colors export (backward-compatible with existing code) ───────────

export const Colors = darkTheme;

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
