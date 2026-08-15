const fs = require('fs');
let content = fs.readFileSync('/app/applet/services/db.ts', 'utf8');

content = content.replace(
  `payload.paid_periods = cleanDoc.paidPeriods || [];`,
  `payload.paid_periods = cleanDoc.paid_periods || cleanDoc.paidPeriods || [];`
);

content = content.replace(
  `payload.amortization_schedule = cleanDoc.amortizationSchedule || [];`,
  `payload.amortization_schedule = cleanDoc.amortization_schedule || cleanDoc.amortizationSchedule || [];`
);

fs.writeFileSync('/app/applet/services/db.ts', content);
console.log("Fixed db.ts");
