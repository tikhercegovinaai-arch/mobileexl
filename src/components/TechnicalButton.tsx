import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    Animated,
    Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { hapticMedium } from '../utils/haptics';
import { shadow } from '../constants/theme';

interface TechnicalButtonProps {
    onPress: () => void;
    label: string;
    variant?: 'primary' | 'outline' | 'secondary';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    testID?: string;
    icon?: React.ReactNode;
}

export const TechnicalButton = ({
    onPress,
    label,
    variant = 'primary',
    style,
    textStyle,
    disabled = false,
    testID,
    icon,
}: TechnicalButtonProps) => {
    const { theme } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    };

    const handlePress = () => {
        if (!disabled) {
            hapticMedium();
            onPress();
        }
    };

    const getBackgroundColor = () => {
        if (variant === 'primary') return theme.primary;
        if (variant === 'secondary') return theme.secondary;
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'primary' || variant === 'secondary') return '#FFFFFF';
        return theme.primary;
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.primary;
        return 'transparent';
    };

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                activeOpacity={0.9}
                testID={testID}
                style={[
                    styles.container,
                    {
                        backgroundColor: getBackgroundColor(),
                        borderColor: getBorderColor(),
                        borderWidth: variant === 'outline' ? 2 : 0,
                        opacity: disabled ? 0.6 : 1,
                    },
                    variant === 'primary' && !disabled ? shadow(theme.primary, 4, 12, 0.3) : {},
                ]}
            >
                {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
                <Text
                    style={[
                        styles.text,
                        { color: getTextColor() },
                        textStyle,
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 18,
        paddingHorizontal: 28,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    iconContainer: {
        marginRight: 8,
    },
});
