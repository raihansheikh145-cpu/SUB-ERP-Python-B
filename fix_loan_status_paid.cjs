const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /const isPaid = \(selectedLoan\?\.paidPeriods \|\| selectedLoan\?\.paid_periods \|\| \[\]\)\.map\(String\)\.includes\(String\(entry\.period\)\) \|\| entry\.status === 'PAID';/,
  `const isPaid = (selectedLoan?.paidPeriods || selectedLoan?.paid_periods || []).map(String).includes(String(entry.period)) || entry.status === 'PAID' || selectedLoan?.status === 'PAID';`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed isPaid logic for fully paid loan");
