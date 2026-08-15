const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

const overdueTarget = `      const overdueAmount = activeLoans.reduce((sum: number, l: any) => {
        const today = new Date();
        const overdue = (l.amortizationSchedule || [])
          .filter((e: any) => !l.paidPeriods?.includes(e.period) && new Date(e.date) < today)
          .reduce((s: number, e: any) => s + ((e.principal || 0) + (e.interest || 0)), 0);
        return sum + overdue;
      }, 0);`;

const overdueReplacement = `      const overdueAmount = activeLoans.reduce((sum: number, l: any) => {
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

content = content.replace(overdueTarget, overdueReplacement);
fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Fixed overdue amount');
