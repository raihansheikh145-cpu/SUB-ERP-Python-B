const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /const unpaidPrincipal = \(l\.amortizationSchedule \|\| \[\]\)\n\s*\.filter\(\(e: any\) => !l\.paidPeriods\?\.includes\(e\.period\)\)\n\s*\.reduce\(\(s: number, e: any\) => s \+ \(e\.principal \|\| 0\), 0\);/,
  `const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter((e: any) => l.paidPeriods?.includes(e.period) || e.status === 'PAID')
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const unpaidPrincipal = (l.principalAmount || l.amount || 0) - totalPaidPrincipal;`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Fixed totalExposure');
