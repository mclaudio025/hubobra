const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, icon: true, active: true },
    orderBy: { name: 'asc' }
  });
  console.log('Total de categorias:', cats.length);
  console.log(JSON.stringify(cats, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
