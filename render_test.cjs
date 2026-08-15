const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT id, data FROM docs_loans WHERE data->>'number' = 'LOAN-2494'`);
  const loan = { ...rows[0].data, ...rows[0] };
  
  const rawPaid = loan.paidPeriods || loan.paid_periods || [];
  const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
  const totalPaid = (loan.amortizationSchedule || [])
    .filter(e => paidStr.includes(String(e.period)) || e.status === 'PAID')
    .reduce((sum, e) => sum + (e.principal || 0), 0);
  
  const outstanding = (loan.principalAmount || loan.amount || 0) - totalPaid;
  
  console.log("Total Paid:", totalPaid);
  console.log("Outstanding:", outstanding);
  console.log("Paid Str:", paidStr);
  
  await client.end();
}
run();
