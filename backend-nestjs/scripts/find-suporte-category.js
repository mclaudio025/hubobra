const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cats = await prisma.category.findMany({
    where: { active: true },
    include: { parent: true },
  });

  console.log("Categorias disponíveis:");
  cats.forEach(c => {
    const p = c.parent ? ` (Sub de: ${c.parent.name})` : ' [RAIZ]';
    console.log(`- ${c.name}${p}`);
  });
}

run().finally(() => prisma.$disconnect());
