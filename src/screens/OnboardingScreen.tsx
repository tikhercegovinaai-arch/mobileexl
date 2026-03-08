import React, { useRef, useState } from 'react';
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
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface OnboardingScreenProps {
    onComplete: () => void;
}

interface Slide {
    id: string;
    icon: string;
    title: string;
    description: string;
}

const slides: Slide[] = [
    {
        id: '1',
        icon: '📸',
        title: 'Scan Documents',
        description: 'Point your camera at handwritten notes, invoices, or forms. Our edge-detection finds the document automatically.',
    },
    {
        id: '2',
        icon: '🤖',
        title: 'AI Extraction',
        description: 'On-device AI reads your handwriting with zero cloud uploads. Your data never leaves your phone.',
    },
    {
        id: '3',
        icon: '✏️',
        title: 'Review & Edit',
        description: 'Verify extracted fields, fix any mistakes, and organize data with drag-and-drop columns.',
    },
    {
        id: '4',
        icon: '📊',
        title: 'Export to Excel',
        description: 'Export clean, structured data to XLSX, CSV, JSON, or PDF — ready for your spreadsheet.',
    },
    {
        id: '5',
        icon: '🔒',
        title: 'Privacy First',
        description: '100% offline processing. PII is automatically redacted. You control everything.',
    },
];

const Dot = ({ active, theme }: { active: boolean; theme: any }) => {
    const width = useSharedValue(8);

    React.useEffect(() => {
        width.value = withSpring(active ? 24 : 8);
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: width.value,
            backgroundColor: active ? theme.primary : theme.surfaceAlt,
        };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
};

const SlideIcon = ({ icon, active }: { icon: string; active: boolean }) => {
    const scale = useSharedValue(0.8);

    React.useEffect(() => {
        if (active) {
            scale.value = withSpring(1.2, { damping: 10, stiffness: 100 }, () => {
                scale.value = withSpring(1);
            });
        } else {
            scale.value = withTiming(0.8);
        }
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.Text style={[styles.slideIcon, animatedStyle]}>
            {icon}
        </Animated.Text>
    );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

    const handleSkip = () => {
        onComplete();
    };

    const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <SlideIcon icon={item.icon} active={index === currentIndex} />
            <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>{item.description}</Text>
        </View>
    );

    const isLastSlide = currentIndex === slides.length - 1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.topBar}>
                {!isLastSlide && (
                    <TouchableOpacity
                        onPress={handleSkip}
                        accessibilityLabel="Skip onboarding"
                        accessibilityRole="button"
                    >
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

            <View style={styles.dotsRow}>
                {slides.map((_, i) => (
                    <Dot key={i} active={i === currentIndex} theme={theme} />
                ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
                onPress={handleNext}
                accessibilityLabel={isLastSlide ? 'Get Started' : 'Next'}
                accessibilityRole="button"
            >
                <Text style={styles.ctaText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: Spacing.md,
    },
    skipText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    flatList: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    slideIcon: {
        fontSize: 72,
        marginBottom: Spacing.xl,
    },
    slideTitle: {
        fontSize: Typography.fontSize3XL,
        fontWeight: Typography.fontWeightBold,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    slideDescription: {
        fontSize: Typography.fontSizeLG,
        textAlign: 'center',
        lineHeight: 26,
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
        borderRadius: BorderRadius.full,
    },
    ctaBtn: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
});
