import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');
content = content.replace(/doc\.internal\.pageSize\.getHeight\(\)/g, "doc.internal.pageSize.height");
fs.writeFileSync('services/pdfService.ts', content);
console.log("Replaced getHeight() with height");
