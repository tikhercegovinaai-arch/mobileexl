import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { ExcelExportService } from '../services/ExcelExportService';

interface ExportScreenProps {
    onDone: () => void;
}

export default function ExportScreen({ onDone }: ExportScreenProps) {
    const { validation, setExportPath, currentExportPath } = useAppStore();
    const [isExporting, setIsExporting] = useState(false);

    const handleGenerateExcel = async () => {
        setIsExporting(true);
        try {
            const fileUri = await ExcelExportService.exportToExcel(validation.fields);
            setExportPath(fileUri);

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Export Extracted Data',
                    UTI: 'com.microsoft.excel.xlsx'
                });
            } else {
                Alert.alert("Export Success", `File saved to local cache: ${fileUri}`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Export Error", "Failed to generate Excel file.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={[styles.icon, { color: Colors.success }]}>📊</Text>
                </View>

                <Text style={styles.title}>Data Extraction Ready</Text>
                <Text style={styles.subtitle}>
                    All fields have been validated. You can now export your data into a professional Excel spreadsheet.
                </Text>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{validation.fields.length}</Text>
                        <Text style={styles.statLabel}>Fields</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {Math.round(validation.fields.reduce((acc, f) => acc + f.confidence, 0) / (validation.fields.length || 1) * 100)}%
                        </Text>
                        <Text style={styles.statLabel}>Avg Confidence</Text>
                    </View>
                </View>

                {isExporting ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Generating Spreadsheet...</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.exportButton} onPress={handleGenerateExcel}>
                        <Text style={styles.exportButtonText}>Generate & Share Excel</Text>
                    </TouchableOpacity>
                )}

                {!isExporting && (
                    <TouchableOpacity style={styles.doneButton} onPress={onDone}>
                        <Text style={styles.doneButtonText}>Finish Session</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
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
        marginBottom: Spacing.sm,
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
        marginBottom: Spacing.xxl,
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
    exportButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        width: '100%',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    exportButtonText: {
        color: 'white',
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
    doneButton: {
        paddingVertical: Spacing.md,
        width: '100%',
        alignItems: 'center',
    },
    doneButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: Spacing.md,
        fontSize: Typography.fontSizeMD,
    }
});
