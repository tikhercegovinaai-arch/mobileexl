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
import * as Clipboard from 'expo-clipboard';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { ExcelExportService, ExportFormat } from '../services/ExcelExportService';
import { ExcelInjectorService, InjectorColumnMapping } from '../services/ExcelInjectorService';
import { PDFTemplateType } from '../services/PDFTemplateService';
import { AnalyticsService } from '../services/AnalyticsService';
import { BiometricService } from '../services/BiometricService';
import { useHistoryStore, HistoryEntry } from '../store/historyStore';
import { useToast } from '../components/ToastProvider';
import { hapticSuccess, hapticError, hapticLight } from '../utils/haptics';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

interface ExportScreenProps {
    onDone: () => void;
}

export default function ExportScreen({ onDone }: ExportScreenProps) {
    const { validation, columnMappings, setExportPath, currentExportPath, extraction, settings, capture } = useAppStore();
    const { addEntry } = useHistoryStore();
    const { theme } = useTheme();

    const [activeTab, setActiveTab] = useState<'export' | 'analytics'>('export');
    const [isExporting, setIsExporting] = useState(false);
    const { show: showToast } = useToast();
    const [format, setFormat] = useState<ExportFormat>('xlsx');
    const [pdfTemplate, setPdfTemplate] = useState<PDFTemplateType>('corporate');
    const [customFilename, setCustomFilename] = useState('');
    const [savedPath, setSavedPath] = useState<string | null>(null);

    const avgConfidence = Math.round(
        (validation.fields.reduce((s, f) => s + f.confidence, 0) / (validation.fields.length || 1)) * 100,
    );

    const aggregatedData = React.useMemo(() => {
        return AnalyticsService.aggregateData(extraction.extractedData || {});
    }, [extraction.extractedData]);

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
            return ExcelInjectorService.injectToExcel(validation.fields, injectorMappings, { filename: name, format, pdfTemplate });
        }

        return ExcelExportService.exportToExcel(validation.fields, { filename: name, format, pdfTemplate });
    };

    /** Share via OS share sheet */
    const handleShare = async () => {
        // Biometric gate
        if (settings.requireBiometricOnExport) {
            const isAuth = await BiometricService.authenticate('Authenticate to export data');
            if (!isAuth) {
                hapticError();
                showToast('Export cancelled: Authentication failed', 'error');
                return;
            }
        }

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
                            : format === 'pdf'
                                ? 'application/pdf'
                                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Export Extracted Data',
                    ...(format === 'xlsx' && { UTI: 'com.microsoft.excel.xlsx' }),
                });
                hapticSuccess();
            } else {
                hapticSuccess();
                showToast(`File stored at: ${fileUri}`, 'success');
            }

            // Save to History
            const historyEntry: Omit<HistoryEntry, 'id' | 'timestamp'> = {
                fileName: name ? name : `Extraction_${Date.now()}`,
                imageUris: capture.capturedImageUris,
                extractedData: extraction.extractedData || {},
                confidenceHealth: (avgConfidence > 85 ? 'excellent' : avgConfidence > 60 ? 'caution' : 'poor') as 'excellent' | 'caution' | 'poor',
                averageConfidence: avgConfidence,
                formatsExported: [format],
            };
            addEntry(historyEntry);
        } catch (e) {
            console.error(e);
            hapticError();
            showToast('Failed to generate file.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    /** Copy JSON representation to clipboard */
    const handleCopyToClipboard = async () => {
        hapticLight();
        try {
            const rawData = extraction.extractedData || {};
            await Clipboard.setStringAsync(JSON.stringify(rawData, null, 2));
            showToast('Copied to clipboard!', 'success');
        } catch (e) {
            showToast('Failed to copy', 'error');
        }
    };

    /** Save directly to device - not needed as Share handles this natively via OS share sheet */

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Tab navigation */}
            <View style={[styles.tabBar, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'export' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => {
                        hapticLight();
                        setActiveTab('export');
                    }}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'export' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'export' ? Typography.fontWeightBold : Typography.fontWeightMedium }]}>Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'analytics' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => {
                        hapticLight();
                        setActiveTab('analytics');
                    }}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'analytics' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'analytics' ? Typography.fontWeightBold : Typography.fontWeightMedium }]}>Analytics</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard data={aggregatedData} />
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.success + '20' }]}>
                        <Text style={styles.icon}>📊</Text>
                    </View>

                    <Text style={[styles.title, { color: theme.textPrimary }]}>Export Ready</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {validation.fields.length} fields validated.
                        {columnMappings.length > 0
                            ? ` ${columnMappings.length} columns mapped.`
                            : ' No column mapping applied.'}
                    </Text>

                    {/* Stats */}
                    <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{validation.fields.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Fields</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{avgConfidence}%</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Avg Conf.</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{columnMappings.length}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Columns</Text>
                        </View>
                    </View>

                    {/* Format selector */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Export Format</Text>
                        <View style={styles.formatRow}>
                            {(['xlsx', 'csv', 'pdf', 'json'] as ExportFormat[]).map((f) => (
                                <TouchableOpacity
                                    key={f}
                                    style={[
                                        styles.formatChip,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                        format === f && { borderColor: theme.primary, backgroundColor: theme.primary + '22' }
                                    ]}
                                    onPress={() => {
                                        hapticLight();
                                        setFormat(f);
                                    }}
                                >
                                    <Text style={[
                                        styles.formatChipText,
                                        { color: theme.textSecondary },
                                        format === f && { color: theme.primary }
                                    ]}>
                                        .{f.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Template selector (PDF only) */}
                    {format === 'pdf' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PDF Template</Text>
                            <View style={styles.formatRow}>
                                {(['corporate', 'financial', 'grid'] as PDFTemplateType[]).map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.formatChip,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            pdfTemplate === t && { borderColor: theme.primary, backgroundColor: theme.primary + '22' }
                                        ]}
                                        onPress={() => {
                                            hapticLight();
                                            setPdfTemplate(t);
                                        }}
                                    >
                                        <Text style={[
                                            styles.formatChipText,
                                            { color: theme.textSecondary },
                                            pdfTemplate === t && { color: theme.primary }
                                        ]}>
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Filename */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Filename (optional)</Text>
                        <TextInput
                            style={[styles.filenameInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                            placeholder={`Extraction_${Date.now()}`}
                            placeholderTextColor={theme.textMuted}
                            value={customFilename}
                            onChangeText={setCustomFilename}
                            autoCapitalize="none"
                        />
                    </View>

                    {isExporting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating File…</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonStack}>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => {
                                hapticSuccess();
                                handleShare();
                            }}>
                                <Text style={styles.primaryButtonText}>
                                    ↗ Share / Save to Files
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                                onPress={handleCopyToClipboard}
                            >
                                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                                    📋 Copy Raw JSON
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.ghostButton} onPress={() => {
                                hapticLight();
                                onDone();
                            }}>
                                <Text style={[styles.ghostButtonText, { color: theme.textSecondary }]}>Finish Session</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {savedPath && (
                        <Text style={[styles.savedPathText, { color: theme.success }]} numberOfLines={2}>
                            ✓ Saved: {savedPath}
                        </Text>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    tabText: {
        fontSize: Typography.fontSizeSM,
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
        fontSize: Typography.fontSize2XL,
        fontWeight: Typography.fontWeightBold,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    statsContainer: {
        flexDirection: 'row',
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        width: '100%',
        marginBottom: Spacing.xl,
        borderWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.fontSizeXL,
        fontWeight: Typography.fontWeightBold,
    },
    statLabel: {
        fontSize: Typography.fontSizeXS,
        textTransform: 'uppercase',
        marginTop: Spacing.xs,
    },
    statDivider: {
        width: 1,
        height: '100%',
    },
    section: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    sectionLabel: {
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
    },
    formatChipText: {
        fontWeight: Typography.fontWeightSemiBold,
        fontSize: Typography.fontSizeSM,
    },
    filenameInput: {
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
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
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeMD,
    },
    buttonStack: {
        width: '100%',
        gap: Spacing.sm,
    },
    primaryButton: {
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
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightSemiBold,
    },
    ghostButton: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    ghostButtonText: {
        fontSize: Typography.fontSizeMD,
    },
    savedPathText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeXS,
        textAlign: 'center',
    },
});
