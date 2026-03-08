import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeTokens, darkTheme, lightTheme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface ThemeContextValue {
    theme: ThemeTokens;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: darkTheme,
    isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const themeMode = useAppStore((s) => s.settings.themeMode);
    const systemScheme = useColorScheme();

    const { theme, isDark } = useMemo(() => {
        let resolvedDark: boolean;
        if (themeMode === 'system') {
            resolvedDark = systemScheme !== 'light';
        } else {
            resolvedDark = themeMode === 'dark';
        }
        return {
            theme: resolvedDark ? darkTheme : lightTheme,
            isDark: resolvedDark,
        };
    }, [themeMode, systemScheme]);

    return (
        <ThemeContext.Provider value={{ theme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook to consume the current theme tokens.
 * Returns `{ theme, isDark }`.
 */
export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
