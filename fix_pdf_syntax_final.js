import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

// I will find the EXACT index and splice the string.
const startMarker = 'export const generateInventoryAdjustmentPDF = (';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) throw new Error("not found");

const nextFunctionMarker = 'export const';
const nextIndex = content.indexOf(nextFunctionMarker, startIndex + startMarker.length);

const endTryMarker = '  } catch (error) {';
// actually let me just regex replace the messed up part
content = content.replace(/  printedBy\?: string\n\) => \{\n  try \{\n    const doc = new jsPDF\(\{\n      orientation: 'portrait',\n      unit: 'mm',\n      format: 'a4',\n    \}\);\n    const pageHeight = doc\.internal\.pageSize\.height;\n\) => \{\n  try \{\n    const doc = new jsPDF\(\{\n      orientation: 'portrait',\n      unit: 'mm',\n      format: 'a4',/g,
  `  printedBy?: string\n) => {\n  try {\n    const doc = new jsPDF({\n      orientation: 'portrait',\n      unit: 'mm',\n      format: 'a4',`);

fs.writeFileSync('services/pdfService.ts', content);
console.log("Syntax fixed finally");
