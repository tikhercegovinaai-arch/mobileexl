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
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface BatchReviewScreenProps {
    onRetake: () => void;
    onAccept: () => void;
}

const { width } = Dimensions.get('window');
const THUMBNAIL_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

export default function BatchReviewScreen({ onRetake, onAccept }: BatchReviewScreenProps) {
    const { capture, setPreprocessedImages } = useAppStore();
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.title}>Review Batch</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{images.length}</Text>
                    </View>
                </View>
                <Text style={styles.subtitle}>Tap images to review or remove</Text>
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
                                    { scale: animValues.current[index] || 1 },
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

                {/* Placeholder for adding more */}
                <TouchableOpacity
                    style={[styles.thumbnailContainer, styles.addButton]}
                    onPress={onRetake}
                >
                    <Text style={styles.addIcon}>+</Text>
                    <Text style={styles.addText}>Add Map</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
                    <Text style={styles.retakeButtonText}>Discard Batch</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
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
        backgroundColor: Colors.background,
    },
    header: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
        marginRight: Spacing.sm,
    },
    countBadge: {
        backgroundColor: Colors.primary + '33',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    countBadgeText: {
        color: Colors.primary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
    },
    subtitle: {
        fontSize: Typography.fontSizeSM,
        color: Colors.textSecondary,
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
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
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
        backgroundColor: 'rgba(239, 68, 68, 0.9)', // Colors.error with opacity
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
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        width: THUMBNAIL_WIDTH,
    },
    addIcon: {
        fontSize: 40,
        color: Colors.textMuted,
        marginBottom: 8,
    },
    addText: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    retakeButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retakeButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    acceptButton: {
        flex: 2,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    acceptButtonText: {
        color: 'white',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
});

