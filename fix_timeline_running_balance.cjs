const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /\{formatNumber\(isPaid \|\| isPrincipalPaid \? Math\.max\(0, runningBalance - \(entry\.principal \|\| 0\)\) : entry\.balance\)\}/,
  `{(() => {
                                      if (isPaid || isPrincipalPaid) {
                                        runningBalance -= (entry.principal || 0);
                                      } else {
                                        // If this entry isn't paid, we just show the remaining running balance minus this principal for projection
                                        runningBalance -= (entry.principal || 0);
                                      }
                                      return formatNumber(Math.max(0, runningBalance));
                                  })()}`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log("Fixed running balance calculation");
