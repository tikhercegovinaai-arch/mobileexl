import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    LayoutChangeEvent,
} from 'react-native';
import { Image } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore, ValidationField } from '../store/useAppStore';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { DraggableFieldCard } from '../components/DraggableFieldCard';
import { FieldManipulationSheet } from '../components/FieldManipulationSheet';

interface ValidationScreenProps {
    onBack: () => void;
    onContinue: () => void;
}

export default function ValidationScreen({ onBack, onContinue }: ValidationScreenProps) {
    const {
        capture,
        validation,
        updateField,
        mergeFields,
        splitField,
        batchUpdateCategory,
    } = useAppStore();

    // Image pixel dimensions
    const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
    // Rendered container size for the overlay
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedField, setSelectedField] = useState<ValidationField | null>(null);

    // UI state
    const [showManipSheet, setShowManipSheet] = useState(false);
    const [showLowConfOnly, setShowLowConfOnly] = useState(false);

    // Resolve image dimensions
    React.useEffect(() => {
        const uri = capture.preprocessedImageUris?.[0];
        if (!uri) return;
        Image.getSize(uri, (w, h) => setImageDims({ w, h }), () => setImageDims({ w: 1000, h: 1400 }));
    }, [capture.preprocessedImageUris]);

    const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
    }, []);

    // Sort by confidence ascending so low-confidence fields appear first
    const sortedFields = useMemo(
        () =>
            [...validation.fields]
                .filter((f) => !showLowConfOnly || f.confidence < 0.7)
                .sort((a, b) => a.confidence - b.confidence),
        [validation.fields, showLowConfOnly],
    );

    const lowConfCount = validation.fields.filter((f) => f.confidence < 0.7).length;

    const handleToggleSelect = useCallback((field: ValidationField) => {
        setSelectedIds((prev) =>
            prev.includes(field.id) ? prev.filter((id) => id !== field.id) : [...prev, field.id]
        );
    }, []);

    const handleLongPress = useCallback((field: ValidationField) => {
        setSelectedField(field);
        setShowManipSheet(true);
    }, []);

    const handleFieldEdit = useCallback(
        (field: ValidationField) => {
            updateField(field.id, field.value);
        },
        [updateField],
    );

    const handleDrop = useCallback((_field: ValidationField, _x: number, _y: number) => {
        // drop logic handled by ColumnMappingScreen — this is a no-op here
    }, []);

    const handleBoundingBoxPress = useCallback(
        (field: ValidationField) => {
            // Scroll to field or highlight inline — for now just show manipulation sheet
            setSelectedField(field);
            setShowManipSheet(true);
        },
        [],
    );

    const allSelected = selectedIds.length === sortedFields.length && sortedFields.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>Cancel</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Validate Data</Text>
                    {lowConfCount > 0 && (
                        <Text style={styles.warningSubtitle}>{lowConfCount} low-confidence field(s)</Text>
                    )}
                </View>
                <TouchableOpacity onPress={onContinue} style={styles.continueBtn}>
                    <Text style={styles.continueBtnText}>Map →</Text>
                </TouchableOpacity>
            </View>

            {/* Image preview with bounding box overlay */}
            <View style={styles.imagePreview} onLayout={handleContainerLayout}>
                {capture.preprocessedImageUris?.[0] ? (
                    <>
                        <Image
                            source={{ uri: capture.preprocessedImageUris[0] }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="contain"
                        />
                        {imageDims && containerSize && (
                            <BoundingBoxOverlay
                                imageWidth={imageDims.w}
                                imageHeight={imageDims.h}
                                containerWidth={containerSize.width}
                                containerHeight={containerSize.height}
                                fields={validation.fields}
                                selectedFieldId={selectedField?.id}
                                onFieldPress={handleBoundingBoxPress}
                            />
                        )}
                    </>
                ) : (
                    <View style={styles.noImageHint}>
                        <Text style={styles.noImageText}>No scanned image available</Text>
                    </View>
                )}
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity
                    style={[styles.filterChip, showLowConfOnly && styles.filterChipActive]}
                    onPress={() => setShowLowConfOnly((v) => !v)}
                >
                    <Text style={[styles.filterChipText, showLowConfOnly && styles.filterChipTextActive]}>
                        🔴 Low Confidence{lowConfCount > 0 ? ` (${lowConfCount})` : ''}
                    </Text>
                </TouchableOpacity>

                {selectedIds.length > 0 && (
                    <TouchableOpacity
                        style={styles.batchBtn}
                        onPress={() => {
                            setSelectedField(null);
                            setShowManipSheet(true);
                        }}
                    >
                        <Text style={styles.batchBtnText}>
                            Batch ({selectedIds.length}) ▲
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.selectAllBtn}
                    onPress={() =>
                        setSelectedIds(allSelected ? [] : sortedFields.map((f) => f.id))
                    }
                >
                    <Text style={styles.selectAllText}>
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Fields list */}
            <View style={styles.fieldsList}>
                <Text style={styles.sectionTitle}>
                    {showLowConfOnly ? 'Low-Confidence Fields' : 'All Extracted Fields'} ({sortedFields.length})
                </Text>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {sortedFields.map((field) => (
                        <DraggableFieldCard
                            key={field.id}
                            field={field}
                            isSelected={selectedIds.includes(field.id)}
                            onEdit={handleFieldEdit}
                            onDrop={handleDrop}
                            onLongPress={handleLongPress}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Manipulation sheet */}
            <FieldManipulationSheet
                visible={showManipSheet}
                targetField={selectedField}
                selectedIds={selectedIds}
                allFields={validation.fields}
                onClose={() => setShowManipSheet(false)}
                onSplit={(id, idx) => splitField(id, idx)}
                onMerge={(src, tgt) => mergeFields(src, tgt)}
                onBatchCategory={(ids, cat) => {
                    batchUpdateCategory(ids, cat);
                    setSelectedIds([]);
                }}
            />
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
    headerBtn: {
        padding: Spacing.xs,
        minWidth: 60,
    },
    headerBtnText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
    },
    warningSubtitle: {
        color: Colors.error,
        fontSize: Typography.fontSizeXS,
        textAlign: 'center',
        marginTop: 2,
    },
    continueBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        minWidth: 60,
        alignItems: 'center',
    },
    continueBtnText: {
        color: 'white',
        fontWeight: Typography.fontWeightSemiBold,
    },
    imagePreview: {
        height: '35%',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        overflow: 'hidden',
    },
    noImageHint: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeSM,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    filterChipActive: {
        backgroundColor: Colors.error + '22',
        borderColor: Colors.error,
    },
    filterChipText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
    },
    filterChipTextActive: {
        color: Colors.error,
        fontWeight: Typography.fontWeightSemiBold,
    },
    batchBtn: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary + '33',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    batchBtnText: {
        color: Colors.primary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightSemiBold,
    },
    selectAllBtn: {
        marginLeft: 'auto',
    },
    selectAllText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
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
    },
});
