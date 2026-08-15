import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

// Replace all the duplicate blocks
content = content.replace(/    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;\n    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;/g,
  `    });\n    const pageHeight = doc.internal.pageSize.height;`);
  
// Also clean up any other syntax errors around `format: 'a4',` that might have been duplicated
content = content.replace(/      format: 'a4',\n    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;\n    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;/g,
  `      format: 'a4',\n    });\n    const pageHeight = doc.internal.pageSize.height;`);

fs.writeFileSync('services/pdfService.ts', content);
console.log("Fixed duplicates");
