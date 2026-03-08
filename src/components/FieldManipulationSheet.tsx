import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    Keyboard,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Colors, Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { ValidationField } from '../store/useAppStore';

type ManipulationMode = 'split' | 'merge' | 'batch';

interface FieldManipulationSheetProps {
    visible: boolean;
    targetField: ValidationField | null;
    selectedIds: string[];
    allFields: ValidationField[];
    onClose: () => void;
    onSplit: (id: string, splitIndex: number) => void;
    onMerge: (sourceId: string, targetId: string) => void;
    onBatchCategory: (ids: string[], category: string) => void;
}

const CATEGORY_PRESETS = ['Name', 'Date', 'Amount', 'Address', 'Reference', 'Misc'];

export const FieldManipulationSheet: React.FC<FieldManipulationSheetProps> = ({
    visible,
    targetField,
    selectedIds,
    allFields,
    onClose,
    onSplit,
    onMerge,
    onBatchCategory,
}) => {
    const [mode, setMode] = useState<ManipulationMode>('split');
    const [splitPosition, setSplitPosition] = useState(0);
    const [mergeTargetId, setMergeTargetId] = useState('');
    const [batchCategory, setBatchCategory] = useState('');

    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            if (targetField) {
                setSplitPosition(Math.floor(targetField.value.length / 2));
            }
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible, targetField]);

    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    const handleSplit = () => {
        if (!targetField) return;
        onSplit(targetField.id, splitPosition);
        onClose();
    };

    const handleMerge = () => {
        if (!targetField || !mergeTargetId) return;
        onMerge(targetField.id, mergeTargetId);
        onClose();
    };

    const handleBatchCategory = () => {
        if (!batchCategory.trim() || selectedIds.length === 0) return;
        onBatchCategory(selectedIds, batchCategory.trim());
        onClose();
    };

    // Preview of what split would produce
    const splitPreviewA = targetField?.value.slice(0, splitPosition) ?? '';
    const splitPreviewB = targetField?.value.slice(splitPosition) ?? '';

    const otherFields = allFields.filter(
        (f) => f.id !== targetField?.id && !selectedIds.includes(f.id),
    );

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={['75%']}
            onChange={handleSheetChanges}
            backdropComponent={(props) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
            )}
            backgroundStyle={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.xl }}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <View style={styles.sheetContent}>
                {/* Title */}
                <Text style={styles.sheetTitle}>Field Operations</Text>

                {/* Mode tabs */}
                <View style={styles.tabs}>
                    {(['split', 'merge', 'batch'] as ManipulationMode[]).map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.tab, mode === m && styles.tabActive]}
                            onPress={() => setMode(m)}
                        >
                            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <BottomSheetScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                    {/* ── SPLIT ── */}
                    {mode === 'split' && targetField && (
                        <View>
                            <Text style={styles.sectionLabel}>Split value at position</Text>
                            <Text style={styles.hint}>
                                Drag the slider or type a position (1 – {targetField.value.length - 1})
                            </Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={String(splitPosition)}
                                onChangeText={(t) => {
                                    const n = parseInt(t, 10);
                                    if (!isNaN(n)) setSplitPosition(n);
                                }}
                            />
                            {/* Preview */}
                            <View style={styles.splitPreview}>
                                <View style={styles.splitPart}>
                                    <Text style={styles.splitPartLabel}>Part A</Text>
                                    <Text style={styles.splitPartValue} numberOfLines={2}>
                                        "{splitPreviewA}"
                                    </Text>
                                </View>
                                <View style={styles.splitDivider} />
                                <View style={styles.splitPart}>
                                    <Text style={styles.splitPartLabel}>Part B</Text>
                                    <Text style={styles.splitPartValue} numberOfLines={2}>
                                        "{splitPreviewB}"
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.actionButton} onPress={handleSplit}>
                                <Text style={styles.actionButtonText}>✂ Split Field</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── MERGE ── */}
                    {mode === 'merge' && targetField && (
                        <View>
                            <Text style={styles.sectionLabel}>Merge "{targetField.label}" into…</Text>
                            {otherFields.length === 0 ? (
                                <Text style={styles.hint}>No other fields available.</Text>
                            ) : (
                                otherFields.map((f) => (
                                    <TouchableOpacity
                                        key={f.id}
                                        style={[
                                            styles.mergeOption,
                                            mergeTargetId === f.id && styles.mergeOptionSelected,
                                        ]}
                                        onPress={() => setMergeTargetId(f.id)}
                                    >
                                        <Text style={styles.mergeOptionLabel}>{f.label}</Text>
                                        <Text style={styles.mergeOptionValue} numberOfLines={1}>
                                            {f.value}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                            <TouchableOpacity
                                style={[styles.actionButton, !mergeTargetId && styles.actionButtonDisabled]}
                                onPress={handleMerge}
                                disabled={!mergeTargetId}
                            >
                                <Text style={styles.actionButtonText}>⊕ Merge Fields</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── BATCH CATEGORY ── */}
                    {mode === 'batch' && (
                        <View>
                            <Text style={styles.sectionLabel}>
                                Assign category to {selectedIds.length} field(s)
                            </Text>
                            <View style={styles.presetGrid}>
                                {CATEGORY_PRESETS.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.presetChip,
                                            batchCategory === cat && styles.presetChipActive,
                                        ]}
                                        onPress={() => setBatchCategory(cat)}
                                    >
                                        <Text
                                            style={[
                                                styles.presetChipText,
                                                batchCategory === cat && styles.presetChipTextActive,
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Or type a custom category…"
                                placeholderTextColor={Colors.textMuted}
                                value={batchCategory}
                                onChangeText={setBatchCategory}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    (!batchCategory.trim() || selectedIds.length === 0) &&
                                    styles.actionButtonDisabled,
                                ]}
                                onPress={handleBatchCategory}
                                disabled={!batchCategory.trim() || selectedIds.length === 0}
                            >
                                <Text style={styles.actionButtonText}>✓ Apply to All Selected</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </BottomSheetScrollView>

                {/* Cancel */}
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    sheetContent: {
        flex: 1,
        paddingBottom: Spacing.xl,
    },
    handleIndicator: {
        width: 40,
        height: 4,
        backgroundColor: Colors.textMuted,
        borderRadius: 2,
    },
    sheetTitle: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: Spacing.md,
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        padding: 3,
        marginBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.xs,
        alignItems: 'center',
        borderRadius: BorderRadius.sm - 2,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    tabTextActive: {
        color: 'white',
        fontWeight: Typography.fontWeightBold,
    },
    body: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    sectionLabel: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
        marginBottom: Spacing.xs,
    },
    hint: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeSM,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSizeMD,
        marginBottom: Spacing.md,
    },
    splitPreview: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    splitPart: {
        flex: 1,
    },
    splitPartLabel: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeXS,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    splitPartValue: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontStyle: 'italic',
    },
    splitDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    mergeOption: {
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    mergeOptionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '22',
    },
    mergeOptionLabel: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
        textTransform: 'uppercase',
    },
    mergeOptionValue: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightMedium,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    presetChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    presetChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    presetChipText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
    },
    presetChipTextActive: {
        color: 'white',
        fontWeight: Typography.fontWeightSemiBold,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    actionButtonDisabled: {
        backgroundColor: Colors.surfaceAlt,
    },
    actionButtonText: {
        color: 'white',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
    cancelButton: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    cancelText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
});
