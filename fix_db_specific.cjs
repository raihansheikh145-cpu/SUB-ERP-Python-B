const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:<SUPABASE_DB_PASSWORD>%40raihan@db.<SUPABASE_PROJECT_REF>.supabase.co:6543/postgres' });
  await client.connect();
  
  try {
      await client.query('BEGIN');
      
      const p13_journal_id = '918769e0-7336-4032-913f-a20ddaae7cae';
      
      await client.query(`UPDATE docs_journals SET status = 'DRAFT' WHERE id = $1`, [p13_journal_id]);
      await client.query(`UPDATE docs_journal_lines SET debit = 348000 WHERE journal_id = $1 AND debit = 448000`, [p13_journal_id]);
      await client.query(`UPDATE docs_journal_lines SET credit = 348000 WHERE journal_id = $1 AND credit = 448000`, [p13_journal_id]);
      await client.query(`UPDATE docs_journals SET status = 'POSTED' WHERE id = $1`, [p13_journal_id]);
      
      const loan_id = '5a957f4d-a520-4d6b-83b8-187070e49255';
      const { rows } = await client.query(`SELECT data, amortization_schedule FROM docs_loans WHERE id = $1`, [loan_id]);
      let loan = rows[0];
      let data = loan.data;
      data.status = 'PAID';
      
      let sched1 = data.amortizationSchedule || [];
      sched1.forEach(s => {
          if (s.period === 13) {
              s.principal = 348000;
              s.payment = 348000;
          }
      });
      data.amortizationSchedule = sched1;
      
      let sched2 = loan.amortization_schedule || [];
      sched2.forEach(s => {
          if (s.period === 13) {
              s.principal = 348000;
              s.payment = 348000;
          }
      });
      
      await client.query(`UPDATE docs_loans SET status = 'PAID', data = $1, amortization_schedule = $2 WHERE id = $3`, [data, JSON.stringify(sched2), loan_id]);
      
      const new_loan_id = 'loan-op-fix-5a957f4d';
      const company_id = 'comp-1';
      const contact_id = 'f751fbcf-e6f9-4399-aa69-50d492055ea4';
      const p_date = '2026-07-09';
      
      await client.query(`
      INSERT INTO docs_loans (
            id, company_id, loan_number, date, amount, status, name, type, 
            contact_id, start_date, term_months, interest_rate, interest_type, 
            principal_amount, updated_at, data
        ) VALUES (
            $1, $2, 'OP-LOAN-2494', $3, 100000, 'ACTIVE', 'Overpayment for FAHIM AHMAD (SE)', 
            'GIVEN',
            $4, $3, 1, 0, 'FIXED', 100000, NOW(),
            $5
        )
      `, [
          new_loan_id, company_id, p_date, contact_id,
          {
                number: 'OP-LOAN-2494',
                amount: 100000,
                principalAmount: 100000,
                type: 'GIVEN',
                status: 'ACTIVE',
                name: 'Overpayment for FAHIM AHMAD (SE)',
                contactId: contact_id,
                date: p_date,
                startDate: p_date,
                termMonths: 1,
                interestRate: 0,
                interestType: 'FIXED'
          }
      ]);
      
      const v_journal_id = 'JE-LOAN-' + new_loan_id.toUpperCase();
      const v_cash_acc = 'comp-1-100100'; // Cash account for comp-1
      const v_loan_acc = 'comp-1-100601'; // Loan Receivable account for comp-1
      
      await client.query(`
      INSERT INTO docs_journals (id, company_id, date, journal_date, journal_type, status, reference_number, updated_at)
      VALUES ($1, $2, $3, $3, 'LOAN', 'POSTED', 'OP-LOAN-2494', NOW())
      `, [v_journal_id, company_id, p_date]);
      
      await client.query(`
      INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, contact_id, debit, credit, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [v_journal_id+'-dr', v_journal_id, company_id, v_loan_acc, contact_id, 100000, 0, 'Loan Disbursement: Overpayment for FAHIM AHMAD (SE)']);
      
      await client.query(`
      INSERT INTO docs_journal_lines (id, journal_id, company_id, account_id, debit, credit, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [v_journal_id+'-cr', v_journal_id, company_id, v_cash_acc, 0, 100000, 'Loan Disbursement: Overpayment for FAHIM AHMAD (SE)']);
      
      await client.query('COMMIT');
      console.log("Fixed successfully.");
  } catch (e) {
      await client.query('ROLLBACK');
      console.error(e);
  } finally {
      await client.end();
  }
}
run();
