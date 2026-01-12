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
    Modal,
    ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Asset } from 'expo-asset';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import pdfCirculars from '../data/pdfCirculars.json';

// PDF asset mapping - maps filenames to require statements
const pdfAssets = {
    '339MD7166A79E96D64572B378949D3972DBD1.pdf': require('../../assets/pdfs/339MD7166A79E96D64572B378949D3972DBD1.pdf'),
    '340MD4B77ED4B942E4F9FBECA5673D0360BA3.pdf': require('../../assets/pdfs/340MD4B77ED4B942E4F9FBECA5673D0360BA3.pdf'),
    '341MDDF7F3A9C8BF2439D828E773D444D7FD3.pdf': require('../../assets/pdfs/341MDDF7F3A9C8BF2439D828E773D444D7FD3.pdf'),
    '342MD6D0E541E684A451BB4BB80C4819B2BB1.pdf': require('../../assets/pdfs/342MD6D0E541E684A451BB4BB80C4819B2BB1.pdf'),
    '343MD54448C9FA65A429BB5AFADBB162904F1.pdf': require('../../assets/pdfs/343MD54448C9FA65A429BB5AFADBB162904F1.pdf'),
    '344MD22F0E87F6DD848919A6459236939D76F.pdf': require('../../assets/pdfs/344MD22F0E87F6DD848919A6459236939D76F.pdf'),
    '345MDAB71EF5B2D534D7B92C654742BDF9A77.pdf': require('../../assets/pdfs/345MDAB71EF5B2D534D7B92C654742BDF9A77.pdf'),
    '346MD6C1FC3FFE3E84415B12A1C05642FD3E3.pdf': require('../../assets/pdfs/346MD6C1FC3FFE3E84415B12A1C05642FD3E3.pdf'),
    '347MD5CC21D3597C04354B67A42A1A4CB439C.pdf': require('../../assets/pdfs/347MD5CC21D3597C04354B67A42A1A4CB439C.pdf'),
    '349MD04B1F5EC16D84779BC61D9CC40552401.pdf': require('../../assets/pdfs/349MD04B1F5EC16D84779BC61D9CC40552401.pdf'),
    '350MDEF81E70DAB50429898EB2CF07BBCA09E.pdf': require('../../assets/pdfs/350MDEF81E70DAB50429898EB2CF07BBCA09E.pdf'),
    '351MD74108723E6DA484E954DB9D2C7ED184C.pdf': require('../../assets/pdfs/351MD74108723E6DA484E954DB9D2C7ED184C.pdf'),
    '352MDCF4E55B0ACD24FCC8AED1C715997F0F9.pdf': require('../../assets/pdfs/352MDCF4E55B0ACD24FCC8AED1C715997F0F9.pdf'),
    '353MD9A35481FC07E4D1199A62E5C2356B0C4.pdf': require('../../assets/pdfs/353MD9A35481FC07E4D1199A62E5C2356B0C4.pdf'),
    '354MD1F909E42C44E481085D47ECF16A9EE26.pdf': require('../../assets/pdfs/354MD1F909E42C44E481085D47ECF16A9EE26.pdf'),
    '355MDDFD8E87964DD4F529248131781B5812F.pdf': require('../../assets/pdfs/355MDDFD8E87964DD4F529248131781B5812F.pdf'),
    '356MD4F8109CA54BE44A9805C5300601F8A11.pdf': require('../../assets/pdfs/356MD4F8109CA54BE44A9805C5300601F8A11.pdf'),
    '357MD501BDDC9758E40B592D1AD2D919CC6AF.pdf': require('../../assets/pdfs/357MD501BDDC9758E40B592D1AD2D919CC6AF.pdf'),
    '358MDB0FF0CDD07C04BFAB5A97494E9BB7104.pdf': require('../../assets/pdfs/358MDB0FF0CDD07C04BFAB5A97494E9BB7104.pdf'),
    '360MD1E07039E1DCA455B8CCB9D0C4BFD4BBE.pdf': require('../../assets/pdfs/360MD1E07039E1DCA455B8CCB9D0C4BFD4BBE.pdf'),
    '361MD1E2F8EA063454AD5AFA1D02A1BA5ACA7.pdf': require('../../assets/pdfs/361MD1E2F8EA063454AD5AFA1D02A1BA5ACA7.pdf'),
    '362MD26CA543937BA439A97E1BCFC08CF5808.pdf': require('../../assets/pdfs/362MD26CA543937BA439A97E1BCFC08CF5808.pdf'),
    '368MDA3A72C813679452CB0A291E6B300DB59.pdf': require('../../assets/pdfs/368MDA3A72C813679452CB0A291E6B300DB59.pdf'),
    '371MD93444E1CFB2749C6A9F8F0182794522B.pdf': require('../../assets/pdfs/371MD93444E1CFB2749C6A9F8F0182794522B.pdf'),
    '373MD7F3656C99F764E2F9CE1BC4A1337861F.pdf': require('../../assets/pdfs/373MD7F3656C99F764E2F9CE1BC4A1337861F.pdf'),
};

