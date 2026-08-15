import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

content = content.replace(/\n    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;/g, "");

fs.writeFileSync('services/pdfService.ts', content);
console.log("Undid the sed disaster");
