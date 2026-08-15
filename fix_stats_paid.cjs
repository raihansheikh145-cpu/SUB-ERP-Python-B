const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

const target1 = `      const totalExposure = activeLoans.reduce((sum: number, l: any) => {
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter((e: any) => l.paidPeriods?.includes(e.period) || e.status === 'PAID')
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const unpaidPrincipal = (l.principalAmount || l.amount || 0) - totalPaidPrincipal;
        return sum + unpaidPrincipal;
      }, 0);`;

const rep1 = `      const totalExposure = activeLoans.reduce((sum: number, l: any) => {
        const rawPaid = l.paidPeriods || l.paid_periods || [];
        const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const unpaidPrincipal = (l.principalAmount || l.amount || 0) - totalPaidPrincipal;
        return sum + unpaidPrincipal;
      }, 0);`;

const target2 = `      const overdueAmount = activeLoans.reduce((sum: number, l: any) => {
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter((e: any) => l.paidPeriods?.includes(e.period) || e.status === 'PAID')
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const outstanding = (l.principalAmount || l.amount || 0) - totalPaidPrincipal;
        if (outstanding <= 0) return sum;

        const today = new Date();
        const overdue = (l.amortizationSchedule || [])
          .filter((e: any) => !l.paidPeriods?.includes(e.period) && new Date(e.date) < today)
          .reduce((s: number, e: any) => s + ((e.principal || 0) + (e.interest || 0)), 0);
        return sum + overdue;
      }, 0);`;

const rep2 = `      const overdueAmount = activeLoans.reduce((sum: number, l: any) => {
        const rawPaid = l.paidPeriods || l.paid_periods || [];
        const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const outstanding = (l.principalAmount || l.amount || 0) - totalPaidPrincipal;
        if (outstanding <= 0) return sum;

        const today = new Date();
        const overdue = (l.amortizationSchedule || [])
          .filter((e: any) => !paidStr.includes(String(e.period)) && new Date(e.date) < today && e.status !== 'PAID')
          .reduce((s: number, e: any) => s + ((e.principal || 0) + (e.interest || 0)), 0);
        return sum + overdue;
      }, 0);`;

const target3 = `        totalInterest: activeLoans.reduce((sum: number, l: any) => {
          const remainingInterest = (l.amortizationSchedule || [])
            .filter((e: any) => !l.paidPeriods?.includes(e.period))
            .reduce((s: number, e: any) => s + (e.interest || 0), 0);
          return sum + remainingInterest;
        }, 0)`;

const rep3 = `        totalInterest: activeLoans.reduce((sum: number, l: any) => {
          const rawPaid = l.paidPeriods || l.paid_periods || [];
          const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
          const remainingInterest = (l.amortizationSchedule || [])
            .filter((e: any) => !paidStr.includes(String(e.period)) && e.status !== 'PAID')
            .reduce((s: number, e: any) => s + (e.interest || 0), 0);
          return sum + remainingInterest;
        }, 0)`;


content = content.replace(target1, rep1);
content = content.replace(target2, rep2);
content = content.replace(target3, rep3);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed stats section");
