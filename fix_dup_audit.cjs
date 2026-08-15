const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Remove duplicate audit_log lines - keep only one per occurrence
const lines = content.split('\n');
const result = [];
let prevWasAuditLog = false;

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'audit_log  Json?') {
        if (!prevWasAuditLog) {
            result.push(line);
            prevWasAuditLog = true;
        }
        // Skip duplicate
    } else {
        prevWasAuditLog = false;
        result.push(line);
    }
}

fs.writeFileSync('prisma/schema.prisma', result.join('\n'));
console.log('Fixed duplicate audit_log fields.');
