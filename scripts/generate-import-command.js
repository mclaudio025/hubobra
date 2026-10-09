const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../hubobra-erp/src/db/officialProducts.json'), 'utf-8'));

console.log(`Carregando ${products.length} produtos para gerar script de importação...`);

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const catalog = ${JSON.stringify(products, null, 2)};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
    .replace(/\\s+/g, '-')
    .replace(/[^\\w\\-]+/g, '')
    .replace(/\\-\\-+/g, '-');
}

async function run() {
  console.log('🚀 Iniciando importação de ' + catalog.length + ' produtos oficiais com fotos...');

  // 1. Obter ou criar loja matriz
  const store = await prisma.store.upsert({
    where: { slug: 'matriz' },
    update: {},
    create: {
      name: 'ObraHub Materiais - Matriz',
      slug: 'matriz',
      subdomain: 'matriz',
      phone: '5511999999999',
      document: '00.000.000/0001-00',
      email: 'contato@obrahub.com.br',
      primaryColor: '#f97316',
      address: 'Av. Principal da Construção, 1000',
      city: 'São Paulo',
      state: 'SP',
      plan: 'PRO',
      active: true,
    }
  });

  console.log('🏬 Loja ID:', store.id);

  // 2. Criar ou mapear todas as categorias
  const uniqueCategories = [...new Set(catalog.map(p => p.category || 'Geral'))];
  const categoryMap = {};

  for (let i = 0; i < uniqueCategories.length; i++) {
    const catName = uniqueCategories[i];
    const catSlug = slugify(catName);
    const category = await prisma.category.upsert({
      where: { slug: catSlug },
      update: { name: catName, active: true, storeId: store.id },
      create: {
        name: catName,
        slug: catSlug,
        active: true,
        order: i + 1,
        storeId: store.id
      }
    });
    categoryMap[catName] = category.id;
  }
  console.log('📂 Categorias criadas/mapeadas:', Object.keys(categoryMap).length);

  // 3. Inserir produtos e imagens
  let count = 0;
  for (const item of catalog) {
    const catId = categoryMap[item.category] || categoryMap['Geral'];
    const sku = item.sku || ('SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    
    // Criar ou atualizar produto
    const product = await prisma.product.upsert({
      where: { sku: sku },
      update: {
        name: item.name,
        price: Number(item.price || 0),
        comparePrice: item.comparePrice ? Number(item.comparePrice) : null,
        cost: item.cost ? Number(item.cost) : null,
        stock: item.stock !== undefined ? Number(item.stock) : 100,
        brand: item.reference || null,
        unit: item.unit || 'UN',
        description: item.description || null,
        active: true,
        featured: count < 18, // Primeiros 18 como destaque na vitrine
        categoryId: catId,
        storeId: store.id
      },
      create: {
        id: item.id || undefined,
        name: item.name,
        sku: sku,
        barcode: item.barcode || null,
        price: Number(item.price || 0),
        comparePrice: item.comparePrice ? Number(item.comparePrice) : null,
        cost: item.cost ? Number(item.cost) : null,
        stock: item.stock !== undefined ? Number(item.stock) : 100,
        brand: item.reference || null,
        unit: item.unit || 'UN',
        description: item.description || null,
        active: true,
        featured: count < 18,
        categoryId: catId,
        storeId: store.id
      }
    });

    // Inserir imagem se existir
    if (item.image) {
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.image,
          alt: item.name,
          order: 0
        }
      });
    }

    count++;
    if (count % 25 === 0 || count === catalog.length) {
      console.log(\`📦 Progresso: \${count}/\${catalog.length} produtos importados...\`);
    }
  }

  console.log('🎉 TODOS OS ' + count + ' PRODUTOS FORAM IMPORTADOS COM SUCESSO!');
}

run()
  .catch(err => {
    console.error('❌ Erro na importação:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
`;

fs.writeFileSync(path.resolve(__dirname, 'import-catalog-self-contained.js'), scriptContent, 'utf-8');
console.log('✅ Arquivo gerado: scripts/import-catalog-self-contained.js (Tamanho: ' + (scriptContent.length / 1024).toFixed(1) + ' KB)');
