const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = [
      'docs_accounts', 'docs_journals', 'docs_journal_lines', 'docs_companies',
      'docs_users', 'docs_roles', 'docs_contacts', 'docs_products', 'docs_invoices',
      'docs_bills', 'docs_payments', 'docs_loans', 'docs_credit_notes', 
      'docs_inventory_adjustments', 'docs_payslips', 'docs_advance_salaries',
      'docs_brands', 'docs_categories', 'docs_attendance', 'docs_commission_targets',
      'docs_leaves', 'docs_tasks', 'docs_holidays', 'docs_inventory_transactions'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
        console.log(`Disabled RLS for ${table}`);
      } catch (e) {
        console.log(`Could not disable RLS for ${table}:`, e.message);
      }
    }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
