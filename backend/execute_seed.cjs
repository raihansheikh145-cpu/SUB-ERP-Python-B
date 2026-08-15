const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to Prisma...');
    const sql = fs.readFileSync('seed_accounts.sql', 'utf-8');
    const statements = sql.split(/\r?\n/).filter(s => s.trim().length > 0);
    
    console.log(`Executing ${statements.length} statements...`);
    let count = 0;
    for (const stmt of statements) {
        try {
            const cleanStmt = stmt.trim().replace(/;$/, '');
            if (cleanStmt) {
                await prisma.$executeRawUnsafe(cleanStmt);
                count++;
            }
        } catch (e) {
            console.error('Error on statement:', stmt, '\\nError:', e);
        }
    }
    console.log(`Successfully executed ${count} statements.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
