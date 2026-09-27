/**
 * 🏗️ HubObra - Importador Automático de Produtos dos Home Centers
 * Importa produtos da Acal, Carajás, Normatel e Leroy Merlin direto para o Banco de Dados do HubObra
 * 
 * Uso via Terminal:
 * node scripts/extractors/import-to-catalog.js "Tinta Suvinil"
 * node scripts/extractors/import-to-catalog.js "Piso Cerbras"
 * node scripts/extractors/import-to-catalog.js "Tubo Tigre"
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../../backend-nestjs');

try {
  require('dotenv').config({ path: path.join(backendDir, '.env') });
} catch (e) {
  require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });
}

let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  PrismaClient = require(path.join(backendDir, 'node_modules', '@prisma/client')).PrismaClient;
}

const { searchAllStores } = require('./multi-store-search');
const prisma = new PrismaClient();

async function importProductsFromHomeCenters(query, options = {}) {
  console.log(`\n======================================================`);
  console.log(`🚀 Iniciando Extração e Importação: "${query}"`);
  console.log(`======================================================`);

  // 1. Buscar produtos nos Home Centers
  const results = await searchAllStores(query);
  const productsFound = results.products || [];

  if (productsFound.length === 0) {
    console.log(`❌ Nenhum produto encontrado nos Home Centers para "${query}".`);
    await prisma.$disconnect();
    return { success: false, imported: 0 };
  }

  // 2. Garantir categoria padrão ou mapeada
  let defaultCategory = await prisma.category.findFirst({
    where: { active: true }
  });

  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: {
        name: 'Geral',
        slug: 'geral',
        active: true,
      }
    });
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const item of productsFound) {
    try {
      // Gerar SKU único se não houver
      const sku = item.ean || `EAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Verificar se já existe por SKU, EAN ou Nome exato
      const existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: sku },
            ...(item.ean ? [{ barcode: item.ean }] : []),
            { name: item.name }
          ]
        }
      });

      if (existingProduct) {
        console.log(`⚠️ Já existe no catálogo: ${item.name} (SKU: ${existingProduct.sku})`);
        skippedCount++;
        continue;
      }

      // Descobrir categoria mais adequada com base no nome
      let categoryId = defaultCategory.id;
      const lowerName = item.name.toLowerCase();
      
      const matchedCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { contains: lowerName.split(' ')[0], mode: 'insensitive' } },
            ...(lowerName.includes('tinta') || lowerName.includes('verniz') ? [{ name: { contains: 'Tinta', mode: 'insensitive' } }] : []),
            ...(lowerName.includes('piso') || lowerName.includes('porcelanato') || lowerName.includes('revestimento') ? [{ name: { contains: 'Piso', mode: 'insensitive' } }] : []),
            ...(lowerName.includes('cimento') || lowerName.includes('argamassa') ? [{ name: { contains: 'Cimento', mode: 'insensitive' } }] : []),
            ...(lowerName.includes('tubo') || lowerName.includes('conexão') || lowerName.includes('tigre') ? [{ name: { contains: 'Hidráulica', mode: 'insensitive' } }] : []),
            ...(lowerName.includes('fio') || lowerName.includes('cabo') || lowerName.includes('disjuntor') ? [{ name: { contains: 'Elétrica', mode: 'insensitive' } }] : []),
          ]
        }
      });

      if (matchedCategory) {
        categoryId = matchedCategory.id;
      }

      // Criar o produto no banco de dados
      const newProduct = await prisma.product.create({
        data: {
          name: item.name,
          sku: sku,
          barcode: item.ean || null,
          brand: item.brand || 'Marca Referência',
          price: item.price || 49.90,
          comparePrice: item.listPrice > item.price ? item.listPrice : Math.round(item.price * 1.15 * 100) / 100,
          cost: Math.round(item.price * 0.70 * 100) / 100, // Custo estimado (70% do preço de mercado)
          stock: 50, // Estoque padrão inicial
          unit: lowerName.includes('piso') || lowerName.includes('porcelanato') ? 'M2' : (lowerName.includes('cimento') || lowerName.includes('argamassa') ? 'SACO' : 'UN'),
          specifications: item.description || `Produto de alta qualidade ${item.brand || ''}. Referência de mercado: ${item.store}.`,
          description: item.description || `Produto original ${item.name}, ideal para sua obra ou reforma.`,
          categoryId: categoryId,
          active: true,
          images: item.image ? {
            create: [
              {
                url: item.image,
                alt: item.name,
                order: 0,
              }
            ]
          } : undefined
        }
      });

      console.log(`✅ [${item.store}] Importado: ${newProduct.name} | R$ ${newProduct.price.toFixed(2)} | SKU: ${newProduct.sku}`);
      importedCount++;
    } catch (err) {
      console.error(`❌ Erro ao importar item (${item.name}):`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Resumo da Importação:`);
  console.log(`- Novos Produtos Cadastrados: ${importedCount}`);
  console.log(`- Itens Ignorados (já existentes): ${skippedCount}`);
  console.log(`- Total Analisado: ${productsFound.length}`);
  console.log(`======================================================\n`);

  await prisma.$disconnect();
  return { success: true, imported: importedCount, skipped: skippedCount, total: productsFound.length };
}

// Execução via linha de comando
if (require.main === module) {
  const query = process.argv.slice(2).join(' ') || 'Tinta Suvinil 18L';
  importProductsFromHomeCenters(query)
    .catch(err => {
      console.error('Falha geral no importador:', err);
      process.exit(1);
    });
}

module.exports = { importProductsFromHomeCenters };
