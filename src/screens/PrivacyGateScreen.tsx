import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { AuthService } from '../services/AuthService';

export default function PrivacyGateScreen() {
    const { setLocked } = useAppStore();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuthenticate = async () => {
        setIsAuthenticating(true);
        setError(null);
        try {
            const success = await AuthService.authenticate();
            if (success) {
                setLocked(false);
            } else {
                setError("Authentication failed. Please try again.");
            }
        } catch (e) {
            setError("Biometrics unavailable or cancelled.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    useEffect(() => {
        // Auto-trigger on mount
        handleAuthenticate();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                    <Text style={styles.icon}>🔒</Text>
                </View>

                <Text style={styles.title}>Secure Access</Text>
                <Text style={styles.subtitle}>
                    This application contains sensitive medical documents. Biometric authentication is required.
                </Text>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {isAuthenticating ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
                ) : (
                    <TouchableOpacity style={styles.authButton} onPress={handleAuthenticate}>
                        <Text style={styles.authButtonText}>Try Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    errorText: {
        color: Colors.error,
        fontSize: Typography.fontSizeSM,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    authButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: 8,
    },
    authButtonText: {
        color: 'white',
        fontWeight: Typography.fontWeightBold,
    },
    loader: {
        marginTop: Spacing.md,
    }
});
