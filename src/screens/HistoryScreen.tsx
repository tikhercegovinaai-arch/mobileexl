import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    TextInput,
} from 'react-native';
import { useHistoryStore, HistoryEntry } from '../store/historyStore';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Typography, BorderRadius, shadow } from '../constants/theme';
import { TechnicalButton } from '../components/TechnicalButton';
import { hapticLight, hapticMedium } from '../utils/haptics';

interface HistoryScreenProps {
    onBack: () => void;
    onViewEntry: (entry: HistoryEntry) => void;
}

export default function HistoryScreen({ onBack, onViewEntry }: HistoryScreenProps) {
    const { entries, clearHistory } = useHistoryStore();
    const { theme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        const query = searchQuery.toLowerCase();
        return entries.filter(
            (e) =>
                e.fileName.toLowerCase().includes(query) ||
                JSON.stringify(e.extractedData).toLowerCase().includes(query)
        );
    }, [entries, searchQuery]);

    const renderItem = ({ item }: { item: HistoryEntry }) => {
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                    hapticLight();
                    onViewEntry(item);
                }}
                activeOpacity={0.7}
            >
                <View style={styles.entryHeader}>
                    <Text style={[styles.entryTitle, styles.monoText, { color: theme.textPrimary }]}>
                        {item.fileName.toUpperCase() || 'UNTITLED_LOG'}
                    </Text>
                    <View style={[
                        styles.healthBadge, 
                        { backgroundColor: item.confidenceHealth === 'excellent' ? '#00FF0022' : item.confidenceHealth === 'caution' ? '#FFA50022' : '#FF000022' }
                    ]}>
                        <Text style={[
                            styles.healthText, 
                            styles.monoText, 
                            { color: item.confidenceHealth === 'excellent' ? '#00FF00' : item.confidenceHealth === 'caution' ? '#FFA500' : '#FF0000' }
                        ]}>
                            {item.confidenceHealth.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.entryMeta}>
                    <Text style={[styles.metaText, styles.monoText, { color: theme.textMuted }]}>
                        TS: {formattedDate} @ {formattedTime}
                    </Text>
                    <Text style={[styles.metaText, styles.monoText, { color: theme.textMuted }]}>
                        FIELDS: {Object.keys(item.extractedData).length}
                    </Text>
                </View>

                <View style={styles.formatRow}>
                    {item.formatsExported.map((f) => (
                        <View key={f} style={[styles.formatTag, { borderColor: theme.primary }]}>
                            <Text style={[styles.formatText, styles.monoText, { color: theme.primary }]}>{f.toUpperCase()}</Text>
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.title, styles.monoText, { color: theme.textPrimary }]}>EXTRACTION_HISTORY</Text>
                    <Text style={[styles.subtitle, styles.monoText, { color: theme.textMuted }]}>ARCHIVED_STRUCTURED_DATA</Text>
                </View>
                <TechnicalButton
                    label="Back"
                    variant="outline"
                    onPress={onBack}
                    style={styles.backButton}
                />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                    placeholder="SEARCH_LOGS..."
                    placeholderTextColor={theme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredEntries}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, styles.monoText, { color: theme.textMuted }]}>
                            NO_RECORDS_FOUND
                        </Text>
                    </View>
                }
            />

            {entries.length > 0 && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                        hapticMedium();
                        clearHistory();
                    }}
                >
                    <Text style={[styles.clearText, styles.monoText, { color: '#FF4444' }]}>[WIPE_ALL_HISTORY]</Text>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: Typography.fontSizeLG,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 9,
        fontWeight: '600',
    },
    backButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    searchContainer: {
        padding: Spacing.md,
    },
    searchInput: {
        height: 40,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        fontSize: 12,
        fontFamily: 'Courier',
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 80,
    },
    entryCard: {
        padding: Spacing.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    entryTitle: {
        fontSize: 14,
        fontWeight: '900',
        flex: 1,
        marginRight: Spacing.sm,
    },
    healthBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    healthText: {
        fontSize: 8,
        fontWeight: '900',
    },
    entryMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    metaText: {
        fontSize: 10,
    },
    formatRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    formatTag: {
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    formatText: {
        fontSize: 8,
        fontWeight: '900',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 12,
    },
    clearButton: {
        position: 'absolute',
        bottom: Spacing.xl,
        alignSelf: 'center',
        padding: Spacing.sm,
    },
    clearText: {
        fontSize: 12,
        fontWeight: '900',
    },
    monoText: {
        fontFamily: 'Courier',
    },
});
