const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:sk445%40raihan@db.buspgzsamhfmjrmmwpmo.supabase.co:6543/postgres' });
  await client.connect();
  const loanId = '5a957f4d-a520-4d6b-83b8-187070e49255';
  const journalId = '918769e0-7336-4032-913f-a20ddaae7cae';
  
  const { rows } = await client.query(`SELECT data FROM docs_loans WHERE id = $1`, [loanId]);
  const loanData = rows[0].data;
  
  // Check if journal already in schedule
  const exists = loanData.amortizationSchedule?.some(e => e.journalEntryId === journalId);
  if (!exists) {
    const newEntry = {
      date: '2026-07-09',
      period: 13,
      status: 'PAID',
      balance: 0,
      payment: 448000,
      interest: 0,
      principal: 448000,
      interestPaid: false,
      principalPaid: true,
      journalEntryId: journalId
    };
    
    loanData.amortizationSchedule = loanData.amortizationSchedule || [];
    loanData.amortizationSchedule.push(newEntry);
    
    if (loanData.amortization_schedule) {
       loanData.amortization_schedule.push(newEntry);
    }
    
    loanData.paidPeriods = loanData.paidPeriods || [];
    if (!loanData.paidPeriods.includes(13)) loanData.paidPeriods.push(13);
    
    loanData.paid_periods = loanData.paid_periods || [];
    if (!loanData.paid_periods.includes(13)) loanData.paid_periods.push(13);
    
    await client.query(`UPDATE docs_loans SET data = $1 WHERE id = $2`, [loanData, loanId]);
    console.log("Added 448,000 payment to amortization schedule");
  } else {
    console.log("Already exists");
  }
  
  await client.end();
}
run();
