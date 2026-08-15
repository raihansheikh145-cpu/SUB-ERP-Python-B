const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/LoanManager.tsx', 'utf8');

content = content.replace(
  /<p className="text-sm font-bold text-slate-800">\n\s*\{selectedLoan\?\.paidPeriods\?\.length\} of \{selectedLoan\?\.termMonths\} installments completed\n\s*<\/p>/g,
  `<p className="text-sm font-bold text-slate-800">
                            {(() => {
                              const rawPaid = selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods || [];
                              const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
                              const totalPeriods = selectedLoan?.termMonths || 1;
                              return \`\${paidStr.length} of \${totalPeriods} installments completed\`;
                            })()}
                          </p>`
);

content = content.replace(
  /style=\{\{ width: \`\$\{\(\(selectedLoan\?\.paidPeriods\?\.length \|\| 0\) \/ \(selectedLoan\?\.termMonths \|\| 1\)\) \* 100\}%\` \}\}/g,
  `style={{ width: \`\${((Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1)) * 100}%\` }}`
);

content = content.replace(
  /style=\{\{ width: \`\$\{\(1 - \(selectedLoan\?\.paidPeriods\?\.length \|\| 0\) \/ \(selectedLoan\?\.termMonths \|\| 1\)\) \* 100\}%\` \}\}/g,
  `style={{ width: \`\${(1 - ((Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1))) * 100}%\` }}`
);


// And fix the "Total Paid" card just to be safe
content = content.replace(
  /formatNumber\(selectedLoan\?\.amortizationSchedule\n\s*\.filter\(\(e: any\) => selectedLoan\.paidPeriods\?\.includes\((e\.period|Number\(e\.period\)|String\(e\.period\))\)\)\n\s*\.reduce\(\(sum: number, e: any\) => sum \+ e\.principal, 0\) \|\| 0\)/g,
  `(() => {
                                  const rawPaid = selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods || [];
                                  const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
                                  const totalPaid = (selectedLoan?.amortizationSchedule || [])
                                    .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
                                    .reduce((sum: number, e: any) => sum + (e.principal || 0), 0);
                                  return formatNumber(totalPaid);
                                })()`
);

content = content.replace(
  /formatNumber\(selectedLoan\?\.amortizationSchedule\n\s*\.filter\(\(e: any\) => selectedLoan\.paidPeriods\?\.includes\(e\.period\)\)\n\s*\.reduce\(\(sum: number, e: any\) => sum \+ e\.principal, 0\) \|\| 0\)/g,
  `(() => {
                                  const rawPaid = selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods || [];
                                  const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
                                  const totalPaid = (selectedLoan?.amortizationSchedule || [])
                                    .filter((e: any) => paidStr.includes(String(e.period)) || e.status === 'PAID')
                                    .reduce((sum: number, e: any) => sum + (e.principal || 0), 0);
                                  return formatNumber(totalPaid);
                                })()`
);

fs.writeFileSync('/app/applet/components/LoanManager.tsx', content);
console.log('Fixed cards logic!');
