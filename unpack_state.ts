import * as fs from 'fs';
import * as path from 'path';

const dir = path.join(process.cwd(), 'src/store/modules');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Find all state keys and setters in this file (anything defined as `key: value,` or `key: (val) =>`)
    const keys = new Set<string>();
    const lines = content.split('\\n');
    lines.forEach(line => {
        const match = line.match(/^\\s*([a-zA-Z0-9_]+):\\s*(.*?)(?:,|$)/);
        if (match) {
            keys.add(match[1]);
        }
    });
    
    const keysArray = Array.from(keys).filter(k => k !== 'get_invoices' && k !== 'get_creditNotes');
    
    if (keysArray.length > 0) {
        const unpack = `    const { ${keysArray.join(', ')} } = state;\\n`;
        content = content.replace(/const state = get\(\);/g, `const state = get();\\n${unpack}`);
        fs.writeFileSync(p, content);
    }
});

console.log("Unpacked state to fix local references.");
