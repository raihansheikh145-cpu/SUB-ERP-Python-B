const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const sql = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/d0adfb28-93b1-4f9d-b045-a65cba668aee/scratch/update_post_loan_payment.sql', 'utf8');
    await prisma.$executeRawUnsafe(sql);
    console.log('SQL Executed Successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
