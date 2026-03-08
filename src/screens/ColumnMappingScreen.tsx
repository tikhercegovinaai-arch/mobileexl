import React, { useCallback, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    LayoutRectangle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { useAppStore, ValidationField } from '../store/useAppStore';
import { DropZoneColumn } from '../components/DropZoneColumn';
import { useToast } from '../components/ToastProvider';

/** Predefined structural columns that users can map fields into. */
const COLUMN_DEFINITIONS: { key: string; label: string }[] = [
    { key: 'Name', label: 'Name' },
    { key: 'Date', label: 'Date' },
    { key: 'Amount', label: 'Amount' },
    { key: 'Address', label: 'Address' },
    { key: 'Reference', label: 'Reference' },
    { key: 'Misc', label: 'Misc' },
];

interface ColumnMappingScreenProps {
    onBack: () => void;
    onContinue: () => void;
}

// ─── Draggable source card (unassigned field) ────────────────────────────────

interface DraggableSourceCardProps {
    field: ValidationField;
    onDropped: (field: ValidationField, absX: number, absY: number) => void;
}

function DraggableSourceCard({ field, onDropped }: DraggableSourceCardProps) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const dragging = useSharedValue(false);

    const gesture = Gesture.Pan()
        .onStart(() => { dragging.value = true; })
        .onUpdate((e) => {
            tx.value = e.translationX;
            ty.value = e.translationY;
        })
        .onEnd((e) => {
            dragging.value = false;
            runOnJS(onDropped)(field, e.absoluteX, e.absoluteY);
            tx.value = withSpring(0);
            ty.value = withSpring(0);
        });

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: dragging.value ? 1.06 : 1 },
        ],
        zIndex: dragging.value ? 999 : 1,
        shadowOpacity: dragging.value ? 0.4 : 0,
        shadowRadius: dragging.value ? 12 : 0,
        elevation: dragging.value ? 8 : 0,
    }));

    const confidenceColor =
        field.confidence >= 0.9 ? Colors.success
            : field.confidence >= 0.7 ? Colors.warning
                : Colors.error;

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.sourceCard, animStyle]}>
                <View style={[styles.sourceCardBar, { backgroundColor: confidenceColor }]} />
                <View style={styles.sourceCardBody}>
                    <Text style={styles.sourceCardLabel} numberOfLines={1}>
                        {field.label}
                    </Text>
                    <Text style={styles.sourceCardValue} numberOfLines={1}>
                        {field.value}
                    </Text>
                </View>
                <View style={styles.confidencePill}>
                    <Text style={[styles.confidencePillText, { color: confidenceColor }]}>
                        {Math.round(field.confidence * 100)}%
                    </Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ColumnMappingScreen({ onBack, onContinue }: ColumnMappingScreenProps) {
    const { validation, setFieldCategory } = useAppStore();
    const { show: showToast } = useToast();

    // Track layout of each drop zone for hit-testing
    const zoneRects = useRef<Map<string, LayoutRectangle>>(new Map());
    // Track which zones are currently highlighted (hover)
    const [highlightedZone, setHighlightedZone] = useState<string | null>(null);

    // Fields not yet assigned to a column
    const unassignedFields = validation.fields.filter(
        (f) => !COLUMN_DEFINITIONS.some((col) => col.key === f.category),
    );

    // Fields grouped by column key
    const fieldsByColumn = useCallback(
        (colKey: string) => validation.fields.filter((f) => f.category === colKey),
        [validation.fields],
    );

    const handleZoneLayout = useCallback(
        (key: string, rect: LayoutRectangle) => {
            zoneRects.current.set(key, rect);
        },
        [],
    );

    const handleFieldDropped = useCallback(
        (field: ValidationField, absX: number, absY: number) => {
            // Find which drop zone the card was dropped into
            let matched: string | null = null;
            zoneRects.current.forEach((rect, key) => {
                if (
                    absX >= rect.x &&
                    absX <= rect.x + rect.width &&
                    absY >= rect.y &&
                    absY <= rect.y + rect.height
                ) {
                    matched = key;
                }
            });

            if (matched) {
                setFieldCategory(field.id, matched);
            }
        },
        [setFieldCategory],
    );

    /** Auto-map: use the field's existing category hint from extraction */
    const handleAutoMap = useCallback(() => {
        let count = 0;
        validation.fields.forEach((f) => {
            if (!f.category) return;
            const matchedCol = COLUMN_DEFINITIONS.find(
                (col) => col.key.toLowerCase() === f.category?.toLowerCase(),
            );
            if (matchedCol) {
                setFieldCategory(f.id, matchedCol.key);
                count++;
            }
        });
        showToast(`Auto-Map Complete: ${count} field(s) were assigned.`, 'success');
    }, [validation.fields, setFieldCategory, showToast]);

    const assignedCount = validation.fields.filter(
        (f) => COLUMN_DEFINITIONS.some((col) => col.key === f.category),
    ).length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Map Columns</Text>
                <TouchableOpacity onPress={onContinue} style={styles.continueButton}>
                    <Text style={styles.continueText}>Export →</Text>
                </TouchableOpacity>
            </View>

            {/* Progress strip */}
            <View style={styles.progressStrip}>
                <Text style={styles.progressText}>
                    {assignedCount} / {validation.fields.length} fields assigned
                </Text>
                <TouchableOpacity onPress={handleAutoMap} style={styles.autoMapButton}>
                    <Text style={styles.autoMapText}>Auto-Map</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                {/* Left pane — unassigned source cards */}
                <View style={styles.leftPane}>
                    <Text style={styles.paneLabel}>UNASSIGNED</Text>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.sourceList}
                    >
                        {unassignedFields.length === 0 ? (
                            <View style={styles.allDoneHint}>
                                <Text style={styles.allDoneText}>✓ All mapped!</Text>
                            </View>
                        ) : (
                            unassignedFields.map((f) => (
                                <DraggableSourceCard
                                    key={f.id}
                                    field={f}
                                    onDropped={handleFieldDropped}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Right pane — column drop zones */}
                <View style={styles.rightPane}>
                    <Text style={styles.paneLabel}>COLUMNS</Text>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.zoneList}
                    >
                        {COLUMN_DEFINITIONS.map((col) => (
                            <DropZoneColumn
                                key={col.key}
                                columnKey={col.key}
                                label={col.label}
                                acceptedFields={fieldsByColumn(col.key)}
                                isHighlighted={highlightedZone === col.key}
                                onLayout={handleZoneLayout}
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
    headerButton: {
        padding: Spacing.xs,
    },
    headerButtonText: {
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
        fontSize: Typography.fontSizeSM,
    },
    progressStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    progressText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
    },
    autoMapButton: {
        backgroundColor: Colors.secondary + '33',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.secondary,
    },
    autoMapText: {
        color: Colors.secondary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightSemiBold,
    },
    body: {
        flex: 1,
        flexDirection: 'row',
    },
    leftPane: {
        flex: 2,
        padding: Spacing.sm,
    },
    divider: {
        width: 1,
        backgroundColor: Colors.border,
        marginVertical: Spacing.sm,
    },
    rightPane: {
        flex: 3,
        padding: Spacing.sm,
    },
    paneLabel: {
        color: Colors.textMuted,
        fontSize: 10,
        fontWeight: Typography.fontWeightBold,
        letterSpacing: 1.2,
        marginBottom: Spacing.xs,
    },
    sourceList: {
        gap: Spacing.xs,
        paddingBottom: Spacing.lg,
    },
    zoneList: {
        gap: Spacing.sm,
        paddingBottom: Spacing.lg,
    },
    // Source card styles
    sourceCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        alignItems: 'center',
        ...shadow(Colors.primary, 4, 8, 0.2, 4),
    },
    sourceCardBar: {
        width: 4,
        alignSelf: 'stretch',
    },
    sourceCardBody: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    sourceCardLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    sourceCardValue: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    confidencePill: {
        paddingHorizontal: Spacing.xs,
        paddingRight: Spacing.sm,
    },
    confidencePillText: {
        fontSize: 10,
        fontWeight: Typography.fontWeightBold,
    },
    allDoneHint: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    allDoneText: {
        color: Colors.success,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
});
