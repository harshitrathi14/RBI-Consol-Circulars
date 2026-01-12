// Theme constants for consistent styling across the app

export const COLORS = {
    // Primary colors
    primary: '#1E3A8A',        // Dark blue
    primaryLight: '#3B82F6',   // Light blue
    primaryDark: '#1E40AF',    // Darker blue

    // Accent colors
    accent: '#F59E0B',         // Amber/Gold
    accentLight: '#FCD34D',

    // Background colors
    background: '#F8FAFC',     // Light gray
    surface: '#FFFFFF',        // White
    surfaceAlt: '#F1F5F9',     // Slightly darker

    // Text colors
    text: '#1E293B',           // Dark slate
    textSecondary: '#64748B',  // Medium slate
    textLight: '#94A3B8',      // Light slate
    textOnPrimary: '#FFFFFF',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Border colors
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Tag colors
    tagFramework: '#DBEAFE',
    tagGovernance: '#FEF3C7',
    tagPrudential: '#D1FAE5',
    tagLending: '#FCE7F3',
    tagCustomer: '#E0E7FF',
    tagConduct: '#FEE2E2',
    tagLiability: '#CFFAFE',
};

export const FONTS = {
    regular: {
        fontWeight: '400',
    },
    medium: {
        fontWeight: '500',
    },
    semiBold: {
        fontWeight: '600',
    },
    bold: {
        fontWeight: '700',
    },
};

export const SIZES = {
    // Font sizes
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        base: 16,
        lg: 20,
        xl: 24,
        xxl: 32,
    },

    // Border radius
    radius: {
        sm: 6,
        md: 10,
        lg: 16,
        xl: 24,
        full: 9999,
    },
};

export const SHADOWS = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};

// Tag color mapping
export const getTagColor = (tag) => {
    const tagColors = {
        framework: COLORS.tagFramework,
        governance: COLORS.tagGovernance,
        prudential: COLORS.tagPrudential,
        lending: COLORS.tagLending,
        customer: COLORS.tagCustomer,
        conduct: COLORS.tagConduct,
        liability: COLORS.tagLiability,
    };
    return tagColors[tag?.toLowerCase()] || COLORS.surfaceAlt;
};

export default { COLORS, FONTS, SIZES, SHADOWS, getTagColor };
