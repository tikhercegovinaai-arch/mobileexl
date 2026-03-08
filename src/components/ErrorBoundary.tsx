import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface Props {
    children: ReactNode;
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary.
 * Catches JS errors in the component tree and renders a fallback with a Retry button.
 */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        // Log to analytics (future integration point)
        console.error('[ErrorBoundary]', error, info.componentStack);
        this.props.onError?.(error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <View style={styles.container} accessibilityRole="alert">
                    <Text style={styles.emoji}>⚠️</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message ?? 'An unexpected error occurred.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={this.handleRetry}
                        accessibilityLabel="Retry"
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
});
