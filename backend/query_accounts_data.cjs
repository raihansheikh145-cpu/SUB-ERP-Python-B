const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.$queryRawUnsafe("SELECT data FROM docs_accounts WHERE data->>'code' = '100100' LIMIT 1");
    console.log(JSON.stringify(res, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
