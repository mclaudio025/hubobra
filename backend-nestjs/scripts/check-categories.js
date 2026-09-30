const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total de categorias: ${categories.length}`);
  console.log('---------------------------------------------------------');
  for (const c of categories) {
    const parent = c.parent ? ` (Sub de: ${c.parent.name})` : ' [PRINCIPAL]';
    console.log(`- [${c.id}] ${c.name}${parent}`);
    console.log(`  Slug: "${c.slug}" | Ativa: ${c.active} | Produtos: ${c._count.products}`);
    if (c.description) {
      console.log(`  Descrição: ${c.description.replace(/\n+/g, ' | ')}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
