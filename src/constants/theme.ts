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
