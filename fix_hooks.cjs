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
    let lines = content.split('\n');
    let modified = false;
    
    // Store trackers to keep the FIRST occurrence of each hook
    const foundHooks = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match const { ... } = useStore();
        const match = line.match(/^\s*const\s+\{([^}]+)\}\s*=\s*(use[A-Za-z]+Store)\(\);/);
        if (match) {
            const hookName = match[2];
            
            // If we already saw this hook in this file, it's likely inside an inner function
            if (foundHooks.has(hookName)) {
                console.log(`Fixing invalid hook call in ${file}:${i+1}`);
                lines[i] = `// REMOVED INVALID HOOK: ${line.trim()}`;
                modified = true;
            } else {
                foundHooks.add(hookName);
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, lines.join('\n'));
        console.log(`Saved ${file}`);
    }
});
