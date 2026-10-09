const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

const PORTAS_IMAGE = 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80';

async function main() {
  console.log('--- Atualizando imagem da categoria Portas e Janelas ---');
  
  // Atualiza a categoria pai (Portas, Janelas e Ferragens)
  const r1 = await prisma.category.updateMany({
    where: {
      OR: [
        { id: '14ad9d59-0f62-45d2-b9f3-b76c466ecce0' },
        { slug: 'portas-janelas-e-ferragens' },
        { id: '83b2e9b3-6cc1-4878-bf19-d0b9f940ab44' },
        { slug: 'portas-e-janelas' }
      ]
    },
    data: {
      image: PORTAS_IMAGE
    }
  });

  console.log(`✓ ${r1.count} categorias de Portas e Janelas atualizadas para a foto correta de portas/esquadrias!`);
  
  const results = await prisma.category.findMany({
    where: {
      OR: [
        { slug: 'portas-janelas-e-ferragens' },
        { slug: 'portas-e-janelas' }
      ]
    },
    select: { id: true, name: true, slug: true, image: true }
  });
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
