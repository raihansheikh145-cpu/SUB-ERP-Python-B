import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');
content = content.replace("  const pageHeight = doc.internal.pageSize.height;\n  printedBy?: string", "  printedBy?: string\n) => {\n  try {\n    const doc = new jsPDF({\n      orientation: 'portrait',\n      unit: 'mm',\n      format: 'a4',\n    });\n    const pageHeight = doc.internal.pageSize.height;\n");
fs.writeFileSync('services/pdfService.ts', content);
console.log("Syntax fixed");
