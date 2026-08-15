import * as fs from 'fs';
import * as path from 'path';

const dir = path.join(process.cwd(), 'src/store/modules');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

const map: Record<string, string> = {};

files.forEach(file => {
    const p = path.join(dir, file);
    const content = fs.readFileSync(p, 'utf8');
    const storeName = file.replace('.ts', '');
    
    const lines = content.split('\\n');
    lines.forEach(line => {
        const match = line.match(/^\\s*([a-zA-Z0-9_]+):\\s*(.*?)(?:,|$)/);
        if (match) {
            map[match[1]] = storeName;
            if (match[1].startsWith('get_')) {
                map[match[1].replace('get_', '')] = storeName;
            }
        }
    });
});

fs.writeFileSync('store_map.json', JSON.stringify(map, null, 2));
console.log("Generated store_map.json");
