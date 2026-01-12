import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getAllSections, getStats } from '../services/dataService';

const ExportScreen = () => {
    const [loading, setLoading] = useState(false);
    const [loadingType, setLoadingType] = useState(null);
    const [stats, setStats] = useState(null);
    const [sections, setSections] = useState([]);

    useEffect(() => {
        setStats(getStats());
        setSections(getAllSections());
    }, []);

    // Generate RCSA data as CSV
    const generateRCSACSV = () => {
        let csv = 'Section,Control,Risk,Frequency\n';
        sections.forEach(section => {
            section.rcsa?.forEach(item => {
                const control = (item.control || '').replace(/"/g, '""').replace(/\n/g, ' ');
                const risk = (item.risk || '').replace(/"/g, '""').replace(/\n/g, ' ');
                const frequency = (item.frequency || '').replace(/"/g, '""');
                csv += `"${section.title}","${control}","${risk}","${frequency}"\n`;
            });
        });
        return csv;
    };

    // Generate Thresholds data as CSV
    const generateThresholdsCSV = () => {
        let csv = 'Section,Category,Threshold\n';
        sections.forEach(section => {
            const category = section.tags?.[0] || 'General';
            section.thresholds?.forEach(threshold => {
                const thresholdText = threshold.replace(/"/g, '""').replace(/\n/g, ' ');
                csv += `"${section.title}","${category}","${thresholdText}"\n`;
            });
        });
        return csv;
    };

    // Generate Key Actions CSV
    const generateActionsCSV = () => {
        let csv = 'Section,Category,Action\n';
        sections.forEach(section => {
            const category = section.tags?.[0] || 'General';
            section.actions?.forEach(action => {
                const actionText = action.replace(/"/g, '""').replace(/\n/g, ' ');
                csv += `"${section.title}","${category}","${actionText}"\n`;
            });
        });
        return csv;
    };

    // Generate Controls CSV
    const generateControlsCSV = () => {
        let csv = 'Section,Category,Control\n';
        sections.forEach(section => {
            const category = section.tags?.[0] || 'General';
            section.controls?.forEach(control => {
                const controlText = control.replace(/"/g, '""').replace(/\n/g, ' ');
                csv += `"${section.title}","${category}","${controlText}"\n`;
            });
        });
        return csv;
    };

    // Generate Brief Summaries CSV
    const generateSummariesCSV = () => {
        let csv = 'Section,Category,Summary,Deep Dive\n';
        sections.forEach(section => {
            const category = section.tags?.join(', ') || 'General';
            const summary = (section.function || '').replace(/"/g, '""').replace(/\n/g, ' ');
            const deepDive = (section.deep_dive || '').replace(/"/g, '""').replace(/\n/g, ' ');
            csv += `"${section.title}","${category}","${summary}","${deepDive}"\n`;
        });
        return csv;
    };

    // Generate Complete Report CSV
    const generateCompleteReportCSV = () => {
        let csv = 'Section,Category,Type,Content\n';
        sections.forEach(section => {
            const category = section.tags?.[0] || 'General';

            // Add summary
            if (section.function) {
                csv += `"${section.title}","${category}","Summary","${section.function.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
            }

            // Add actions
            section.actions?.forEach(action => {
                csv += `"${section.title}","${category}","Action","${action.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
            });

            // Add controls
            section.controls?.forEach(control => {
                csv += `"${section.title}","${category}","Control","${control.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
            });

            // Add thresholds
            section.thresholds?.forEach(threshold => {
                csv += `"${section.title}","${category}","Threshold","${threshold.replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
            });

            // Add RCSA
            section.rcsa?.forEach(item => {
                csv += `"${section.title}","${category}","RCSA Control","${(item.control || '').replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
                csv += `"${section.title}","${category}","RCSA Risk","${(item.risk || '').replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
            });
        });
        return csv;
    };

    // Export and share file
    const exportData = async (type) => {
        setLoading(true);
        setLoadingType(type);

        try {
            let csvContent = '';
            let fileName = '';

            switch (type) {
                case 'rcsa':
                    csvContent = generateRCSACSV();
                    fileName = 'RCSA_Report.csv';
                    break;
                case 'thresholds':
                    csvContent = generateThresholdsCSV();
                    fileName = 'Key_Thresholds.csv';
                    break;
                case 'actions':
                    csvContent = generateActionsCSV();
                    fileName = 'Key_Actions.csv';
                    break;
                case 'controls':
                    csvContent = generateControlsCSV();
                    fileName = 'Controls.csv';
                    break;
                case 'summaries':
                    csvContent = generateSummariesCSV();
                    fileName = 'Brief_Summaries.csv';
                    break;
                case 'complete':
                    csvContent = generateCompleteReportCSV();
                    fileName = 'Complete_Compliance_Report.csv';
                    break;
                default:
                    throw new Error('Unknown export type');
            }

            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'text/csv',
                    dialogTitle: `Export ${fileName}`,
                    UTI: 'public.comma-separated-values-text',
                });
            } else {
                Alert.alert(
                    'Export Complete',
                    `File saved to: ${fileUri}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Export Error', 'Failed to export data. Please try again.');
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    const ExportCard = ({ title, description, icon, count, type, color }) => (
        <TouchableOpacity
            style={styles.exportCard}
            onPress={() => exportData(type)}
            activeOpacity={0.7}
            disabled={loading}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Text style={styles.iconText}>{icon}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
                {count > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.countText, { color }]}>{count} items</Text>
                    </View>
                )}
            </View>
            <View style={styles.exportIconContainer}>
                {loading && loadingType === type ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Text style={styles.exportIcon}>📥</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // Calculate counts
    const rcsaCount = sections.reduce((acc, s) => acc + (s.rcsa?.length || 0), 0);
    const thresholdsCount = sections.reduce((acc, s) => acc + (s.thresholds?.length || 0), 0);
    const actionsCount = sections.reduce((acc, s) => acc + (s.actions?.length || 0), 0);
    const controlsCount = sections.reduce((acc, s) => acc + (s.controls?.length || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Export Data</Text>
                <Text style={styles.headerSubtitle}>Download compliance reports as CSV</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Export data to CSV format for use in Excel, Google Sheets, or other analysis tools.
                    </Text>
                </View>

                {/* Export Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Individual Reports</Text>

                    <ExportCard
                        title="RCSA Report"
                        description="Risk & Control Self-Assessment data with controls, risks, and frequencies"
                        icon="⚠️"
                        count={rcsaCount}
                        type="rcsa"
                        color={COLORS.warning}
                    />

                    <ExportCard
                        title="Key Thresholds"
                        description="Regulatory thresholds and limits for compliance monitoring"
                        icon="📊"
                        count={thresholdsCount}
                        type="thresholds"
                        color={COLORS.accent}
                    />

                    <ExportCard
                        title="Key Actions"
                        description="Required compliance actions across all regulatory areas"
                        icon="✓"
                        count={actionsCount}
                        type="actions"
                        color={COLORS.success}
                    />

                    <ExportCard
                        title="Controls"
                        description="Internal control measures for regulatory compliance"
                        icon="🛡️"
                        count={controlsCount}
                        type="controls"
                        color={COLORS.info}
                    />

                    <ExportCard
                        title="Brief Summaries"
                        description="Section summaries and deep-dive explanations"
                        icon="📝"
                        count={sections.length}
                        type="summaries"
                        color={COLORS.primary}
                    />
                </View>

                {/* Complete Export */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Complete Report</Text>

                    <TouchableOpacity
                        style={styles.completeExportCard}
                        onPress={() => exportData('complete')}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <View style={styles.completeExportHeader}>
                            <Text style={styles.completeExportIcon}>📋</Text>
                            <Text style={styles.completeExportTitle}>Export Everything</Text>
                        </View>
                        <Text style={styles.completeExportDescription}>
                            Download a comprehensive CSV containing all summaries, actions, controls, thresholds, and RCSA data in one file.
                        </Text>
                        <View style={styles.completeExportButton}>
                            {loading && loadingType === 'complete' ? (
                                <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
                            ) : (
                                <>
                                    <Text style={styles.completeExportButtonIcon}>📥</Text>
                                    <Text style={styles.completeExportButtonText}>Download Complete Report</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>Data Summary</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.totalSections || 0}</Text>
                            <Text style={styles.statLabel}>Sections</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.totalActions || 0}</Text>
                            <Text style={styles.statLabel}>Actions</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.totalControls || 0}</Text>
                            <Text style={styles.statLabel}>Controls</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.totalRCSA || 0}</Text>
                            <Text style={styles.statLabel}>RCSA Items</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Consolidated Master Circulars: NBFCs</Text>
                    <Text style={styles.footerSubtext}>AI Apps by Harshit Rathi</Text>
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
    },
    headerTitle: {
        color: COLORS.textOnPrimary,
        fontSize: SIZES.xxl,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: COLORS.primaryLight,
        fontSize: SIZES.md,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SIZES.spacing.xxl,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: COLORS.info + '15',
        marginHorizontal: SIZES.spacing.base,
        marginTop: SIZES.spacing.base,
        padding: SIZES.spacing.base,
        borderRadius: SIZES.radius.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.info,
    },
    infoIcon: {
        fontSize: 18,
        marginRight: SIZES.spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.text,
        lineHeight: 20,
    },
    section: {
        marginTop: SIZES.spacing.lg,
        paddingHorizontal: SIZES.spacing.base,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    exportCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginBottom: SIZES.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: SIZES.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.spacing.md,
    },
    iconText: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    countBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: 2,
        borderRadius: SIZES.radius.full,
        marginTop: SIZES.spacing.xs,
    },
    countText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
    },
    exportIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportIcon: {
        fontSize: 22,
    },
    completeExportCard: {
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius.lg,
        padding: SIZES.spacing.lg,
        ...SHADOWS.medium,
    },
    completeExportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.spacing.sm,
    },
    completeExportIcon: {
        fontSize: 28,
        marginRight: SIZES.spacing.md,
    },
    completeExportTitle: {
        fontSize: SIZES.xl,
        fontWeight: '700',
        color: COLORS.textOnPrimary,
    },
    completeExportDescription: {
        fontSize: SIZES.md,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 22,
        marginBottom: SIZES.spacing.lg,
    },
    completeExportButton: {
        backgroundColor: COLORS.accent,
        borderRadius: SIZES.radius.md,
        paddingVertical: SIZES.spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeExportButtonIcon: {
        fontSize: 18,
        marginRight: SIZES.spacing.sm,
    },
    completeExportButtonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    statsSection: {
        marginTop: SIZES.spacing.xl,
        marginHorizontal: SIZES.spacing.base,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        ...SHADOWS.small,
    },
    statsTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: SIZES.xl,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    footer: {
        marginTop: SIZES.spacing.xl,
        alignItems: 'center',
        paddingBottom: SIZES.spacing.lg,
    },
    footerText: {
        fontSize: SIZES.md,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    footerSubtext: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
        marginTop: 4,
    },
});

export default ExportScreen;
