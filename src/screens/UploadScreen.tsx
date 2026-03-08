import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, shadow } from '../constants/theme';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { useToast } from '../components/ToastProvider';
import { pickFiles } from '../services/UploadService';
import { FileParserService, ParsedResult } from '../services/FileParserService';
import { UploadedFile, FileCategory } from '../services/UploadService';

interface UploadScreenProps {
    onBack: () => void;
    onImagesReady: (uris: string[]) => void;
    onStructuredData: (data: Record<string, unknown>) => void;
    onTextContent: (text: string) => void;
}

interface FileTypeOption {
    category: FileCategory;
    icon: string;
    label: string;
    description: string;
    accept: string;
}

const FILE_TYPES: FileTypeOption[] = [
    {
        category: 'image',
        icon: '📷',
        label: 'Images',
        description: 'JPG, PNG, HEIC from gallery or device',
        accept: 'image/*',
    },
    {
        category: 'pdf',
        icon: '📄',
        label: 'PDF',
        description: 'Scanned or digital PDF documents',
        accept: '.pdf',
    },
    {
        category: 'excel',
        icon: '📊',
        label: 'Excel',
        description: '.xlsx or .xls spreadsheets',
        accept: '.xlsx,.xls',
    },
    {
        category: 'word',
        icon: '📝',
        label: 'Word',
        description: '.docx or .doc text documents',
        accept: '.docx,.doc',
    },
];

export default function UploadScreen({
    onBack,
    onImagesReady,
    onStructuredData,
    onTextContent,
}: UploadScreenProps) {
    const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(null);
    const [pickedFiles, setPickedFiles] = useState<UploadedFile[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [parseStatus, setParseStatus] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { show: showToast } = useToast();

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handlePickFiles = async (category: FileCategory) => {
        setSelectedCategory(category);
        const result = await pickFiles([category], category !== 'pdf');
        if (result.status === 'success' && result.files) {
            setPickedFiles(result.files);
        } else if (result.status === 'error') {
            showToast(result.error ?? 'Could not pick files', 'error');
        }
    };

    const handleAnalyze = async () => {
        if (pickedFiles.length === 0) return;
        setIsParsing(true);

        try {
            const allImageUris: string[] = [];
            let structuredData: Record<string, unknown> | null = null;
            let textContent = '';

            for (let i = 0; i < pickedFiles.length; i++) {
                setParseStatus(`Parsing file ${i + 1} of ${pickedFiles.length}…`);
                const parsed: ParsedResult = await FileParserService.parse(pickedFiles[i]);

                if (parsed.type === 'images') {
                    allImageUris.push(...parsed.uris);
                } else if (parsed.type === 'structured') {
                    structuredData = { ...(structuredData ?? {}), ...parsed.data };
                } else if (parsed.type === 'text') {
                    textContent += (textContent ? '\n\n---\n\n' : '') + parsed.content;
                }
            }

            setIsParsing(false);

            // Route to the appropriate pipeline stage
            if (allImageUris.length > 0) {
                onImagesReady(allImageUris);
            } else if (structuredData) {
                onStructuredData(structuredData);
            } else if (textContent) {
                onTextContent(textContent);
            }
        } catch (e: any) {
            setIsParsing(false);
            showToast(e?.message ?? 'Failed to process the file(s)', 'error');
        }
    };

    const handleRemoveFile = (idx: number) => {
        setPickedFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { hapticLight(); onBack(); }} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Upload File</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Subtitle */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.subtitle}>
                        Select a file type to upload and extract data from
                    </Text>

                    {/* File Type Grid */}
                    <View style={styles.typeGrid}>
                        {FILE_TYPES.map((ft) => (
                            <TouchableOpacity
                                key={ft.category}
                                style={[
                                    styles.typeCard,
                                    selectedCategory === ft.category && styles.typeCardActive,
                                ]}
                                onPress={() => handlePickFiles(ft.category)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.typeIcon}>{ft.icon}</Text>
                                <Text style={[
                                    styles.typeLabel,
                                    selectedCategory === ft.category && styles.typeLabelActive,
                                ]}>
                                    {ft.label}
                                </Text>
                                <Text style={styles.typeDesc}>{ft.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Picked Files List */}
                    {pickedFiles.length > 0 && (
                        <View style={styles.filesSection}>
                            <Text style={styles.sectionTitle}>
                                Selected ({pickedFiles.length} file{pickedFiles.length !== 1 ? 's' : ''})
                            </Text>
                            {pickedFiles.map((file, idx) => (
                                <View key={idx} style={styles.fileRow}>
                                    <Text style={styles.fileIcon}>
                                        {file.mimeType.startsWith('image/') ? '🖼️' :
                                            file.mimeType === 'application/pdf' ? '📄' :
                                                file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? '📊' : '📝'}
                                    </Text>
                                    <View style={styles.fileInfo}>
                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                        <Text style={styles.fileSize}>
                                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveFile(idx)}
                                        style={styles.removeButton}
                                    >
                                        <Text style={styles.removeText}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Parsing indicator */}
                    {isParsing && (
                        <View style={styles.parsingBox}>
                            <ActivityIndicator color={Colors.primary} size="small" />
                            <Text style={styles.parsingText}>{parseStatus}</Text>
                        </View>
                    )}

                    {/* Web drag-and-drop hint */}
                    {pickedFiles.length === 0 && (
                        <View style={styles.dropZone}>
                            <Text style={styles.dropIcon}>☁️</Text>
                            <Text style={styles.dropText}>
                                Tap a file type above to select files
                            </Text>
                            <Text style={styles.dropHint}>
                                Supports: images, PDF, Excel, Word
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Analyze Button */}
            {pickedFiles.length > 0 && !isParsing && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={() => {
                            hapticMedium();
                            handleAnalyze();
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.analyzeIcon}>🧠</Text>
                        <Text style={styles.analyzeText}>
                            Analyze {pickedFiles.length} File{pickedFiles.length !== 1 ? 's' : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: { paddingVertical: Spacing.xs, paddingRight: Spacing.md },
    backText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
    },
    title: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
    body: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        lineHeight: 22,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    typeCard: {
        width: '47%',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 6,
        ...shadow('#000', 2, 8, 0.15, 3),
    },
    typeCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '15',
    },
    typeIcon: { fontSize: 30 },
    typeLabel: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
        color: Colors.textPrimary,
    },
    typeLabelActive: { color: Colors.primary },
    typeDesc: {
        fontSize: Typography.fontSizeXS,
        color: Colors.textMuted,
        lineHeight: 16,
    },

    // Selected files list
    filesSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    fileIcon: { fontSize: 24 },
    fileInfo: { flex: 1 },
    fileName: {
        color: Colors.textPrimary,
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    fileSize: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeXS,
        marginTop: 2,
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.error + '33',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        color: Colors.error,
        fontSize: 18,
        fontWeight: Typography.fontWeightBold,
        marginTop: -1,
    },

    // Drop zone hint
    dropZone: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    dropIcon: { fontSize: 40 },
    dropText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
    },
    dropHint: {
        color: Colors.textMuted,
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
    },

    // Parsing
    parsingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    parsingText: {
        color: Colors.textSecondary,
        fontSize: Typography.fontSizeSM,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        ...shadow(Colors.primary, 4, 12, 0.35, 6),
    },
    analyzeIcon: { fontSize: Typography.fontSizeLG },
    analyzeText: {
        color: 'white',
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
});
