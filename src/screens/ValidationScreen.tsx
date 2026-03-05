import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore, ValidationField } from '../store/useAppStore';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { DraggableFieldCard } from '../components/DraggableFieldCard';

interface ValidationScreenProps {
    onBack: () => void;
    onContinue: () => void;
}

export default function ValidationScreen({ onBack, onContinue }: ValidationScreenProps) {
    const { capture, validation, updateField, setFieldCategory } = useAppStore();
    const [selectedField, setSelectedField] = useState<ValidationField | null>(null);

    const handleFieldEdit = (field: ValidationField) => {
        Alert.prompt(
            "Edit Field",
            `Updating ${field.label}`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: (val) => val && updateField(field.id, val)
                }
            ],
            "plain-text",
            field.value
        );
    };

    const handleDrop = (field: ValidationField, x: number, y: number) => {
        // Simple logic for category mapping based on drop position
        // In a real app, we'd check against drop zone coordinates
        console.log(`Dropped ${field.label} at ${x}, ${y}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Validate Data</Text>
                <TouchableOpacity onPress={onContinue} style={styles.continueButton}>
                    <Text style={styles.continueText}>Finalize</Text>
                </TouchableOpacity>
            </View>

            {/* Split View */}
            <View style={styles.content}>
                {/* Top: Image Preview with Overlay */}
                <View style={styles.imagePreview}>
                    {capture.preprocessedImageUri && (
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{ uri: capture.preprocessedImageUri }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                            {/* Overlay is fixed to image dimensions relative to screen */}
                            <BoundingBoxOverlay
                                imageWidth={1000} // Mock original dimensions
                                imageHeight={1400}
                                fields={validation.fields}
                                onFieldPress={handleFieldEdit}
                            />
                        </View>
                    )}
                </View>

                {/* Bottom: Extracted Fields List */}
                <View style={styles.fieldsList}>
                    <Text style={styles.sectionTitle}>Review Extracted Fields</Text>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {validation.fields.map(field => (
                            <DraggableFieldCard
                                key={field.id}
                                field={field}
                                onEdit={handleFieldEdit}
                                onDrop={handleDrop}
                            />
                        ))}
                    </ScrollView>
                </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: Spacing.xs,
    },
    backText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
    continueButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    continueText: {
        color: 'white',
        fontWeight: Typography.fontWeightSemiBold,
    },
    content: {
        flex: 1,
    },
    imagePreview: {
        height: '40%',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        padding: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    fieldsList: {
        flex: 1,
        padding: Spacing.md,
    },
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
        letterSpacing: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    }
});
