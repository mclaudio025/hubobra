const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      updatedAt: true,
      image: true
    }
  });

  console.log('Most recently updated categories:');
  cats.slice(0, 15).forEach(c => {
    const imgInfo = c.image ? (c.image.startsWith('data:') ? 'BASE64(' + c.image.length + ')' : c.image.substring(0, 30)) : 'NULL';
    console.log(c.updatedAt.toISOString(), '|', c.name, '|', c.slug, '| parent:', c.parentId ? 'YES' : 'ROOT', '| img:', imgInfo);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
