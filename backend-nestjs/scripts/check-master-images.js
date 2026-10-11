const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const masters = await prisma.category.findMany({
    where: { parentId: null }
  });

  const info = masters.map(m => ({
    name: m.name,
    slug: m.slug,
    id: m.id,
    imgPrefix: m.image ? m.image.substring(0, 50) : null,
    imgLength: m.image ? m.image.length : 0,
    isValid: m.image ? (m.image.startsWith('data:image/') || m.image.startsWith('http')) : false
  }));

  fs.writeFileSync('master-images-info.json', JSON.stringify(info, null, 2));
  console.log('Saved master-images-info.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
