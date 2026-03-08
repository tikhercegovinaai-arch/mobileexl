import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    LayoutChangeEvent,
    StatusBar,
} from 'react-native';
import { Image } from 'react-native';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore, ValidationField } from '../store/useAppStore';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { DraggableFieldCard } from '../components/DraggableFieldCard';
import { FieldManipulationSheet } from '../components/FieldManipulationSheet';
import SkeletonFieldRow from '../components/SkeletonFieldRow';
import { useToast } from '../components/ToastProvider';
import { hapticMedium, hapticSuccess } from '../utils/haptics';

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
    const { theme, isDark } = useTheme();
    const { show: showToast } = useToast();

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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                    <Text style={[styles.headerBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Validate Data</Text>
                    <View style={styles.healthRow}>
                        <View style={[
                            styles.healthPulse, 
                            { backgroundColor: lowConfCount > 0 ? theme.error : theme.success }
                        ]} />
                        <Text style={[
                            styles.warningSubtitle, 
                            { color: lowConfCount > 0 ? theme.error : theme.success }
                        ]}>
                            {lowConfCount > 0 ? `${lowConfCount} issues found` : 'Document Health: Excellent'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => {
                        hapticMedium();
                        onContinue();
                    }} 
                    style={[styles.continueBtn, { backgroundColor: theme.primary }]}
                >
                    <Text style={styles.continueBtnText}>Map →</Text>
                </TouchableOpacity>
            </View>

            {/* Image preview with bounding box overlay */}
            <View style={[styles.imagePreview, { backgroundColor: theme.surface, borderBottomColor: theme.border }]} onLayout={handleContainerLayout}>
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
                        <Text style={[styles.noImageText, { color: theme.textMuted }]}>No scanned image available</Text>
                    </View>
                )}
            </View>

            {/* Toolbar */}
            <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[
                        styles.filterChip, 
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        showLowConfOnly && { backgroundColor: theme.error + '22', borderColor: theme.error }
                    ]}
                    onPress={() => setShowLowConfOnly((v) => !v)}
                >
                    <Text style={[
                        styles.filterChipText, 
                        { color: theme.textSecondary },
                        showLowConfOnly && { color: theme.error, fontWeight: Typography.fontWeightSemiBold }
                    ]}>
                        🔴 Low Confidence{lowConfCount > 0 ? ` (${lowConfCount})` : ''}
                    </Text>
                </TouchableOpacity>

                {selectedIds.length > 0 && (
                    <TouchableOpacity
                        style={[styles.batchBtn, { backgroundColor: theme.primary + '33', borderColor: theme.primary }]}
                        onPress={() => {
                            setSelectedField(null);
                            setShowManipSheet(true);
                        }}
                    >
                        <Text style={[styles.batchBtnText, { color: theme.primary }]}>
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
                    <Text style={[styles.selectAllText, { color: theme.textSecondary }]}>
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Fields list */}
            <View style={styles.fieldsList}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    {showLowConfOnly ? 'Low-Confidence Fields' : 'All Extracted Fields'} ({sortedFields.length})
                </Text>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {sortedFields.length > 0 ? (
                        sortedFields.map((field) => (
                            <DraggableFieldCard
                                key={field.id}
                                field={field}
                                isSelected={selectedIds.includes(field.id)}
                                onEdit={handleFieldEdit}
                                onDrop={handleDrop}
                                onLongPress={handleLongPress}
                                onToggleSelect={handleToggleSelect}
                            />
                        ))
                    ) : (
                        <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
                            <SkeletonFieldRow />
                            <SkeletonFieldRow />
                            <SkeletonFieldRow />
                            <SkeletonFieldRow />
                        </View>
                    )}
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
                    hapticSuccess();
                    showToast(`Updated category for ${ids.length} field(s)`, 'success');
                }}
            />
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
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    headerBtn: {
        padding: Spacing.xs,
        minWidth: 60,
    },
    headerBtnText: {
        fontSize: Typography.fontSizeMD,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
    },
    warningSubtitle: {
        fontSize: Typography.fontSizeXS,
        textAlign: 'center',
        marginTop: 2,
    },
    continueBtn: {
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
        borderBottomWidth: 1,
        overflow: 'hidden',
    },
    noImageHint: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: Typography.fontSizeSM,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: Typography.fontSizeXS,
    },
    batchBtn: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    batchBtnText: {
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightSemiBold,
    },
    selectAllBtn: {
        marginLeft: 'auto',
    },
    selectAllText: {
        fontSize: Typography.fontSizeXS,
    },
    fieldsList: {
        flex: 1,
        padding: Spacing.md,
    },
    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    healthPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    sectionTitle: {
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
