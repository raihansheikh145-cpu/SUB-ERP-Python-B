const fs = require('fs');
const path = require('path');

let count = 0;
function searchFiles(dir, filter, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            searchFiles(filePath, filter, callback);
        } else if (filter.test(filePath)) {
            count++;
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes('.data') || content.includes('["data"]') || content.includes("['data']")) {
                callback(filePath, content);
            }
        }
    }
}

let foundCount = 0;
searchFiles('frontend/src', /\.(tsx|ts)$/, (filePath, content) => {
    foundCount++;
    console.log(`FOUND IN: ${filePath}`);
});

console.log(`Scanned ${count} files. Found data usages in ${foundCount} files.`);
