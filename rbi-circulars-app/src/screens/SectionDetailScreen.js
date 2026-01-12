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
import { getSectionById } from '../services/dataService';

const SectionDetailScreen = ({ navigation, route }) => {
    const [section, setSection] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        actions: true,
        controls: false,
        reporting: false,
        thresholds: false,
        other: false,
        rcsa: false,
    });

    useEffect(() => {
        const { sectionId } = route.params;
        const data = getSectionById(sectionId);
        setSection(data);
    }, [route.params]);

    const toggleSection = (key) => {
        setExpandedSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (!section) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const CollapsibleSection = ({ title, items, sectionKey, icon, color }) => {
        if (!items || items.length === 0) return null;

        const isExpanded = expandedSections[sectionKey];

        return (
            <View style={styles.collapsibleSection}>
                <TouchableOpacity
                    style={styles.collapsibleHeader}
                    onPress={() => toggleSection(sectionKey)}
                    activeOpacity={0.7}
                >
                    <View style={styles.collapsibleHeaderLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                            <Text style={styles.iconText}>{icon}</Text>
                        </View>
                        <Text style={styles.collapsibleTitle}>{title}</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{items.length}</Text>
                        </View>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.collapsibleContent}>
                        {items.map((item, index) => (
                            <View key={index} style={styles.listItem}>
                                <View style={[styles.bullet, { backgroundColor: color }]} />
                                <Text style={styles.listItemText}>
                                    {typeof item === 'string' ? item : item.control || item.risk}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const RCSASection = ({ items }) => {
        if (!items || items.length === 0) return null;

        const isExpanded = expandedSections.rcsa;

        return (
            <View style={styles.collapsibleSection}>
                <TouchableOpacity
                    style={styles.collapsibleHeader}
                    onPress={() => toggleSection('rcsa')}
                    activeOpacity={0.7}
                >
                    <View style={styles.collapsibleHeaderLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.warning + '20' }]}>
                            <Text style={styles.iconText}>⚠️</Text>
                        </View>
                        <Text style={styles.collapsibleTitle}>Risk & Control Assessment</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{items.length}</Text>
                        </View>
                    </View>
                    <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.collapsibleContent}>
                        {items.map((item, index) => (
                            <View key={index} style={styles.rcsaCard}>
                                <View style={styles.rcsaRow}>
                                    <Text style={styles.rcsaLabel}>Control:</Text>
                                    <Text style={styles.rcsaValue}>{item.control}</Text>
                                </View>
                                <View style={styles.rcsaRow}>
                                    <Text style={styles.rcsaLabel}>Risk:</Text>
                                    <Text style={styles.rcsaValue}>{item.risk}</Text>
                                </View>
                                <View style={styles.rcsaRow}>
                                    <Text style={styles.rcsaLabel}>Frequency:</Text>
                                    <View style={styles.frequencyBadge}>
                                        <Text style={styles.frequencyText}>{item.frequency}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Title Card */}
                <View style={styles.titleCard}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.tagsRow}>
                        {section.tags?.map((tag, index) => (
                            <View key={index} style={[styles.tag, { backgroundColor: getTagColor(tag) }]}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Function/Summary */}
                <View style={styles.functionCard}>
                    <Text style={styles.cardLabel}>Overview</Text>
                    <Text style={styles.functionText}>{section.function}</Text>
                </View>

                {/* Deep Dive */}
                {section.deep_dive && (
                    <View style={styles.deepDiveCard}>
                        <Text style={styles.cardLabel}>Deep Dive</Text>
                        <Text style={styles.deepDiveText}>{section.deep_dive}</Text>
                    </View>
                )}

                {/* Collapsible Sections */}
                <View style={styles.sectionsContainer}>
                    <CollapsibleSection
                        title="Key Actions"
                        items={section.actions}
                        sectionKey="actions"
                        icon="✓"
                        color={COLORS.success}
                    />
                    <CollapsibleSection
                        title="Controls"
                        items={section.controls}
                        sectionKey="controls"
                        icon="🛡️"
                        color={COLORS.info}
                    />
                    <CollapsibleSection
                        title="Thresholds"
                        items={section.thresholds}
                        sectionKey="thresholds"
                        icon="📊"
                        color={COLORS.accent}
                    />
                    <CollapsibleSection
                        title="Reporting Requirements"
                        items={section.reporting}
                        sectionKey="reporting"
                        icon="📋"
                        color={COLORS.primary}
                    />
                    <CollapsibleSection
                        title="Other Information"
                        items={section.other}
                        sectionKey="other"
                        icon="📌"
                        color={COLORS.textSecondary}
                    />
                    <RCSASection items={section.rcsa} />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.md,
    },
    backButton: {
        paddingVertical: SIZES.spacing.xs,
    },
    backText: {
        color: COLORS.textOnPrimary,
        fontSize: SIZES.base,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.xxl,
    },
    titleCard: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.lg,
        marginBottom: SIZES.spacing.base,
        ...SHADOWS.medium,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.textOnPrimary,
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
        marginBottom: SIZES.spacing.xs,
    },
    tagText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.text,
        textTransform: 'capitalize',
    },
    functionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginBottom: SIZES.spacing.base,
        ...SHADOWS.small,
    },
    cardLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SIZES.spacing.sm,
    },
    functionText: {
        fontSize: SIZES.base,
        color: COLORS.text,
        lineHeight: 24,
    },
    deepDiveCard: {
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginBottom: SIZES.spacing.base,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primaryLight,
    },
    deepDiveText: {
        fontSize: SIZES.md,
        color: COLORS.text,
        lineHeight: 22,
    },
    sectionsContainer: {
        marginTop: SIZES.spacing.sm,
    },
    collapsibleSection: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        marginBottom: SIZES.spacing.md,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.spacing.base,
    },
    collapsibleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: SIZES.radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.spacing.md,
    },
    iconText: {
        fontSize: 16,
    },
    collapsibleTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    countBadge: {
        backgroundColor: COLORS.surfaceAlt,
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: 2,
        borderRadius: SIZES.radius.full,
        marginLeft: SIZES.spacing.sm,
    },
    countText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    expandIcon: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginLeft: SIZES.spacing.sm,
    },
    collapsibleContent: {
        paddingHorizontal: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.base,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    listItem: {
        flexDirection: 'row',
        paddingVertical: SIZES.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
        marginRight: SIZES.spacing.md,
    },
    listItemText: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.text,
        lineHeight: 22,
    },
    rcsaCard: {
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: SIZES.radius.sm,
        padding: SIZES.spacing.md,
        marginTop: SIZES.spacing.md,
    },
    rcsaRow: {
        flexDirection: 'row',
        marginBottom: SIZES.spacing.sm,
    },
    rcsaLabel: {
        fontSize: SIZES.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        width: 80,
    },
    rcsaValue: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.text,
    },
    frequencyBadge: {
        backgroundColor: COLORS.accent + '30',
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: 2,
        borderRadius: SIZES.radius.sm,
    },
    frequencyText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
        color: COLORS.accent,
    },
});

export default SectionDetailScreen;
