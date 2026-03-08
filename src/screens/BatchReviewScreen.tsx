import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    Dimensions,
    Animated,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Typography, Spacing, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import SkeletonBox from '../components/SkeletonBox';

interface BatchReviewScreenProps {
    onRetake: () => void;
    onAccept: () => void;
}

const { width } = Dimensions.get('window');
const THUMBNAIL_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

export default function BatchReviewScreen({ onRetake, onAccept }: BatchReviewScreenProps) {
    const { capture, setPreprocessedImages } = useAppStore();
    const { theme, isDark } = useTheme();
    const images = capture.preprocessedImageUris || [];

    // Animation values for each thumbnail
    const animValues = useRef<Animated.Value[]>([]);

    useEffect(() => {
        // Initialize animation values
        animValues.current = images.map(() => new Animated.Value(0));

        // Staggered animation
        const animations = animValues.current.map((anim, i) =>
            Animated.spring(anim, {
                toValue: 1,
                tension: 40,
                friction: 7,
                delay: i * 80,
                useNativeDriver: true,
            })
        );

        Animated.parallel(animations).start();
    }, [images.length]);

    const handleRemoveImage = (index: number) => {
        // Fade out before removal
        Animated.timing(animValues.current[index], {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            const newImages = [...images];
            newImages.splice(index, 1);
            setPreprocessedImages(newImages);

            if (newImages.length === 0) {
                onRetake();
            }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <View style={styles.headerTitleRow}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Review Batch</Text>
                    <View style={[styles.countBadge, { backgroundColor: theme.primary + '33', borderColor: theme.primary }]}>
                        <Text style={[styles.countBadgeText, { color: theme.primary }]}>{images.length}</Text>
                    </View>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Tap images to review or remove</Text>
            </View>

            <ScrollView contentContainerStyle={styles.gallery} showsVerticalScrollIndicator={false}>
                {images.map((uri, index) => (
                    <Animated.View
                        key={`${uri}_${index}`}
                        style={[
                            styles.thumbnailWrapper,
                            {
                                opacity: animValues.current[index] || 1,
                                transform: [
                                    {
                                        translateY: (animValues.current[index] || 1).interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0]
                                        })
                                    }
                                ]
                            }
                        ]}
                    >
                        <View style={styles.thumbnailContainer}>
                            <Image source={{ uri }} style={styles.thumbnail} />
                            <View style={styles.orderBadge}>
                                <Text style={styles.orderBadgeText}>{index + 1}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleRemoveImage(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.deleteButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ))}

                {images.length === 0 && (
                    <>
                        <View style={styles.thumbnailWrapper}>
                            <View style={styles.thumbnailContainer}>
                                <SkeletonBox width="100%" height={250} style={styles.thumbnail} />
                            </View>
                        </View>
                        <View style={styles.thumbnailWrapper}>
                            <View style={styles.thumbnailContainer}>
                                <SkeletonBox width="100%" height={250} style={styles.thumbnail} />
                            </View>
                        </View>
                    </>
                )}

                {/* Placeholder for adding more */}
                <TouchableOpacity
                    style={[styles.thumbnailContainer, styles.addButton, { backgroundColor: 'transparent', borderColor: theme.border }]}
                    onPress={onRetake}
                >
                    <Text style={[styles.addIcon, { color: theme.textMuted }]}>+</Text>
                    <Text style={[styles.addText, { color: theme.textMuted }]}>Add Map</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TouchableOpacity style={[styles.retakeButton, { backgroundColor: theme.surfaceAlt }]} onPress={onRetake}>
                    <Text style={[styles.retakeButtonText, { color: theme.textSecondary }]}>Discard Batch</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.acceptButton, { backgroundColor: theme.primary }, shadow(theme.primary, 4, 8, 0.3, 6)]} onPress={onAccept}>
                    <Text style={styles.acceptButtonText}>
                        Analyze {images.length} Document{images.length !== 1 ? 's' : ''}
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
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        marginRight: Spacing.sm,
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    countBadgeText: {
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
    },
    subtitle: {
        fontSize: Typography.fontSizeSM,
    },
    gallery: {
        padding: Spacing.lg,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    thumbnailWrapper: {
        width: THUMBNAIL_WIDTH,
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    orderBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#4ade80', // Keep a distinct badge color or use theme.primary? Let's use #4ade80 for green success
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderBadgeText: {
        color: 'white',
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -2,
    },
    addButton: {
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        width: THUMBNAIL_WIDTH,
    },
    addIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    addText: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
    },
    retakeButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retakeButtonText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    acceptButton: {
        flex: 2,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButtonText: {
        color: 'white',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
});

