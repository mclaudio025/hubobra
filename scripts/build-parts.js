const fs = require('fs');
const path = require('path');

const minified = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'minified-catalog.json'), 'utf-8'));

function generateScript(items, partNum, totalParts) {
  return `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const data = ${JSON.stringify(items)};

function slugify(t) {
  return t.toString().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().replace(/\\s+/g, '-').replace(/[^\\w\\-]+/g, '').replace(/\\-\\-+/g, '-');
}

async function main() {
  console.log('🚀 Importando Parte ${partNum}/${totalParts} (' + data.length + ' produtos com fotos)...');
  const store = await prisma.store.findFirst({ where: { slug: 'matriz' } });
  if (!store) { console.error('Loja matriz não encontrada'); return; }

  for (let idx = 0; idx < data.length; idx++) {
    const item = data[idx];
    const catSlug = slugify(item.c || 'Geral');
    const cat = await prisma.category.upsert({
      where: { slug: catSlug },
      update: { name: item.c, active: true, storeId: store.id },
      create: { name: item.c, slug: catSlug, active: true, storeId: store.id }
    });

    const sku = item.s || ('SKU-' + slugify(item.n).substring(0, 15).toUpperCase());
    const prod = await prisma.product.upsert({
      where: { sku: sku },
      update: {
        name: item.n,
        price: Number(item.p || 0),
        stock: Number(item.st || 100),
        unit: item.u || 'UN',
        brand: item.b || null,
        active: true,
        featured: ${partNum === 1} && idx < 12,
        categoryId: cat.id,
        storeId: store.id
      },
      create: {
        name: item.n,
        sku: sku,
        price: Number(item.p || 0),
        stock: Number(item.st || 100),
        unit: item.u || 'UN',
        brand: item.b || null,
        active: true,
        featured: ${partNum === 1} && idx < 12,
        categoryId: cat.id,
        storeId: store.id
      }
    });

    if (item.i) {
      await prisma.productImage.deleteMany({ where: { productId: prod.id } });
      await prisma.productImage.create({
        data: { productId: prod.id, url: item.i, alt: item.n, order: 0 }
      });
    }
  }
  console.log('✅ Parte ${partNum}/${totalParts} concluída com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;
}

const part1 = minified.slice(0, 83);
const part2 = minified.slice(83);

fs.writeFileSync(path.resolve(__dirname, 'part1.js'), generateScript(part1, 1, 2));
fs.writeFileSync(path.resolve(__dirname, 'part2.js'), generateScript(part2, 2, 2));
console.log('Part 1 gerada com ' + part1.length + ' produtos');
console.log('Part 2 gerada com ' + part2.length + ' produtos');
