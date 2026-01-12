import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Keyboard,
} from 'react-native';
import { COLORS, SIZES, SHADOWS, getTagColor } from '../constants/theme';
import { searchSections } from '../services/dataService';

const SearchScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useCallback((text) => {
        setQuery(text);
        if (text.trim().length >= 2) {
            const searchResults = searchSections(text);
            setResults(searchResults);
            setHasSearched(true);
        } else {
            setResults([]);
            setHasSearched(false);
        }
    }, []);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        Keyboard.dismiss();
    };

    const renderResult = ({ item: section }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => navigation.navigate('SectionDetail', { sectionId: section.id })}
            activeOpacity={0.7}
        >
            <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle} numberOfLines={2}>
                        {section.title}
                    </Text>
                    <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>Score: {section.score}</Text>
                    </View>
                </View>
                <Text style={styles.resultFunction} numberOfLines={3}>
                    {section.function}
                </Text>
                <View style={styles.tagsRow}>
                    {section.tags?.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: getTagColor(tag) }]}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.resultArrow}>
                <Text style={styles.arrowText}>›</Text>
            </View>
        </TouchableOpacity>
    );

    const suggestedSearches = [
        'capital adequacy',
        'KYC compliance',
        'asset classification',
        'governance',
        'microfinance',
        'public deposits',
        'risk management',
        'NPA provisioning',
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Search Regulations</Text>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search regulations, actions, controls..."
                        placeholderTextColor={COLORS.textLight}
                        value={query}
                        onChangeText={handleSearch}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                            <Text style={styles.clearText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results or Suggestions */}
            {hasSearched ? (
                <FlatList
                    data={results}
                    renderItem={renderResult}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <Text style={styles.resultsCount}>
                            {results.length} result{results.length !== 1 ? 's' : ''} found
                        </Text>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>No results found</Text>
                            <Text style={styles.emptyText}>
                                Try different keywords or check spelling
                            </Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Suggested Searches</Text>
                    <View style={styles.suggestionsGrid}>
                        {suggestedSearches.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionChip}
                                onPress={() => handleSearch(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.tipsSection}>
                        <Text style={styles.tipsTitle}>Search Tips</Text>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Use specific terms like "NPA" or "provisioning"
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Search by regulation type: "governance", "prudential"
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Try action keywords: "report", "submit", "maintain"
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.spacing.lg,
        paddingTop: SIZES.spacing.md,
        paddingBottom: SIZES.spacing.lg,
    },
    headerTitle: {
        color: COLORS.textOnPrimary,
        fontSize: SIZES.xl,
        fontWeight: '700',
    },
    searchContainer: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.lg,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.lg,
        paddingHorizontal: SIZES.spacing.base,
        ...SHADOWS.medium,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: SIZES.spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SIZES.spacing.md,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
    clearButton: {
        padding: SIZES.spacing.sm,
    },
    clearText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    resultsCount: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SIZES.spacing.md,
    },
    resultsList: {
        padding: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.xxl,
    },
    resultCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        marginBottom: SIZES.spacing.md,
        flexDirection: 'row',
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    resultContent: {
        flex: 1,
        padding: SIZES.spacing.base,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SIZES.spacing.sm,
    },
    resultTitle: {
        flex: 1,
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: SIZES.spacing.sm,
    },
    scoreBadge: {
        backgroundColor: COLORS.primaryLight + '20',
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: 2,
        borderRadius: SIZES.radius.sm,
    },
    scoreText: {
        fontSize: SIZES.xs,
        fontWeight: '500',
        color: COLORS.primaryLight,
    },
    resultFunction: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SIZES.spacing.md,
    },
    resultArrow: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
    },
    arrowText: {
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: SIZES.spacing.xs,
        borderRadius: SIZES.radius.sm,
        marginRight: SIZES.spacing.xs,
        marginBottom: SIZES.spacing.xs,
    },
    tagText: {
        fontSize: SIZES.xs,
        fontWeight: '500',
        color: COLORS.text,
        textTransform: 'capitalize',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SIZES.spacing.xxl * 2,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: SIZES.spacing.base,
    },
    emptyTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.sm,
    },
    emptyText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
    },
    suggestionsContainer: {
        flex: 1,
        padding: SIZES.spacing.lg,
    },
    suggestionsTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SIZES.spacing.xl,
    },
    suggestionChip: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.full,
        marginRight: SIZES.spacing.sm,
        marginBottom: SIZES.spacing.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    suggestionText: {
        fontSize: SIZES.md,
        color: COLORS.text,
    },
    tipsSection: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        ...SHADOWS.small,
    },
    tipsTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: SIZES.spacing.sm,
    },
    tipBullet: {
        color: COLORS.primaryLight,
        marginRight: SIZES.spacing.sm,
        fontSize: SIZES.base,
    },
    tipText: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});

export default SearchScreen;
