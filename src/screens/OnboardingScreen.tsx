import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, shadow } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
    onComplete: () => void;
}

interface Slide {
    id: string;
    label: string;
    title: string;
    description: string;
}

const slides: Slide[] = [
    {
        id: '1',
        label: 'DOC_SCAN_01',
        title: 'Precision Capture',
        description: 'Industrial-grade edge detection for handwritten logs, invoices, and blueprints. Local processing only.',
    },
    {
        id: '2',
        label: 'AI_EXTRACT_02',
        title: 'Neural Parsing',
        description: 'Advanced on-device neural networks transform ink to data. Zero latency, 100% privacy.',
    },
    {
        id: '3',
        label: 'DATA_VALID_03',
        title: 'Smart Validation',
        description: 'Confidence-scored field review. Verify and refine extracted data with surgical precision.',
    },
    {
        id: '4',
        label: 'SYS_EXPORT_04',
        title: 'System Export',
        description: 'Seamless integration with your ecosystem. Export to XLSX, CSV, or JSON in seconds.',
    },
];

const BackgroundGrid = () => {
    const { theme } = useTheme();
    return (
        <View style={[StyleSheet.absoluteFill, styles.gridContainer]}>
            {[...Array(20)].map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLineV, { left: i * (SCREEN_WIDTH / 10), backgroundColor: theme.gridLine }]} />
            ))}
            {[...Array(40)].map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLineH, { top: i * (SCREEN_HEIGHT / 20), backgroundColor: theme.gridLine }]} />
            ))}
        </View>
    );
};

const Crosshair = () => {
    const { theme } = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(0.8, { duration: 1000 }), withTiming(0.3, { duration: 1000 })),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }), []);

    return (
        <Animated.View style={[styles.crosshairWrapper, animatedStyle]}>
            <View style={[styles.crosshairH, { backgroundColor: theme.primary }]} />
            <View style={[styles.crosshairV, { backgroundColor: theme.primary }]} />
        </Animated.View>
    );
};

const Scanline = ({ active }: { active: boolean }) => {
    const { theme } = useTheme();
    const translateY = useSharedValue(-150);

    useEffect(() => {
        if (active) {
            translateY.value = withRepeat(
                withTiming(150, { duration: 2500, easing: Easing.linear }),
                -1
            );
        } else {
            translateY.value = -150;
        }
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }), []);

    if (!active) return null;

    return (
        <View style={styles.scanlineWindow}>
            <Animated.View style={[styles.scanline, { backgroundColor: theme.primary }, animatedStyle]} />
        </View>
    );
};

const Dot = ({ active, theme }: { active: boolean; theme: any }) => {
    const width = useSharedValue(8);

    useEffect(() => {
        width.value = withSpring(active ? 24 : 8);
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: width.value,
        backgroundColor: active ? theme.primary : theme.border,
    }), [active, theme.primary, theme.border]);

    return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const { theme } = useTheme();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => onComplete();

    const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
        const isActive = index === currentIndex;
        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={styles.visualContainer}>
                    <BackgroundGrid />
                    <Crosshair />
                    <Scanline active={isActive} />
                    <View style={styles.labelWrapper}>
                        <Text style={[styles.monoLabel, { color: theme.primary }]}>{item.label}</Text>
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>{item.title.toUpperCase()}</Text>
                    <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                </View>
            </View>
        );
    };

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerLogo, { color: theme.textPrimary }]}>EXELENT // 2026</Text>
                {!isLastSlide && (
                    <TouchableOpacity onPress={handleSkip} testID="onboarding-skip-button">
                        <Text style={[styles.skipText, { color: theme.textMuted }]}>SKIP_LGC</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                style={styles.flatList}
            />

            <View style={styles.footer}>
                <View style={styles.dotsRow}>
                    {slides.map((_, i) => (
                        <Dot key={i} active={i === currentIndex} theme={theme} />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    testID="onboarding-continue-button"
                >
                    <Text style={[styles.ctaText, { color: theme.textInverse }]}>
                        {isLastSlide ? 'INITIALIZE_SYSTEM' : 'CONTINUE_NAV'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
    },
    headerLogo: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
    },
    skipText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    flatList: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visualContainer: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    gridContainer: {
        opacity: 0.5,
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
    },
    crosshairWrapper: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    crosshairH: {
        width: '100%',
        height: 1,
        position: 'absolute',
    },
    crosshairV: {
        width: 1,
        height: '100%',
        position: 'absolute',
    },
    scanlineWindow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    scanline: {
        height: 2,
        width: '100%',
        ...shadow('#2196F3', 0, 10, 0.8, 5),
    },
    labelWrapper: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    monoLabel: {
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'Courier',
    },
    textContainer: {
        marginTop: Spacing.xxl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
    },
    slideTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    slideDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.8,
    },
    footer: {
        paddingBottom: Spacing.xxl,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dot: {
        height: 4,
        borderRadius: 2,
    },
    ctaBtn: {
        marginHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        borderRadius: 2, // Sharp corners for industrial feel
        alignItems: 'center',
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