const CircularsScreen = ({ navigation }) => {
    const [circulars, setCirculars] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState(['all']);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setCirculars(pdfCirculars);
        const cats = ['all', ...new Set(pdfCirculars.map(c => c.category))];
        setCategories(cats);
    }, []);

    const filteredCirculars = selectedCategory === 'all'
        ? circulars
        : circulars.filter(c => c.category === selectedCategory);

    // Get the local file path for a PDF
    const getPdfLocalPath = async (filename) => {
        const asset = pdfAssets[filename];
        if (!asset) {
            throw new Error('PDF not found in assets');
        }

        // Load the asset
        const [loadedAsset] = await Asset.loadAsync(asset);

        // Copy to document directory for sharing/opening
        const localUri = `${FileSystem.documentDirectory}${filename}`;

        // Check if already copied
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            await FileSystem.copyAsync({
                from: loadedAsset.localUri || loadedAsset.uri,
                to: localUri,
            });
        }

        return localUri;
    };

    const handleViewPdf = async (circular) => {
        setLoading(true);
        setSelectedPdf(null);

        try {
            const localUri = await getPdfLocalPath(circular.filename);

            if (Platform.OS === 'android') {
                // On Android, use IntentLauncher to open with PDF viewer
                const contentUri = await FileSystem.getContentUriAsync(localUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/pdf',
                });
            } else if (Platform.OS === 'ios') {
                // On iOS, use sharing which opens the share sheet with PDF preview
                await Sharing.shareAsync(localUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: circular.title,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                // Web fallback
                window.open(localUri, '_blank');
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            Alert.alert(
                'Error',
                'Unable to open PDF. Please make sure you have a PDF viewer installed.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (circular) => {
        setLoading(true);
        setSelectedPdf(null);

        try {
            const localUri = await getPdfLocalPath(circular.filename);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(localUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ${circular.title}`,
                });
            } else {
                Alert.alert('Sharing not available', 'Sharing is not available on this device.');
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
            Alert.alert('Error', 'Unable to share PDF.');
        } finally {
            setLoading(false);
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
            'Transactions': '#A855F7',
            'Investment': '#0EA5E9',
            'Resolution': '#DC2626',
            'Enforcement': '#B91C1C',
            'Reporting': '#059669',
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
                    disabled={loading}
                >
                    <Text style={styles.viewButtonText}>
                        {loading ? 'Opening...' : 'View PDF'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => handleShare(item)}
                    disabled={loading}
                >
                    <Text style={styles.shareButtonText}>Share</Text>
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
                    {filteredCirculars.length} circular{filteredCirculars.length !== 1 ? 's' : ''} • PDFs included offline
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

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Opening PDF...</Text>
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
    shareButton: {
        backgroundColor: COLORS.surfaceAlt,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shareButtonText: {
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: COLORS.surface,
        padding: SIZES.spacing.xl,
        borderRadius: SIZES.radius.md,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SIZES.spacing.md,
        fontSize: SIZES.base,
        color: COLORS.text,
    },
});

export default CircularsScreen;
