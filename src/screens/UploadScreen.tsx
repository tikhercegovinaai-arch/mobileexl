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
    Platform,
} from 'react-native';
import { Typography, Spacing, BorderRadius, shadow } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
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
    const { theme, isDark } = useTheme();
    const { show: showToast } = useToast();

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' }).start();
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
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => { hapticLight(); onBack(); }} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.textSecondary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Upload File</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Subtitle */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Select a file type to upload and extract data from
                    </Text>

                    {/* File Type Grid */}
                    <View style={styles.typeGrid}>
                        {FILE_TYPES.map((ft) => (
                            <TouchableOpacity
                                key={ft.category}
                                style={[
                                    styles.typeCard,
                                    { backgroundColor: theme.surface, borderColor: theme.border },
                                    selectedCategory === ft.category && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
                                    shadow(isDark ? '#000' : '#000', 2, 8, 0.15, 3)
                                ]}
                                onPress={() => handlePickFiles(ft.category)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.typeIcon}>{ft.icon}</Text>
                                <Text style={[
                                    styles.typeLabel,
                                    { color: theme.textPrimary },
                                    selectedCategory === ft.category && { color: theme.primary },
                                ]}>
                                    {ft.label}
                                </Text>
                                <Text style={[styles.typeDesc, { color: theme.textMuted }]}>{ft.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Picked Files List */}
                    {pickedFiles.length > 0 && (
                        <View style={styles.filesSection}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                                Selected ({pickedFiles.length} file{pickedFiles.length !== 1 ? 's' : ''})
                            </Text>
                            {pickedFiles.map((file, idx) => (
                                <View key={idx} style={[styles.fileRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={styles.fileIcon}>
                                        {file.mimeType.startsWith('image/') ? '🖼️' :
                                            file.mimeType === 'application/pdf' ? '📄' :
                                                file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? '📊' : '📝'}
                                    </Text>
                                    <View style={styles.fileInfo}>
                                        <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>{file.name}</Text>
                                        <Text style={[styles.fileSize, { color: theme.textMuted }]}>
                                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveFile(idx)}
                                        style={[styles.removeButton, { backgroundColor: theme.error + '33' }]}
                                    >
                                        <Text style={[styles.removeText, { color: theme.error }]}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Parsing indicator */}
                    {isParsing && (
                        <View style={[styles.parsingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <ActivityIndicator color={theme.primary} size="small" />
                            <Text style={[styles.parsingText, { color: theme.textSecondary }]}>{parseStatus}</Text>
                        </View>
                    )}

                    {/* Web drag-and-drop hint */}
                    {pickedFiles.length === 0 && (
                        <View style={[styles.dropZone, { borderColor: theme.border }]}>
                            <Text style={styles.dropIcon}>☁️</Text>
                            <Text style={[styles.dropText, { color: theme.textSecondary }]}>
                                Tap a file type above to select files
                            </Text>
                            <Text style={[styles.dropHint, { color: theme.textMuted }]}>
                                Supports: images, PDF, Excel, Word
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Analyze Button */}
            {pickedFiles.length > 0 && !isParsing && (
                <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.analyzeButton, { backgroundColor: theme.primary }, shadow(theme.primary, 4, 12, 0.35, 6)]}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: { paddingVertical: Spacing.xs, paddingRight: Spacing.md },
    backText: {
        fontSize: Typography.fontSizeMD,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
    body: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    subtitle: {
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
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1.5,
        gap: 6,
    },
    typeCardActive: {
    },
    typeIcon: { fontSize: 30 },
    typeLabel: {
        fontSize: Typography.fontSizeMD,
        fontWeight: Typography.fontWeightBold,
    },
    typeLabelActive: {},
    typeDesc: {
        fontSize: Typography.fontSizeXS,
        lineHeight: 16,
    },

    // Selected files list
    filesSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightSemiBold,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    fileIcon: { fontSize: 24 },
    fileInfo: { flex: 1 },
    fileName: {
        fontSize: Typography.fontSizeSM,
        fontWeight: Typography.fontWeightMedium,
    },
    fileSize: {
        fontSize: Typography.fontSizeXS,
        marginTop: 2,
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        fontSize: 18,
        fontWeight: Typography.fontWeightBold,
        marginTop: -1,
    },

    // Drop zone hint
    dropZone: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    dropIcon: { fontSize: 40 },
    dropText: {
        fontSize: Typography.fontSizeMD,
        textAlign: 'center',
    },
    dropHint: {
        fontSize: Typography.fontSizeSM,
        textAlign: 'center',
    },

    // Parsing
    parsingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    parsingText: {
        fontSize: Typography.fontSizeSM,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
    },
    analyzeIcon: { fontSize: Typography.fontSizeLG },
    analyzeText: {
        color: 'white',
        fontSize: Typography.fontSizeLG,
        fontWeight: Typography.fontWeightBold,
    },
});
