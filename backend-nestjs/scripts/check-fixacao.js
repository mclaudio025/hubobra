const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cats = await prisma.category.findMany({
    where: {
      parent: {
        name: { contains: "Fixação", mode: "insensitive" }
      }
    }
  });
  console.log(cats.map(c => ({ id: c.id, name: c.name, description: c.description })));
}

run().finally(() => prisma.$disconnect());
