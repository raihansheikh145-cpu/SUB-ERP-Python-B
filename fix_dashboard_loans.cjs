const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/Dashboard.tsx', 'utf8');

const target = `  const upcomingPayments = useMemo(() => {
    return (store.loans || [])
      .filter((l: any) => l.status === 'ACTIVE')
      .flatMap((l: any) => {
        return (l.amortizationSchedule || [])
          .filter((e: any) => !l.paidPeriods?.includes(e.period) && new Date(e.date) <= new Date())
          .map((e: any) => ({
            ...e,
            loanNumber: l.number,
            loanName: l.name
          }));
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [store.loans]);`;

const replacement = `  const upcomingPayments = useMemo(() => {
    return (store.loans || [])
      .filter((l: any) => l.status === 'ACTIVE')
      .flatMap((l: any) => {
        const rawPaid = l.paidPeriods || l.paid_periods || [];
        const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
        return (l.amortizationSchedule || [])
          .filter((e: any) => !paidStr.includes(String(e.period)) && e.status !== 'PAID' && new Date(e.date) <= new Date())
          .map((e: any) => ({
            ...e,
            loanNumber: l.number,
            loanName: l.name
          }));
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [store.loans]);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('/app/applet/components/Dashboard.tsx', content);
    console.log("Fixed Dashboard upcoming payments!");
} else {
    console.log("Target not found in Dashboard.tsx!");
}
