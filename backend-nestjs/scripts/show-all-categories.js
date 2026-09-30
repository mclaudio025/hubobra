const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    include: { parent: true },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
  });

  const tree = {};
  for (const c of categories) {
    const parentName = c.parent ? c.parent.name : "(CATEGORIA RAIZ)";
    if (!tree[parentName]) tree[parentName] = [];
    tree[parentName].push({
      id: c.id,
      name: c.name,
      description: c.description || ""
    });
  }

  for (const [parent, list] of Object.entries(tree)) {
    console.log(`\n========================================`);
    console.log(`📁 ${parent} (${list.length} itens)`);
    console.log(`========================================`);
    for (const item of list) {
      console.log(`  🔹 ${item.name}`);
      if (item.description) {
        console.log(`     📝 ${item.description.replace(/\n+/g, ' \n        ')}`);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
