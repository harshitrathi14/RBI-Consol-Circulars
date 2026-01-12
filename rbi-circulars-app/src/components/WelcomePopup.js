import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const WelcomePopup = ({ onClose }) => {
    const [visible, setVisible] = useState(false);
    const scaleAnim = new Animated.Value(0.8);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        checkFirstLaunch();
    }, []);

    const checkFirstLaunch = async () => {
        try {
            // Show popup every time app opens (remove stored value check for always showing)
            setVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } catch (error) {
            console.log('Error checking first launch:', error);
        }
    };

    const handleClose = async () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            if (onClose) onClose();
        });
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.popup,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
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

                    {/* Get Started Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.spacing.lg,
    },
    popup: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.xl,
        width: width - 48,
        maxWidth: 380,
        overflow: 'hidden',
        ...SHADOWS.large,
    },
    header: {
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.spacing.xl,
        paddingHorizontal: SIZES.spacing.lg,
        alignItems: 'center',
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.spacing.md,
    },
    logoIcon: {
        fontSize: 36,
    },
    appName: {
        fontSize: SIZES.xl,
        fontWeight: '700',
        color: COLORS.textOnPrimary,
        textAlign: 'center',
        marginBottom: 2,
    },
    appSubtitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.accentLight,
        textAlign: 'center',
        marginBottom: SIZES.spacing.xs,
    },
    brandingText: {
        fontSize: SIZES.md,
        color: COLORS.accentLight,
        fontWeight: '600',
        textAlign: 'center',
    },
    divider: {
        height: 4,
        backgroundColor: COLORS.accent,
    },
    aboutSection: {
        padding: SIZES.spacing.lg,
    },
    aboutTitle: {
        fontSize: SIZES.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SIZES.spacing.sm,
    },
    aboutText: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: SIZES.spacing.base,
    },
    featureList: {
        marginTop: SIZES.spacing.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SIZES.spacing.md,
    },
    featureIcon: {
        fontSize: 18,
        marginRight: SIZES.spacing.md,
        marginTop: 2,
    },
    featureText: {
        flex: 1,
        fontSize: SIZES.md,
        color: COLORS.text,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: SIZES.spacing.lg,
        paddingBottom: SIZES.spacing.md,
        alignItems: 'center',
    },
    versionText: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
    },
    copyrightText: {
        fontSize: SIZES.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    button: {
        backgroundColor: COLORS.primary,
        marginHorizontal: SIZES.spacing.lg,
        marginBottom: SIZES.spacing.lg,
        paddingVertical: SIZES.spacing.base,
        borderRadius: SIZES.radius.md,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: SIZES.base,
        fontWeight: '600',
        color: COLORS.textOnPrimary,
    },
});

export default WelcomePopup;
