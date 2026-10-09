const { PrismaClient } = require('../backend-nestjs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'Portas', mode: 'insensitive' } },
        { slug: { contains: 'portas', mode: 'insensitive' } },
        { name: { contains: 'Janelas', mode: 'insensitive' } },
        { name: { contains: 'Ferragens', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, slug: true, parentId: true, image: true, active: true }
  });
  console.log(JSON.stringify(cats, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
