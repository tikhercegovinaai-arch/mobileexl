import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    Dimensions,
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

    const handleRemoveImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setPreprocessedImages(newImages);

        // If all images are removed, go back to retake
        if (newImages.length === 0) {
            onRetake();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Review Batch</Text>
                <Text style={styles.subtitle}>{images.length} documents captured</Text>
            </View>

            <ScrollView contentContainerStyle={styles.gallery} showsVerticalScrollIndicator={false}>
                {images.map((uri, index) => (
                    <View key={`${uri}_${index}`} style={styles.thumbnailContainer}>
                        <Image source={{ uri }} style={styles.thumbnail} />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{index + 1}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleRemoveImage(index)}
                        >
                            <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
                    <Text style={styles.retakeButtonText}>Discard All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                    <Text style={styles.acceptButtonText}>
                        Extract {images.length} Doc{images.length !== 1 ? 's' : ''}
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
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
        marginBottom: 4,
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
    thumbnailContainer: {
        width: THUMBNAIL_WIDTH,
        aspectRatio: 3 / 4,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: Colors.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.card,
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
        color: Colors.textPrimary,
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
    },
    acceptButtonText: {
        color: Colors.background,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
});
