const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/Dashboard.tsx', 'utf8');

const target = `  const dueInstallments = activeLoans.flatMap((l: any) => 
    (l.amortizationSchedule || [])
      .filter((e: any) => !l.paidPeriods?.includes(e.period) && new Date(e.date) <= new Date())
      .map((e: any) => ({ ...e, loanName: l.name, loanId: l.id }))
  );`;

const rep = `  const dueInstallments = activeLoans.flatMap((l: any) => {
    const rawPaid = l.paidPeriods || l.paid_periods || [];
    const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
    return (l.amortizationSchedule || [])
      .filter((e: any) => !paidStr.includes(String(e.period)) && e.status !== 'PAID' && new Date(e.date) <= new Date())
      .map((e: any) => ({ ...e, loanName: l.name, loanId: l.id }));
  });`;

content = content.replace(target, rep);
fs.writeFileSync('/app/applet/components/Dashboard.tsx', content);
console.log("Fixed dashboard");
