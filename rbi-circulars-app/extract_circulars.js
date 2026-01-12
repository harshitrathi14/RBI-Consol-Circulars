const circulars = require('./src/data/circulars.json');

// Extract unique circulars by filename
const uniqueCirculars = {};
circulars.forEach(chunk => {
    if (!uniqueCirculars[chunk.filename]) {
        uniqueCirculars[chunk.filename] = {
            filename: chunk.filename,
            title: chunk.circular_title || chunk.filename.replace('.pdf', ''),
            category: chunk.category || 'General'
        };
    }
});

// Convert to array and sort
const circularsList = Object.values(uniqueCirculars).sort((a, b) => 
    a.title.localeCompare(b.title)
);

console.log(JSON.stringify(circularsList, null, 2));
