import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Platform,
    Linking,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import pdfCirculars from '../data/pdfCirculars.json';

// Base URL for PDFs - for production, host these on a server
// For now, we'll use local file references
const PDF_BASE_PATH = '../../'; // Relative path to PDFs from app root

const CircularsScreen = ({ navigation }) => {
    const [circulars, setCirculars] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState(['all']);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setCirculars(pdfCirculars);
        // Extract unique categories
        const cats = ['all', ...new Set(pdfCirculars.map(c => c.category))];
        setCategories(cats);
    }, []);

    const filteredCirculars = selectedCategory === 'all'
        ? circulars
        : circulars.filter(c => c.category === selectedCategory);

    const handleViewPdf = async (circular) => {
        setLoading(true);

        try {
            if (Platform.OS === 'web') {
                // For web, try to open the PDF in a new tab
                // In production, this would be a hosted URL
                const pdfUrl = `/${circular.filename}`;
                window.open(pdfUrl, '_blank');
            } else {
                // For mobile, we'll show options
                setSelectedPdf(circular);
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to open PDF. Please try downloading instead.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (circular) => {
        if (Platform.OS === 'web') {
            // For web, trigger download
            const link = document.createElement('a');
            link.href = `/${circular.filename}`;
            link.download = circular.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // For mobile, show info about download
            Alert.alert(
                'Download PDF',
                `To download "${circular.title}", the PDF will be saved to your device's downloads folder.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Download',
                        onPress: () => {
                            // In production, implement with expo-file-system
                            Alert.alert('Coming Soon', 'Download functionality will be available in the next update.');
                        }
                    }
                ]
            );
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Framework': '#3B82F6',
            'Corporate Governance': '#8B5CF6',
            'Prudential': '#10B981',
            'Risk Management': '#F59E0B',
            'Lending': '#EF4444',
            'Deposits': '#06B6D4',
            'Operations': '#6366F1',
            'Asset Classification': '#EC4899',
            'Compliance': '#14B8A6',
            'Customer Protection': '#F97316',
            'Fintech': '#8B5CF6',
            'Microfinance': '#22C55E',
            'Infrastructure': '#64748B',
        };
        return colors[category] || COLORS.primary;
    };

    const renderCategoryFilter = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipActive
            ]}
            onPress={() => setSelectedCategory(item)}
        >
            <Text style={[
                styles.filterChipText,
                selectedCategory === item && styles.filterChipTextActive
            ]}>
                {item === 'all' ? 'All' : item}
            </Text>
        </TouchableOpacity>
    );

    const renderCircular = ({ item }) => (
        <View style={styles.circularCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                        {item.category}
                    </Text>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <Text style={styles.circularTitle}>{item.title}</Text>
            <Text style={styles.refText}>{item.rbiRef}</Text>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewPdf(item)}
                >
                    <Text style={styles.viewButtonText}>View PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => handleDownload(item)}
                >
                    <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Master Circulars</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredCirculars.length} circular{filteredCirculars.length !== 1 ? 's' : ''} available
                </Text>
            </View>

            {/* Category Filter */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={categories}
                    renderItem={renderCategoryFilter}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {/* Circulars List */}
            <FlatList
                data={filteredCirculars}
                renderItem={renderCircular}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No circulars found</Text>
                    </View>
                }
            />

            {/* PDF Options Modal (for mobile) */}
            <Modal
                visible={selectedPdf !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedPdf(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedPdf?.shortTitle || 'PDF Options'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedPdf?.title}
                        </Text>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedPdf(null);
                                Alert.alert(
                                    'Open in Browser',
                                    'PDF viewing will open in your default PDF viewer.',
                                    [{ text: 'OK' }]
                                );
                            }}
                        >
                            <Text style={styles.modalOptionIcon}>🌐</Text>
                            <View style={styles.modalOptionText}>
                                <Text style={styles.modalOptionTitle}>Open in Browser</Text>
                                <Text style={styles.modalOptionDesc}>View PDF in external browser</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedPdf(null);
                                handleDownload(selectedPdf);
                            }}
                        >
                            <Text style={styles.modalOptionIcon}>📥</Text>
                            <View style={styles.modalOptionText}>
                                <Text style={styles.modalOptionTitle}>Download PDF</Text>
                                <Text style={styles.modalOptionDesc}>Save to device storage</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedPdf(null);
                                Alert.alert(
                                    'Share',
                                    'Sharing functionality will be available soon.',
                                    [{ text: 'OK' }]
                                );
                            }}
                        >
                            <Text style={styles.modalOptionIcon}>📤</Text>
                            <View style={styles.modalOptionText}>
                                <Text style={styles.modalOptionTitle}>Share</Text>
                                <Text style={styles.modalOptionDesc}>Share via email or messaging</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setSelectedPdf(null)}
                        >
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
    filterChip: {
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.full,
        backgroundColor: COLORS.surfaceAlt,
        marginRight: SIZES.spacing.sm,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: SIZES.sm,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    filterChipTextActive: {
        color: COLORS.textOnPrimary,
    },
    listContent: {
        padding: SIZES.spacing.base,
        paddingBottom: SIZES.spacing.xxl,
    },
    circularCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.base,
        marginBottom: SIZES.spacing.md,
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.spacing.sm,
    },
    categoryBadge: {
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: SIZES.spacing.xs,
        borderRadius: SIZES.radius.sm,
    },
    categoryText: {
        fontSize: SIZES.xs,
        fontWeight: '600',
    },
    dateText: {
        fontSize: SIZES.xs,
        color: COLORS.textLight,
    },
    circularTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.xs,
    },
    refText: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: SIZES.spacing.md,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: SIZES.spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: SIZES.spacing.sm,
        borderRadius: SIZES.radius.md,
        alignItems: 'center',
    },
    viewButton: {
        backgroundColor: COLORS.primary,
    },
    viewButtonText: {
        color: COLORS.textOnPrimary,
        fontWeight: '600',
        fontSize: SIZES.md,
    },
    downloadButton: {
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    downloadButtonText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: SIZES.md,
    },
    emptyState: {
        padding: SIZES.spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: SIZES.base,
        color: COLORS.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.radius.xl,
        borderTopRightRadius: SIZES.radius.xl,
        padding: SIZES.spacing.lg,
        paddingBottom: SIZES.spacing.xxl,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SIZES.spacing.xs,
    },
    modalSubtitle: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        marginBottom: SIZES.spacing.lg,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalOptionIcon: {
        fontSize: 24,
        marginRight: SIZES.spacing.md,
    },
    modalOptionText: {
        flex: 1,
    },
    modalOptionTitle: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.text,
    },
    modalOptionDesc: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
    },
    modalClose: {
        marginTop: SIZES.spacing.lg,
        paddingVertical: SIZES.spacing.md,
        alignItems: 'center',
        backgroundColor: COLORS.surfaceAlt,
        borderRadius: SIZES.radius.md,
    },
    modalCloseText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CircularsScreen;
