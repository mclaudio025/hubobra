const path = require('path');
const fs = require('fs');
const { PrismaClient } = require(path.resolve('f:/Apps/Projeto Loja Moderna/backend-nestjs/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function exportCatalog() {
  console.log('🔄 Buscando produtos oficiais do Supabase / PostgreSQL...');
  
  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`📦 Encontrados ${products.length} produtos oficiais no site!`);

  const categoryLocations = {
    'Materiais Básicos': 'Galpão 01 - Baia A',
    'Cimentos e Argamassas': 'Galpão 01 - Baia B',
    'Tubos e Conexões': 'Corredor 03 - Prateleira B2',
    'Tintas e Acessórios': 'Showroom - Gôndola Tintas',
    'Pisos e Revestimentos': 'Galpão 02 - Prateleira Pisos C',
    'Ferragens e Aço': 'Barracão de Aço - Feixe 02',
    'Elétrica e Iluminação': 'Corredor 02 - Prateleira E1',
    'Ferramentas': 'Gôndola Ferramentas 01',
    'Portas e Janelas': 'Pátio Esquadrias',
    'Telhas e Coberturas': 'Pátio Traseiro - Quadra 04',
  };

  const localProducts = products.map((p) => {
    const catName = p.category ? p.category.name : 'Geral';
    const loc = categoryLocations[catName] || `Galpão Central - ${catName}`;
    const img = p.images && p.images.length > 0 ? p.images[0].url : undefined;

    return {
      id: p.id,
      sku: p.sku || `SKU-${p.id.substring(0, 8).toUpperCase()}`,
      barcode: p.barcode || '',
      reference: p.model || p.brand || '',
      name: p.name.trim(),
      price: Number(p.price || 0),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
      cost: Number(p.cost && p.cost > 0 ? p.cost : (p.price * 0.70)),
      stock: p.stock !== null && p.stock !== undefined ? p.stock : 100,
      reservedStock: 0,
      minStock: p.minStock || 5,
      unit: p.unit || 'UN',
      location: loc,
      packaging: p.unit === 'M2' ? 'Caixa c/ 2,12m²' : p.unit === 'SACO' ? 'Saco 50kg' : 'Unidade',
      category: catName,
      image: img,
      description: p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '',
      updatedAt: new Date().toISOString(),
      synced: true,
    };
  });

  const targetPath = path.resolve('f:/Apps/Projeto Loja Moderna/hubobra-erp/src/db/officialProducts.json');
  fs.writeFileSync(targetPath, JSON.stringify(localProducts, null, 2), 'utf-8');
  console.log(`✅ Catálogo salvo com sucesso em: ${targetPath}`);
}

exportCatalog()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
