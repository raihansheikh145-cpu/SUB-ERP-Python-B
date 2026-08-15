import fs from 'fs';
let content = fs.readFileSync('services/pdfService.ts', 'utf8');

const target = `  printedBy?: string
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageHeight = doc.internal.pageSize.height;
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',`;

const replacement = `  printedBy?: string
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageHeight = doc.internal.pageSize.height;`;

content = content.replace(target, replacement);
fs.writeFileSync('services/pdfService.ts', content);
console.log("Syntax fixed properly");
