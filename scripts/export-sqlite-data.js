const path = require('path');
const { PrismaClient } = require('../backend-nestjs/prisma/sqlite-client');

process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../backend-nestjs/prisma/dev.db')}`;

const prisma = new PrismaClient();

async function main() {
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const imagesCount = await prisma.productImage.count();
    const bannersCount = await prisma.banner.count();

    console.log(`📦 dev.db tem:`);
    console.log(`- Produtos: ${productsCount}`);
    console.log(`- Categorias: ${categoriesCount}`);
    console.log(`- Imagens de Produtos: ${imagesCount}`);
    console.log(`- Banners: ${bannersCount}`);

    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: { images: true, category: true }
    });
    console.log('\nExemplo de produtos encontrados:');
    sampleProducts.forEach(p => {
      console.log(`- ${p.name} (R$ ${p.price}) | Imagens: ${p.images.length} | Cat: ${p.category?.name}`);
      if (p.images.length > 0) {
        console.log(`  URLs:`, p.images.map(i => i.url));
      }
    });

  } catch (err) {
    console.error('Erro ao ler dev.db:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
