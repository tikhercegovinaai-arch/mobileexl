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
    background: '#0F172A', // slate-900
    surface: '#1E293B',    // slate-800
    surfaceAlt: '#334155', // slate-700
    card: '#1E293B',
    headerBackground: '#020617',

    primary: '#3B82F6', // Blue-500 (Vibrant Blue)
    primaryDark: '#2563EB',
    secondary: '#1E40AF', // Blue-800
    accent: '#F59E0B',    // Amber-500 (CTA highlight)

    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#0F172A',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    border: '#334155',
    gridLine: 'rgba(255, 255, 255, 0.05)',
    crosshairColor: 'rgba(59, 130, 246, 0.5)',
    overlay: 'rgba(15, 23, 42, 0.8)',
    cameraBoundary: 'rgba(59, 130, 246, 0.7)',
};

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const lightTheme: ThemeTokens = {
    background: '#F8FAFC', // Slate-50
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9', // Slate-100
    card: '#FFFFFF',
    headerBackground: '#F8FAFC',

    primary: '#1E40AF',    // Blue-800
    primaryDark: '#1E3A8A',// Blue-900
    secondary: '#3B82F6',  // Blue-500
    accent: '#F59E0B',     // Amber-500

    textPrimary: '#0F172A', // Slate-900
    textSecondary: '#334155', // Slate-700
    textMuted: '#64748B',   // Slate-500
    textInverse: '#F8FAFC',

    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',

    border: '#E2E8F0',
    gridLine: 'rgba(0, 0, 0, 0.05)',
    crosshairColor: 'rgba(30, 64, 175, 0.4)',
    overlay: 'rgba(15, 23, 42, 0.3)',
    cameraBoundary: 'rgba(30, 64, 175, 0.7)',
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
