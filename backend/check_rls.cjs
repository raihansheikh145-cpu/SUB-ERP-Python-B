const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.$queryRawUnsafe(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'docs_accounts';
    `);
    console.log(res);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
