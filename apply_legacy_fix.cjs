const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'components', 'features'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('// REMOVED INVALID HOOK:')) {
        // Add import
        if (!content.includes('getLegacyStore')) {
            const importStmt = "import { getLegacyStore } from '../../../store/legacyHelper';\n";
            // Insert after the last import, or at the top
            content = importStmt + content;
        }

        // Replace the removed hooks
        content = content.replace(/\/\/ REMOVED INVALID HOOK:\s*const\s+(\{[^}]+\})\s*=\s*use[A-Za-z]+Store\(\);/g, 'const $1 = getLegacyStore();');
        
        fs.writeFileSync(file, content);
        console.log(`Applied legacy fix to ${file}`);
    }
});
