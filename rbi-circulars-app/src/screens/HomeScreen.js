import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { COLORS, SIZES, SHADOWS, getTagColor } from '../constants/theme';
import { getStats, getFeaturedSections, getAllTags } from '../services/dataService';

const HomeScreen = ({ navigation }) => {
    const [stats, setStats] = useState(null);
    const [featured, setFeatured] = useState([]);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        setStats(getStats());
        setFeatured(getFeaturedSections());
        setTags(getAllTags());
    }, []);

    const StatCard = ({ title, value, icon, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );

    const SectionCard = ({ section }) => (
        <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => navigation.navigate('SectionDetail', { sectionId: section.id })}
            activeOpacity={0.7}
        >
            <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                    {section.title}
                </Text>
            </View>
            <Text style={styles.sectionFunction} numberOfLines={2}>
                {section.function}
            </Text>
            <View style={styles.tagsRow}>
                {section.tags?.slice(0, 3).map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: getTagColor(tag) }]}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );

    const TagPill = ({ tag }) => (
        <TouchableOpacity
            style={[styles.tagPill, { backgroundColor: getTagColor(tag) }]}
            onPress={() => navigation.navigate('Library', { filterTag: tag })}
        >
            <Text style={styles.tagPillText}>{tag}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>RBI Master Circulars</Text>
                    <Text style={styles.headerTitle}>NBFC Regulations</Text>
                </View>
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Text style={styles.searchIcon}>Search</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stats Section */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Sections"
                        value={stats?.totalSections || 0}
                        color={COLORS.primary}
                    />
                    <StatCard
                        title="Actions"
                        value={stats?.totalActions || 0}
                        color={COLORS.success}
                    />
                    <StatCard
                        title="Controls"
                        value={stats?.totalControls || 0}
                        color={COLORS.accent}
                    />
                    <StatCard
                        title="RCSA Items"
                        value={stats?.totalRCSA || 0}
                        color={COLORS.info}
                    />
                </View>

                {/* Quick Access Tags */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Quick Access</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsScroll}
                    >
                        {tags.map((tag, index) => (
                            <TagPill key={index} tag={tag} />
                        ))}
                    </ScrollView>
                </View>

                {/* Featured Sections */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>Key Regulations</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {featured.map((section) => (
                        <SectionCard key={section.id} section={section} />
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Library')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLight }]}>
                                <Text style={styles.quickActionEmoji}>📚</Text>
                            </View>
                            <Text style={styles.quickActionText}>Browse Library</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Search')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success }]}>
                                <Text style={styles.quickActionEmoji}>🔍</Text>
                            </View>
                            <Text style={styles.quickActionText}>Search</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Library', { filterTag: 'prudential' })}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accent }]}>
                                <Text style={styles.quickActionEmoji}>⚖️</Text>
                            </View>
                            <Text style={styles.quickActionText}>Prudential</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Library', { filterTag: 'governance' })}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.info }]}>
                                <Text style={styles.quickActionEmoji}>🏛️</Text>
                            </View>
                            <Text style={styles.quickActionText}>Governance</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        paddingBottom: SIZES.spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerSubtitle: {
        color: COLORS.primaryLight,
        fontSize: SIZES.sm,
        marginBottom: 4,
    },
    headerTitle: {
        color: COLORS.textOnPrimary,
        fontSize: SIZES.xxl,
        fontWeight: '700',
    },
    searchButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.lg,
    },
    searchIcon: {
        color: COLORS.textOnPrimary,
        fontSize: SIZES.md,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SIZES.spacing.xxl,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SIZES.spacing.md,
        marginTop: -SIZES.spacing.lg,
    },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginHorizontal: '1%',
        marginBottom: SIZES.spacing.sm,
        borderLeftWidth: 4,
        ...SHADOWS.medium,
    },
    statValue: {
        fontSize: SIZES.xxl,
        fontWeight: '700',
        color: COLORS.text,
    },
    statTitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    section: {
        marginTop: SIZES.spacing.lg,
        paddingHorizontal: SIZES.spacing.base,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.spacing.md,
    },
    sectionHeader: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    viewAllText: {
        fontSize: SIZES.md,
        color: COLORS.primaryLight,
        fontWeight: '500',
    },
    tagsScroll: {
        paddingRight: SIZES.spacing.base,
    },
    tagPill: {
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.full,
        marginRight: SIZES.spacing.sm,
    },
    tagPillText: {
        fontSize: SIZES.md,
        fontWeight: '500',
        color: COLORS.text,
        textTransform: 'capitalize',
    },
    sectionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginBottom: SIZES.spacing.md,
        ...SHADOWS.small,
    },
    sectionCardHeader: {
        marginBottom: SIZES.spacing.sm,
    },
    sectionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionFunction: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SIZES.spacing.md,
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
    },
    tagText: {
        fontSize: SIZES.xs,
        fontWeight: '500',
        color: COLORS.text,
        textTransform: 'capitalize',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: -SIZES.spacing.sm,
    },
    quickAction: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: SIZES.spacing.md,
    },
    quickActionIcon: {
        width: 50,
        height: 50,
        borderRadius: SIZES.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.spacing.sm,
    },
    quickActionEmoji: {
        fontSize: 24,
    },
    quickActionText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default HomeScreen;
