const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

// Fix the progress width calculations
content = content.replace(
  /style=\{\{ width: \`\$\{\(\(Array\.isArray\(selectedLoan\?\.paidPeriods \|\| \(selectedLoan as any\)\?\.paid_periods\) \? \(selectedLoan\?\.paidPeriods \|\| \(selectedLoan as any\)\?\.paid_periods\)\.length : 0\) \/ \(selectedLoan\?\.termMonths \|\| 1\)\) \* 100\}%\` \}\}/g,
  `style={{ width: \`\${Math.min(100, (((Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1)) * 100))}%\` }}`
);

content = content.replace(
  /style=\{\{ width: \`\$\{\(1 - \(\(Array\.isArray\(selectedLoan\?\.paidPeriods \|\| \(selectedLoan as any\)\?\.paid_periods\) \? \(selectedLoan\?\.paidPeriods \|\| \(selectedLoan as any\)\?\.paid_periods\)\.length : 0\) \/ \(selectedLoan\?\.termMonths \|\| 1\)\)\) \* 100\}%\` \}\}/g,
  `style={{ width: \`\${Math.max(0, (1 - ((Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1))) * 100)}%\` }}`
);


fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Added Math.min/Math.max to progress bars!');
