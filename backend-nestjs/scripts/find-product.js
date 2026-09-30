const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'cimento', mode: 'insensitive' } },
        { name: { contains: 'poty', mode: 'insensitive' } },
        { description: { contains: 'cimento', mode: 'insensitive' } },
        { description: { contains: 'poty', mode: 'insensitive' } }
      ]
    },
    include: { category: true }
  });
  console.log(`Encontrados no Banco: ${products.length}`);
  for (const p of products) {
    console.log(`- ID: ${p.id}`);
    console.log(`  Nome: "${p.name}"`);
    console.log(`  Slug: "${p.slug}"`);
    console.log(`  SKU: "${p.sku}"`);
    console.log(`  Barcode: "${p.barcode}"`);
    console.log(`  Ativo: ${p.active} | Destaque: ${p.featured} | Estoque: ${p.stock}`);
    console.log(`  Categoria: ${p.category ? p.category.name : 'SEM CATEGORIA'} (${p.categoryId})`);
    console.log(`  StoreId: ${p.storeId}`);
    console.log(`  Created: ${p.createdAt}`);
  }

  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, active: true, categoryId: true, storeId: true }
  });
  console.log(`\nTotal geral de produtos no banco: ${allProducts.length}`);
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
