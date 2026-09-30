import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_SLUGS = [
  'construcao-e-alvenaria',
  'hidraulica-e-encanamento',
  'eletrica-e-energia',
  'tintas-e-pintura',
  'ferramentas-maquinas-e-abrasivos',
  'pisos-revestimentos-e-acabamentos',
  'portas-janelas-e-ferragens',
  'iluminacao-e-lustres',
  'utilidades-casa-e-jardim',
];

async function main() {
  const masterCategories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: { in: MASTER_SLUGS } },
        { parent: { slug: { in: MASTER_SLUGS } } },
      ],
    },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  const masterIds = new Set(masterCategories.map((c) => c.id));

  const legacyProducts = await prisma.product.findMany({
    where: {
      categoryId: { notIn: Array.from(masterIds) },
    },
    include: {
      category: {
        include: { parent: true },
      },
    },
  });

  console.log(`Produtos em categorias legadas/antigas: ${legacyProducts.length}\n`);

  for (const p of legacyProducts) {
    const parentName = p.category?.parent?.name ? ` -> Pai: "${p.category.parent.name}"` : '';
    console.log(`- [${p.id}] "${p.name}" (SKU: ${p.sku}) | Categoria Atual: "${p.category?.name}"${parentName}`);
  }
}

main().finally(() => prisma.$disconnect());
