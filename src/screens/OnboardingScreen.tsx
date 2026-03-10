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
        label: 'Step 01',
        title: 'Precision Capture',
        description: 'Effortlessly capture handwritten logs, invoices, and blueprints. Processed locally on your device.',
    },
    {
        id: '2',
        label: 'Step 02',
        title: 'Neural Parsing',
        description: 'Advanced on-device AI transforms your handwritten notes into structured data instantly. Complete privacy.',
    },
    {
        id: '3',
        label: 'Step 03',
        title: 'Smart Validation',
        description: 'Review and refine extracted data with confidence scores. Ensure 100% accuracy.',
    },
    {
        id: '4',
        label: 'Step 04',
        title: 'System Export',
        description: 'Seamlessly export to Excel, CSV, or JSON and integrate with your existing workflow.',
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
                    <View style={[styles.labelWrapper, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.monoLabel, { color: theme.primary }]}>{item.label}</Text>
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                </View>
            </View>
        );
    };

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerLogo, { color: theme.textPrimary }]}>Exelent</Text>
                {!isLastSlide && (
                    <TouchableOpacity onPress={handleSkip} testID="onboarding-skip-button">
                        <Text style={[styles.skipText, { color: theme.textMuted }]}>Skip</Text>
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
                        {isLastSlide ? 'Get Started' : 'Continue'}
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
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
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
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    gridContainer: {
        opacity: 0.3,
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
        height: 2,
        position: 'absolute',
        borderRadius: 1,
    },
    crosshairV: {
        width: 2,
        height: '100%',
        position: 'absolute',
        borderRadius: 1,
    },
    scanlineWindow: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    scanline: {
        height: 3,
        width: '100%',
        ...shadow('#3B82F6', 0, 10, 0.8, 5),
    },
    labelWrapper: {
        position: 'absolute',
        top: 24,
        left: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    monoLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    textContainer: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
    },
    slideTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    slideDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
        fontWeight: '500',
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
        height: 8,
        borderRadius: 4,
    },
    ctaBtn: {
        marginHorizontal: Spacing.xl,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...shadow('#3B82F6', 4, 12, 0.3),
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
