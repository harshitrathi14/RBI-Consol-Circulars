import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const WelcomePopup = ({ onClose }) => {
    const [visible, setVisible] = useState(true);

    const handleClose = () => {
        setVisible(false);
        if (onClose) onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.popup}>
                    {/* Header with Logo */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>📜</Text>
                        </View>
                        <Text style={styles.appName}>Consolidated Master Circulars</Text>
                        <Text style={styles.appSubtitle}>NBFCs</Text>
                        <Text style={styles.brandingText}>AI Apps by Harshit Rathi</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* About Section */}
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.aboutSection}>
                            <Text style={styles.aboutTitle}>About This App</Text>
                            <Text style={styles.aboutText}>
                                Your comprehensive guide to RBI Master Circulars for NBFCs. This app provides:
                            </Text>

                            <View style={styles.featureList}>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>📚</Text>
                                    <Text style={styles.featureText}>Complete regulatory library with categorized sections</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>🔍</Text>
                                    <Text style={styles.featureText}>Smart search across all circulars and regulations</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>📊</Text>
                                    <Text style={styles.featureText}>Key thresholds, RCSA, and compliance actions</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>📄</Text>
                                    <Text style={styles.featureText}>Original PDF circulars with easy sharing</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>📥</Text>
                                    <Text style={styles.featureText}>Extract & download key compliance data</Text>
                                </View>
                            </View>
                        </View>

                        {/* Version & Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.versionText}>Version 1.0.0</Text>
                            <Text style={styles.copyrightText}>Powered by AI Technology</Text>
                        </View>
                    </ScrollView>

                    {/* Get Started Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    popup: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        width: width - 48,
        maxWidth: 380,
        maxHeight: height * 0.8,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoIcon: {
        fontSize: 36,
    },
    appName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 2,
    },
    appSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FCD34D',
        textAlign: 'center',
        marginBottom: 4,
    },
    brandingText: {
        fontSize: 14,
        color: '#FCD34D',
        fontWeight: '600',
        textAlign: 'center',
    },
    divider: {
        height: 4,
        backgroundColor: COLORS.accent,
    },
    scrollContent: {
        maxHeight: height * 0.4,
    },
    aboutSection: {
        padding: 20,
    },
    aboutTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    aboutText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    featureList: {
        marginTop: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    featureIcon: {
        fontSize: 18,
        marginRight: 12,
        marginTop: 2,
    },
    featureText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    copyrightText: {
        fontSize: 10,
        color: COLORS.textLight,
        marginTop: 2,
    },
    button: {
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default WelcomePopup;
