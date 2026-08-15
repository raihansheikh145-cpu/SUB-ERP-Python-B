import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

const target = `    const pageHeight = doc.internal.pageSize.height;
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });`;

content = content.replace(target, "    const pageHeight = doc.internal.pageSize.height;");

fs.writeFileSync('services/pdfService.ts', content);
console.log("Fixed 1175");
