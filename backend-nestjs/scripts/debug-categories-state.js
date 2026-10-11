const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const allCats = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const report = allCats.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    active: c.active,
    hasImage: !!c.image,
    imgType: !c.image ? 'NONE' : (c.image.startsWith('data:') ? 'BASE64 (' + c.image.length + ' chars)' : (c.image.includes('unsplash') ? 'UNSPLASH' : c.image.substring(0, 40))),
  }));

  fs.writeFileSync('category-report.json', JSON.stringify(report, null, 2));
  console.log('Report written with ' + report.length + ' categories');
}

main().catch(console.error).finally(() => prisma.$disconnect());
