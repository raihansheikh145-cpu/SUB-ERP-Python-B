const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /const rawPaid = selectedLoan\?\.paidPeriods \|\| \(selectedLoan as any\)\?\.paid_periods \|\| \[\];/g,
  `const rawPaid = (selectedLoan as any)?.paid_periods || selectedLoan?.paidPeriods || [];`
);

content = content.replace(
  /const rawPaid = loan\.paidPeriods \|\| \(loan as any\)\?\.paid_periods \|\| \[\];/g,
  `const rawPaid = (loan as any)?.paid_periods || loan?.paidPeriods || [];`
);

content = content.replace(
  /const rawPaid = loan\.paidPeriods \|\| loan\.paid_periods \|\| \[\];/g,
  `const rawPaid = (loan as any)?.paid_periods || loan?.paidPeriods || [];`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed LoanManager");
