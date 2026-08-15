const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const { rows } = await client.query(`SELECT data FROM docs_loans WHERE data->>'number' = 'LOAN-2494'`);
  const loan = rows[0].data;
  const rawPaidPeriods = loan.paidPeriods || loan.paid_periods || [];
  const paidStr = Array.isArray(rawPaidPeriods) ? rawPaidPeriods.map(String) : [];
  const sched = loan.amortizationSchedule || loan.amortization_schedule || [];
  
  const paidEntries = sched.filter(e => paidStr.includes(String(e.period)) || e.status === 'PAID');
  const totalPaidPrincipal = paidEntries.reduce((s, e) => s + (e.principal || 0), 0);
  const outstanding = (loan.principalAmount || loan.principal_amount || loan.amount || 0) - totalPaidPrincipal;

  console.log("paidStr:", paidStr);
  console.log("paidEntries principals:", paidEntries.map(e => e.principal));
  console.log("totalPaidPrincipal:", totalPaidPrincipal);
  console.log("outstanding:", outstanding);

  await client.end();
}
run().catch(console.error);
