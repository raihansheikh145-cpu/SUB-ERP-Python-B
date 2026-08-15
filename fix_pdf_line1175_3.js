import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

const t = "    const pageHeight = doc.internal.pageSize.height;\n\n) => {\n  try {\n    const doc = new jsPDF({\n      orientation: 'portrait',\n      unit: 'mm',\n      format: 'a4',\n    });";

const idx = content.indexOf(t);
if (idx !== -1) {
  content = content.substring(0, idx) + "    const pageHeight = doc.internal.pageSize.height;" + content.substring(idx + t.length);
  fs.writeFileSync('services/pdfService.ts', content);
  console.log("Fixed 1175 with substring including blank line");
} else {
  console.log("Not found again");
}
