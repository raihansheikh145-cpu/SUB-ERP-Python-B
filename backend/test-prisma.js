const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const rows = await prisma.$queryRaw`
        SELECT 
            p.id,
            COALESCE(p.category, 'Uncategorized') as category,
            COALESCE(p.brand, 'No Brand') as brand,
            COALESCE(p.price, 0) as price,
            COALESCE(p.cost_price, 0) as fallback_cost
        FROM docs_products p
        LIMIT 1
    `;
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
