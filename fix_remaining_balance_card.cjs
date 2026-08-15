const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

const target = `                                formatNumber((selectedLoan?.principalAmount || selectedLoan?.amount || 0) - (selectedLoan?.amortizationSchedule
                                  ?.filter((e: any) => selectedLoan.paidPeriods?.includes(e.period) || e.status === 'PAID')
                                  ?.reduce((sum: number, e: any) => sum + (e.principal || 0), 0) || 0))`;

const replacement = `                                (() => {
                                  const rawPaid = selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods || [];
                                  const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
                                  const totalPaid = (selectedLoan?.amortizationSchedule || [])
                                    .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
                                    .reduce((sum: number, e: any) => sum + (e.principal || 0), 0);
                                  return formatNumber((selectedLoan?.principalAmount || selectedLoan?.amount || 0) - totalPaid);
                                })()`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
    console.log("Fixed remaining balance card!");
} else {
    console.log("Target not found!");
}
