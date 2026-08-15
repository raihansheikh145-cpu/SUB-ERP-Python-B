const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM docs_accounts');
    console.log('Total accounts in DB:', Number(res[0].count));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
