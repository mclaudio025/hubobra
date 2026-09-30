import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Total de Categorias Principais (Raiz): ${categories.length}\n`);

  for (const cat of categories) {
    const directProds = cat._count.products;
    const childrenProds = cat.children.reduce((sum, c) => sum + c._count.products, 0);
    const totalProds = directProds + childrenProds;
    
    console.log(`📂 [${cat.id}] "${cat.name}" (slug: ${cat.slug}) - Total Produtos: ${totalProds} (Diretos: ${directProds}, Filhos: ${childrenProds})`);
    if (cat.children.length > 0) {
      for (const child of cat.children) {
        console.log(`   └─ [${child.id}] "${child.name}" (slug: ${child.slug}) - Produtos: ${child._count.products}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
