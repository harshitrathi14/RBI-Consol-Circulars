import sectionsData from '../data/sections.json';

// Get all sections
export const getAllSections = () => {
    return sectionsData;
};

// Get section by ID
export const getSectionById = (id) => {
    return sectionsData.find(section => section.id === id);
};

// Get all unique tags
export const getAllTags = () => {
    const tags = new Set();
    sectionsData.forEach(section => {
        section.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
};

// Get sections by tag
export const getSectionsByTag = (tag) => {
    if (!tag || tag === 'all') return sectionsData;
    return sectionsData.filter(section =>
        section.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
};

// Search sections
export const searchSections = (query) => {
    if (!query || query.trim().length < 2) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 1);

    const results = sectionsData.map(section => {
        let score = 0;
        const titleLower = section.title?.toLowerCase() || '';
        const functionLower = section.function?.toLowerCase() || '';
        const deepDiveLower = section.deep_dive?.toLowerCase() || '';

        searchTerms.forEach(term => {
            // Title matches score highest
            if (titleLower.includes(term)) score += 10;
            // Function matches
            if (functionLower.includes(term)) score += 5;
            // Deep dive matches
            if (deepDiveLower.includes(term)) score += 3;
            // Actions matches
            section.actions?.forEach(action => {
                if (action.toLowerCase().includes(term)) score += 2;
            });
            // Tags matches
            section.tags?.forEach(tag => {
                if (tag.toLowerCase().includes(term)) score += 4;
            });
        });

        return { ...section, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

    return results;
};

// Get featured/important sections for home screen
export const getFeaturedSections = () => {
    const featuredIds = ['sbr', 'governance', 'capital-adequacy', 'kyc', 'irac', 'alm'];
    return featuredIds
        .map(id => sectionsData.find(s => s.id === id))
        .filter(Boolean);
};

// Get stats for dashboard
export const getStats = () => {
    let totalActions = 0;
    let totalControls = 0;
    let totalRCSA = 0;

    sectionsData.forEach(section => {
        totalActions += section.actions?.length || 0;
        totalControls += section.controls?.length || 0;
        totalRCSA += section.rcsa?.length || 0;
    });

    return {
        totalSections: sectionsData.length,
        totalActions,
        totalControls,
        totalRCSA,
        tags: getAllTags(),
    };
};

export default {
    getAllSections,
    getSectionById,
    getAllTags,
    getSectionsByTag,
    searchSections,
    getFeaturedSections,
    getStats,
};
