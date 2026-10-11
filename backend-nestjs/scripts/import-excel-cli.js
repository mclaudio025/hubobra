/**
 * CLI de Importação Inteligente de Planilhas Excel (.xlsx / .xls) / CSV
 * Suporta formatos de ERPs locais (ex: Depósito São José, Novo Lar, etc.)
 * 
 * Uso:
 *   node scripts/import-excel-cli.js <caminho-do-arquivo.xlsx> [--store=<slug_ou_id>] [--dry-run]
 * 
 * Exemplo:
 *   node scripts/import-excel-cli.js ./planilha-sao-jose.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Limpeza de textos de ERPs (remove (1), asteriscos, etc.)
function cleanText(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/\s*\(\d+\)\s*$/g, '') // remove sufixos como (1)
    .replace(/[*#]/g, '')
    .trim();
}

// Normalização de cabeçalhos
function normalizeHeader(header) {
  if (!header) return '';
  const clean = header
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '');

  if (['sku', 'codigo', 'cod', 'referencia', 'ref', 'codigointerno', 'codprod', 'item', 'coda'].includes(clean)) return 'sku';
  if (['barcode', 'codigobarras', 'codigodebarras', 'ean', 'ean13', 'gtin', 'codbarras', 'barras'].includes(clean)) return 'barcode';
  if (['name', 'nome', 'descricao', 'desc', 'produto', 'descricaodoproduto', 'titulodoproduto'].includes(clean)) return 'name';
  if (['precomediovenda', 'precovenda', 'preco', 'price', 'unitario', 'precomedio', 'pvenda'].includes(clean)) return 'price';
  if (['customedio', 'custo', 'cost', 'precocusto', 'custounitario', 'pcusto'].includes(clean)) return 'cost';
  if (['totvenda', 'totalvenda', 'totvenda'].includes(clean)) return 'totvenda';
  if (['totcusto', 'totalcusto'].includes(clean)) return 'totcusto';
  if (['category', 'categoria', 'departamento', 'secao', 'grupo', 'subgrupo', 'familia', 'depto'].includes(clean)) return 'category';
  if (['brand', 'marca', 'fabricante', 'fornecedor'].includes(clean)) return 'brand';
  if (['stock', 'estoque', 'qtd', 'quantidade', 'saldo', 'estoquea', 'estoqueatual', 'saldoatual', 'estq'].includes(clean)) return 'stock';
  if (['ncm', 'classfiscal', 'classificacaofiscal'].includes(clean)) return 'ncm';
  if (['unit', 'unidade', 'unid', 'medida', 'um'].includes(clean)) return 'unit';

  return clean;
}

// Parser de números pt-BR / internacional
function parseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;

  let str = value.toString().replace(/[R$\s]/gi, '').trim();
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? defaultValue : parsed;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Uso:
  node scripts/import-excel-cli.js <caminho-do-arquivo.xlsx> [--store=<slug_ou_id>] [--dry-run]
    `);
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const isDryRun = args.includes('--dry-run');
  const storeArg = args.find(a => a.startsWith('--store='));
  let storeId = null;

  if (storeArg) {
    const storeTarget = storeArg.split('=')[1];
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: storeTarget }, { slug: storeTarget }]
      }
    });
    if (!store) {
      console.error(`❌ Loja com identificador "${storeTarget}" não foi encontrada no banco.`);
      process.exit(1);
    }
    storeId = store.id;
    console.log(`🏬 Loja vinculada: "${store.name}" (${store.id})`);
  }

  console.log(`\n📂 Lendo arquivo: ${path.basename(filePath)}...`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rowsRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rowsRaw || rowsRaw.length < 2) {
    console.error('❌ A planilha está vazia ou não contém dados suficientes.');
    process.exit(1);
  }

  const headerRow = rowsRaw[0];
  const dataRows = rowsRaw.slice(1);

  console.log(`📊 Total de linhas detectadas: ${dataRows.length}`);
  console.log(`🔍 Mapeando colunas:`);
  
  const headerMap = {};
  headerRow.forEach((col, idx) => {
    if (col) {
      const norm = normalizeHeader(col);
      headerMap[norm] = idx;
      console.log(`   - Coluna ${idx + 1} ("${col}") ➔ mapeada para: [${norm}]`);
    }
  });

  // Carregar cache de categorias existentes
  const categories = await prisma.category.findMany();
  const categoryMap = new Map();
  categories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

  // Carregar SKUs existentes
  const existingProducts = await prisma.product.findMany({
    select: { sku: true, id: true, name: true }
  });
  const existingSkuMap = new Map();
  existingProducts.forEach(p => existingSkuMap.set(p.sku, p.id));

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  console.log(`\n🚀 Iniciando processamento... (Dry-run: ${isDryRun ? 'SIM' : 'NÃO'})`);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const rawSku = row[headerMap['sku']]?.toString()?.trim() || `GEN-${Date.now()}-${i}`;
    const rawName = cleanText(row[headerMap['name']]);
    if (!rawName) {
      skippedCount++;
      continue;
    }

    const price = parseNumber(row[headerMap['price']], 0);
    const cost = parseNumber(row[headerMap['cost']], 0);
    const stock = Math.round(parseNumber(row[headerMap['stock']], 0));
    const barcode = row[headerMap['barcode']]?.toString()?.trim() || null;
    const rawCategory = cleanText(row[headerMap['category']]) || 'Geral';
    const brand = cleanText(row[headerMap['brand']]) || null;
    const ncm = row[headerMap['ncm']]?.toString()?.trim() || null;
    const unit = row[headerMap['unit']]?.toString()?.trim() || 'UN';

    let specifications = '';
    if (ncm) specifications += `NCM: ${ncm}`;

    // Categoria
    let categoryId = categoryMap.get(rawCategory.toLowerCase());
    if (!categoryId && !isDryRun) {
      try {
        const newCat = await prisma.category.create({
          data: {
            name: rawCategory,
            slug: generateSlug(rawCategory) + '-' + Math.floor(Math.random() * 1000),
            description: `Importada de planilha`,
            active: true,
          }
        });
        categoryId = newCat.id;
        categoryMap.set(rawCategory.toLowerCase(), categoryId);
      } catch (err) {
        categoryId = categories[0]?.id;
      }
    }

    const existingId = existingSkuMap.get(rawSku);

    if (existingId) {
      // Atualizar
      if (!isDryRun) {
        await prisma.product.update({
          where: { id: existingId },
          data: {
            price: price > 0 ? price : undefined,
            cost: cost > 0 ? cost : undefined,
            stock: stock,
            barcode: barcode || undefined,
            ncm: ncm || undefined,
            brand: brand || undefined,
            unit: unit,
            specifications: specifications || undefined,
            updatedAt: new Date(),
          }
        });
      }
      updatedCount++;
    } else {
      // Criar novo
      if (!isDryRun) {
        await prisma.product.create({
          data: {
            name: rawName,
            sku: rawSku,
            price: price,
            cost: cost > 0 ? cost : undefined,
            stock: stock,
            barcode: barcode,
            ncm: ncm,
            brand: brand,
            unit: unit,
            specifications: specifications,
            categoryId: categoryId || categories[0]?.id,
            storeId: storeId,
            active: true,
          }
        });
        existingSkuMap.set(rawSku, 'created');
      }
      createdCount++;
    }

    if ((i + 1) % 100 === 0 || i === dataRows.length - 1) {
      process.stdout.write(`\r   Processados: ${i + 1}/${dataRows.length} (Criados: ${createdCount} | Atualizados: ${updatedCount} | Ignorados: ${skippedCount})`);
    }
  }

  console.log(`\n\n✅ Concluído com sucesso!`);
  console.log(`   - Novos produtos inseridos: ${createdCount}`);
  console.log(`   - Produtos existentes atualizados: ${updatedCount}`);
  console.log(`   - Linhas sem nome ignoradas: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erro durante a importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
