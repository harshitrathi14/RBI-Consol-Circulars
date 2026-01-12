import circularsData from '../data/circulars.json';

// Simple TF-IDF like scoring or just Keyword matching
// Since we can't easily install 'lunr' without npm, we'll write a simple search function.

const searchCirculars = async (query, category = null) => {
    return new Promise((resolve) => {
        // Simulate async delay for better UX
        setTimeout(() => {
            if (!query) {
                resolve({ answer: "Please ask a question.", sources: [] });
                return;
            }

            const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);

            const results = circularsData.map(chunk => {
                let score = 0;
                const textLower = chunk.text.toLowerCase();
                const titleLower = (chunk.circular_title || "").toLowerCase();

                terms.forEach(term => {
                    // Title matches weigh more
                    if (titleLower.includes(term)) score += 5;
                    // Content matches
                    if (textLower.includes(term)) score += 1;
                });

                // Category filter
                if (category && category !== 'All Categories' && chunk.category !== category) {
                    score = 0;
                }

                return { ...chunk, score };
            })
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); // Top 5 results

            // Construct an "Answer"
            let answer = "";
            if (results.length > 0) {
                answer = `I found ${results.length} relevant sections based on your query. Here are the top results from the circulars:`;
            } else {
                answer = "I couldn't find any specific circulars matching your query. Please try different keywords.";
            }

            resolve({
                answer,
                sources: results.map(r => ({
                    filename: r.filename,
                    chunk_preview: r.text.substring(0, 150) + "...",
                    circular_title: r.circular_title,
                    category: r.category
                }))
            });
        }, 500);
    });
};

const getCategories = async () => {
    // Extract unique categories from data
    const categories = [...new Set(circularsData.map(item => item.category))];
    return categories.filter(c => c); // Remove null/undefined
};

// Export matching the previous API signature
export { searchCirculars as queryCirculars, getCategories };
export const healthCheck = async () => ({ status: "offline_ready" });
