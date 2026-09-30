const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany();
  console.log(`Verificando ${products.length} produtos...`);
  
  let fixedCount = 0;
  for (const p of products) {
    if (!p.slug || p.slug === 'undefined' || p.slug === 'null' || p.slug.trim() === '') {
      const generatedSlug = p.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const newSlug = generatedSlug || `produto-${p.id.slice(0, 8)}`;
      await prisma.product.update({
        where: { id: p.id },
        data: { slug: newSlug }
      });
      console.log(`Corrigido produto [${p.id}] "${p.name}": novo slug "${newSlug}"`);
      fixedCount++;
    }
  }

  console.log(`Total de produtos com slug corrigido: ${fixedCount}`);
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
