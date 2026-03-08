import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../utils/haptics';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
}

interface ToastContextValue {
    show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
    show: () => {},
});

export function useToast(): ToastContextValue {
    return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = `toast_${++idRef.current}`;
        setToasts((prev) => [...prev, { id, type, message, duration }].slice(-MAX_VISIBLE));

        switch (type) {
            case 'success':
                hapticSuccess();
                break;
            case 'error':
                hapticError();
                break;
            case 'warning':
                hapticWarning();
                break;
            case 'info':
                hapticLight();
                break;
        }
    }, []);

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <View
                style={styles.container}
                pointerEvents="box-none"
                accessibilityLiveRegion="polite"
            >
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={remove} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
    const { theme } = useTheme();
    const translateY = useRef(new Animated.Value(80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const iconMap: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const colorMap: Record<ToastType, string> = {
        success: theme.success,
        error: theme.error,
        warning: theme.warning,
        info: theme.info,
    };

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();

        // Auto-dismiss
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 80, duration: 200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => onDismiss(toast.id));
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss, translateY, opacity]);

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    backgroundColor: theme.surface,
                    borderColor: colorMap[toast.type],
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
            accessibilityRole="alert"
        >
            <Text style={[styles.icon, { color: colorMap[toast.type] }]}>
                {iconMap[toast.type]}
            </Text>
            <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={2}>
                {toast.message}
            </Text>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 30,
        left: Spacing.md,
        right: Spacing.md,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 4,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    icon: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        marginRight: Spacing.sm,
    },
    message: {
        flex: 1,
        fontSize: Typography.fontSizeSM,
        lineHeight: 20,
    },
});
