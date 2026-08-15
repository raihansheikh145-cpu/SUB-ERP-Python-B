const fs = require('fs');
let code = fs.readFileSync('services/pdfService.ts', 'utf8');

const footerIndex = code.indexOf('// Footer\n    doc.setFontSize(7);');
if (footerIndex !== -1) {
  const auditLogCode = `
    // Audit Log (Messages)
    if (invoice.messages && invoice.messages.length > 0) {
        const notifications = invoice.messages.filter((m: any) => m.type === 'notification');
        if (notifications.length > 0) {
            currentY += 10;
            doc.setFontSize(8);
            doc.setTextColor(slate400[0], slate400[1], slate400[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('AUDIT LOG (DRAFT CHANGES)', 12, currentY);
            currentY += 4;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(slate600[0], slate600[1], slate600[2]);
            
            notifications.forEach((msg: any) => {
                const authorName = (employees || []).find((e: any) => e.id === msg.authorId)?.name || 'System User';
                const dateStr = formatDateTime(msg.date);
                const logLine = \`\${dateStr} - \${authorName}: \${msg.body}\`;
                
                const logLines = doc.splitTextToSize(logLine, doc.internal.pageSize.width - 24);
                
                if (currentY + (logLines.length * 3) > (pageHeight - bottomMargin)) {
                    doc.addPage();
                    currentY = 20;
                }
                
                doc.text(logLines, 12, currentY);
                currentY += (logLines.length * 3) + 1;
            });
        }
    }
    
    `;
  
  code = code.substring(0, footerIndex) + auditLogCode + code.substring(footerIndex);
  fs.writeFileSync('services/pdfService.ts', code);
  console.log('Patched pdfService for Audit Log');
} else {
  console.log('Footer index not found');
}
