const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /const outstanding = \(loan\.principalAmount \|\| \(loan as any\)\.principal_amount \|\| \(loan as any\)\.amount \|\| 0\) - totalPaidPrincipal;/g,
  `const outstanding = Math.max(0, (loan.principalAmount || (loan as any).principal_amount || (loan as any).amount || 0) - totalPaidPrincipal);`
);

content = content.replace(
  /const outstanding = \(l\.principalAmount \|\| l\.amount \|\| 0\) - totalPaidPrincipal;/g,
  `const outstanding = Math.max(0, (l.principalAmount || l.amount || 0) - totalPaidPrincipal);`
);

content = content.replace(
  /return formatNumber\(\(selectedLoan\?\.principalAmount \|\| selectedLoan\?\.amount \|\| 0\) - totalPaid\);/g,
  `return formatNumber(Math.max(0, (selectedLoan?.principalAmount || selectedLoan?.amount || 0) - totalPaid));`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed negative outstanding in LoanManager");
