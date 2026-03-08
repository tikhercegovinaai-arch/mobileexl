import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { hapticMedium } from '../utils/haptics';

interface TechnicalButtonProps {
    onPress: () => void;
    label: string;
    variant?: 'primary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export const TechnicalButton = ({
    onPress,
    label,
    variant = 'primary',
    style,
    textStyle,
    disabled = false,
}: TechnicalButtonProps) => {
    const { theme } = useTheme();

    const handlePress = () => {
        if (!disabled) {
            hapticMedium();
            onPress();
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
                styles.container,
                {
                    backgroundColor: variant === 'primary' ? theme.primary : 'transparent',
                    borderColor: variant === 'primary' ? theme.primary : theme.border,
                },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            <View style={[styles.corner, styles.tl, { borderColor: variant === 'primary' ? theme.surface : theme.primary }]} />
            <View style={[styles.corner, styles.br, { borderColor: variant === 'primary' ? theme.surface : theme.primary }]} />
            
            <Text
                style={[
                    styles.text,
                    {
                        color: variant === 'primary' ? '#FFFFFF' : theme.textPrimary,
                    },
                    textStyle,
                ]}
            >
                {label.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    text: {
        fontFamily: 'Courier',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
    },
    corner: {
        position: 'absolute',
        width: 8,
        height: 8,
    },
    tl: {
        top: -1,
        left: -1,
        borderTopWidth: 2,
        borderLeftWidth: 2,
    },
    br: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 2,
        borderRightWidth: 2,
    },
});
