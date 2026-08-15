const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /\{selectedLoan\?\.paidPeriods\?\.length\} of \{selectedLoan\?\.termMonths\} installments completed/g,
  `{(() => {
                              const rawPaid = selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods || [];
                              const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
                              const totalPeriods = selectedLoan?.termMonths || 1;
                              return \`\${paidStr.length} of \${totalPeriods} installments completed\`;
                            })()}`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Fixed installments text!');
