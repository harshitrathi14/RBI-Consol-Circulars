import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { COLORS, SIZES, SHADOWS, getTagColor } from '../constants/theme';
import { getAllSections, getAllTags, getSectionsByTag } from '../services/dataService';

const LibraryScreen = ({ navigation, route }) => {
    const [sections, setSections] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState('all');

    useEffect(() => {
        setTags(['all', ...getAllTags()]);

        // Check if navigated with a filter tag
        if (route.params?.filterTag) {
            setSelectedTag(route.params.filterTag);
            setSections(getSectionsByTag(route.params.filterTag));
        } else {
            setSections(getAllSections());
        }
    }, [route.params?.filterTag]);

    const handleTagFilter = useCallback((tag) => {
        setSelectedTag(tag);
        setSections(getSectionsByTag(tag));
    }, []);

    const renderTagFilter = ({ item: tag }) => (
        <TouchableOpacity
            style={[
                styles.filterTag,
                selectedTag === tag && styles.filterTagActive
            ]}
            onPress={() => handleTagFilter(tag)}
        >
            <Text style={[
                styles.filterTagText,
                selectedTag === tag && styles.filterTagTextActive
            ]}>
                {tag === 'all' ? 'All' : tag}
            </Text>
        </TouchableOpacity>
    );

    const renderSection = ({ item: section }) => (
        <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate('SectionDetail', { sectionId: section.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                    {section.title}
                </Text>
                <Text style={styles.sectionFunction} numberOfLines={3}>
                    {section.function}
                </Text>

                {/* Quick stats */}
                <View style={styles.statsRow}>
                    {section.actions?.length > 0 && (
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeText}>
                                {section.actions.length} Actions
                            </Text>
                        </View>
                    )}
                    {section.controls?.length > 0 && (
                        <View style={[styles.statBadge, styles.statBadgeAlt]}>
                            <Text style={styles.statBadgeText}>
                                {section.controls.length} Controls
                            </Text>
                        </View>
                    )}
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                    {section.tags?.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: getTagColor(tag) }]}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.cardArrow}>
                <Text style={styles.arrowText}>›</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Regulations Library</Text>
                <Text style={styles.headerSubtitle}>
                    {sections.length} section{sections.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Filter Tags */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={tags}
                    renderItem={renderTagFilter}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Sections List */}
            <FlatList
                data={sections}
                renderItem={renderSection}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            No sections found for this filter
                        </Text>
                    </View>
                }
            />
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
    headerSubtitle: {
        color: COLORS.primaryLight,
        fontSize: SIZES.sm,
        marginTop: 4,
    },
    filterContainer: {
        backgroundColor: COLORS.surface,
        paddingVertical: SIZES.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterList: {
        paddingHorizontal: SIZES.spacing.base,
    },
    filterTag: {
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.full,
        backgroundColor: COLORS.surfaceAlt,
        marginRight: SIZES.spacing.sm,
    },
    filterTagActive: {
        backgroundColor: COLORS.primary,
    },
    filterTagText: {
        fontSize: SIZES.md,
        fontWeight: '500',
        color: COLORS.textSecondary,
        textTransform: 'capitalize',
    },
    filterTagTextActive: {
        color: COLORS.textOnPrimary,
    },
    listContent: {
        padding: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.xxl,
    },
    sectionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        marginBottom: SIZES.spacing.md,
        flexDirection: 'row',
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    cardContent: {
        flex: 1,
        padding: SIZES.spacing.base,
    },
    cardArrow: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
    },
    arrowText: {
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.sm,
    },
    sectionFunction: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SIZES.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: SIZES.spacing.md,
    },
    statBadge: {
        backgroundColor: COLORS.primaryLight + '20',
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: SIZES.spacing.xs,
        borderRadius: SIZES.radius.sm,
        marginRight: SIZES.spacing.sm,
    },
    statBadgeAlt: {
        backgroundColor: COLORS.success + '20',
    },
    statBadgeText: {
        fontSize: SIZES.xs,
        fontWeight: '500',
        color: COLORS.text,
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
        padding: SIZES.spacing.xxl,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
});

export default LibraryScreen;
