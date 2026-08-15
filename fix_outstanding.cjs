const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /const outstanding = \(loan\.amortizationSchedule \|\| \(loan as any\)\.amortization_schedule \|\| \[\]\)\n\s*\.filter\(\(e: any\) => !paidStr\.includes\(String\(e\.period\)\)\)\n\s*\.reduce\(\(s: number, e: any\) => s \+ \(e\.principal \|\| 0\), 0\);/,
  `const totalPaidPrincipal = (loan.amortizationSchedule || (loan as any).amortization_schedule || [])
                        .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
                        .reduce((s: number, e: any) => s + (e.principal || 0), 0);
                      const outstanding = (loan.principalAmount || (loan as any).principal_amount || loan.amount || 0) - totalPaidPrincipal;`
);

content = content.replace(
  /formatNumber\(selectedLoan\?\.amortizationSchedule\n\s*\.filter\(\(e: any\) => !selectedLoan\.paidPeriods\?\.includes\((e\.period|Number\(e\.period\)|String\(e\.period\))\)\)\n\s*\.reduce\(\(sum: number, e: any\) => sum \+ e\.principal, 0\) \|\| 0\)/,
  `formatNumber((selectedLoan?.principalAmount || selectedLoan?.amount || 0) - (selectedLoan?.amortizationSchedule
                                  ?.filter((e: any) => selectedLoan.paidPeriods?.includes(e.period) || e.status === 'PAID')
                                  ?.reduce((sum: number, e: any) => sum + (e.principal || 0), 0) || 0))`
);

content = content.replace(
  /formatNumber\(selectedLoan\?\.amortizationSchedule\n\s*\.filter\(\(e: any\) => !selectedLoan\.paidPeriods\?\.includes\(e\.period\)\)\n\s*\.reduce\(\(sum: number, e: any\) => sum \+ e\.principal, 0\) \|\| 0\)/,
  `formatNumber((selectedLoan?.principalAmount || selectedLoan?.amount || 0) - (selectedLoan?.amortizationSchedule
                                  ?.filter((e: any) => selectedLoan.paidPeriods?.includes(e.period) || e.status === 'PAID')
                                  ?.reduce((sum: number, e: any) => sum + (e.principal || 0), 0) || 0))`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Fixed outstanding calculations in LoanManager.tsx');
