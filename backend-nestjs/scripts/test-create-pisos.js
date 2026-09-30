const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
  const parent = await prisma.category.findFirst({
    where: { name: { contains: 'Pisos e Revestimentos', mode: 'insensitive' } }
  });
  console.log('Categoria Pai encontrada:', parent);

  // Checar se existe categoria com name "Pisos"
  const existing = await prisma.category.findMany({
    where: { name: { contains: 'Pisos', mode: 'insensitive' } }
  });
  console.log('Categorias com "Pisos" encontradas:', existing);

  // Testar criação
  try {
    const newCat = await prisma.category.create({
      data: {
        name: 'Pisos',
        parentId: parent.id,
        slug: 'pisos-sub',
        active: true,
        order: 0
      }
    });
    console.log('Categoria criada com sucesso:', newCat);
  } catch (err) {
    console.error('ERRO AO CRIAR:', err);
  }
}

testCreate()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
