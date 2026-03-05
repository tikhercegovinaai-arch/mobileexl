import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    ScrollView,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { ExcelExportService, ExportFormat } from '../services/ExcelExportService';
import { ExcelInjectorService, InjectorColumnMapping } from '../services/ExcelInjectorService';

interface ExportScreenProps {
    onDone: () => void;
}

export default function ExportScreen({ onDone }: ExportScreenProps) {
    const { validation, columnMappings, setExportPath, currentExportPath } = useAppStore();

    const [isExporting, setIsExporting] = useState(false);
    const [format, setFormat] = useState<ExportFormat>('xlsx');
    const [customFilename, setCustomFilename] = useState('');
    const [savedPath, setSavedPath] = useState<string | null>(null);

    const avgConfidence = Math.round(
        (validation.fields.reduce((s, f) => s + f.confidence, 0) / (validation.fields.length || 1)) * 100,
    );

    /** Generate the xlsx using the injector (column-mapped) when mappings exist, otherwise fall back to ExcelExportService */
    const generateFile = async (): Promise<string> => {
        const name = customFilename.trim() || undefined;

        if (columnMappings.length > 0) {
            // Build injector-compatible mapping list
            const injectorMappings: InjectorColumnMapping[] = columnMappings.map((m) => ({
                columnKey: m.columnKey,
                fieldIds: m.fieldIds,
            }));
            // Also include assigned-by-category fields not yet in columnMappings
            const categories = Array.from(new Set(validation.fields.map((f) => f.category).filter(Boolean))) as string[];
            categories.forEach((cat) => {
                if (!injectorMappings.some((m) => m.columnKey === cat)) {
                    injectorMappings.push({
                        columnKey: cat,
                        fieldIds: validation.fields.filter((f) => f.category === cat).map((f) => f.id),
                    });
                }
            });
            return ExcelInjectorService.injectToExcel(validation.fields, injectorMappings, { filename: name, format });
        }

        return ExcelExportService.exportToExcel(validation.fields, { filename: name, format });
    };

    /** Share via OS share sheet */
    const handleShare = async () => {
        setIsExporting(true);
        try {
            const fileUri = await generateFile();
            setExportPath(fileUri);

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType:
                        format === 'csv'
                            ? 'text/csv'
                            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Export Extracted Data',
                    ...(format === 'xlsx' && { UTI: 'com.microsoft.excel.xlsx' }),
                });
            } else {
                Alert.alert('Saved', `File stored at:\n${fileUri}`);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Export Error', 'Failed to generate file.');
        } finally {
            setIsExporting(false);
        }
    };

    /** Save directly to device - not needed as Share handles this natively via OS share sheet */

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={styles.icon}>📊</Text>
                </View>

                <Text style={styles.title}>Export Ready</Text>
                <Text style={styles.subtitle}>
                    {validation.fields.length} fields validated.
                    {columnMappings.length > 0
                        ? ` ${columnMappings.length} columns mapped.`
                        : ' No column mapping applied.'}
                </Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{validation.fields.length}</Text>
                        <Text style={styles.statLabel}>Fields</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{avgConfidence}%</Text>
                        <Text style={styles.statLabel}>Avg Conf.</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{columnMappings.length}</Text>
                        <Text style={styles.statLabel}>Columns</Text>
                    </View>
                </View>

                {/* Format selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Export Format</Text>
                    <View style={styles.formatRow}>
                        {(['xlsx', 'csv'] as ExportFormat[]).map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.formatChip, format === f && styles.formatChipActive]}
                                onPress={() => setFormat(f)}
                            >
                                <Text style={[styles.formatChipText, format === f && styles.formatChipTextActive]}>
                                    .{f.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Filename */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Filename (optional)</Text>
                    <TextInput
                        style={styles.filenameInput}
                        placeholder={`Extraction_${Date.now()}`}
                        placeholderTextColor={Colors.textMuted}
                        value={customFilename}
                        onChangeText={setCustomFilename}
                        autoCapitalize="none"
                    />
                </View>

                {isExporting ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Generating File…</Text>
                    </View>
                ) : (
                    <View style={styles.buttonStack}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
                            <Text style={styles.primaryButtonText}>
                                ↗ Share / Save to Files
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.ghostButton} onPress={onDone}>
                            <Text style={styles.ghostButtonText}>Finish Session</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {savedPath && (
                    <Text style={styles.savedPathText} numberOfLines={2}>
                        ✓ Saved: {savedPath}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        width: '100%',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
    },
    statLabel: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeXS,
        textTransform: 'uppercase',
        marginTop: Spacing.xs,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: Colors.border,
    },
    section: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeXS,
        fontWeight: Typography.fontWeightBold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.xs,
    },
    formatRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    formatChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    formatChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '22',
    },
    formatChipText: {
        color: Colors.textSecondary,
        fontWeight: Typography.fontWeightSemiBold,
        fontSize: Typography.fontSizeSM,
    },
    formatChipTextActive: {
        color: Colors.primary,
    },
    filenameInput: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSizeMD,
        width: '100%',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeMD,
    },
    buttonStack: {
        width: '100%',
        gap: Spacing.sm,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
    secondaryButton: {
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    secondaryButtonText: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    ghostButton: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    ghostButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
    savedPathText: {
        marginTop: Spacing.md,
        color: Colors.success,
        fontSize: Typography.fontSizeXS,
        textAlign: 'center',
    },
});
