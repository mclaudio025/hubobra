/**
 * Script de Normalização do Catálogo e NCM
 * 
 * 1. Preenche o novo campo oficial `ncm` dos produtos:
 *    - Cruzando com a planilha original `produtos.xlsx` (via Código/SKU);
 *    - Ou extraindo de `specifications` e `description` via regex.
 * 2. Converte nomes de produtos em CAIXA ALTA para Title Case inteligente:
 *    - Mantém siglas do ramo de construção civil (PVC, LED, EPI, MDF, NBR, BIVOLT, etc.)
 *    - Mantém unidades de medida (KG, MM, CM, M, M2, L, ML, V, W, etc.)
 *    - Mantém marcas conhecidas com grafia oficial (Tigre, Coral, Suvinil, Votoran, Tramontina, Lonax, etc.)
 *    - Mantém preposições em minúsculas (de, da, do, com, para, em, etc.)
 *    - Remove ruídos de ERPs antigos (asteriscos finais *, sufixos como (1), etc.)
 * 
 * Uso:
 *   node scripts/normalize-catalog-and-ncm.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PREPOSITIONS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'sem', 'por',
  'a', 'o', 'as', 'os', 'um', 'uma', 'na', 'no', 'nas', 'nos', 'sob', 'sobre',
  'ao', 'aos', 'à', 'às', 'c/', 's/', 'p/', 'x'
]);

const ACRONYMS = new Set([
  'PVC', 'PPR', 'CPVC', 'EPI', 'LED', 'HDTV', 'UHF', 'VHF', 'TPI', 'HP',
  'CV', 'BTU', 'BTUS', 'BIVOLT', 'NBR', 'ABNT', 'EAN', 'SKU', 'MDF', 'MDP',
  'PU', 'MS', 'UV', 'EPDM', 'ABS', 'SDR', 'DN', 'PN', 'SCH', 'DWT', '3M',
  'CSN', 'RGB', 'AC', 'DC', 'USB', 'IP65', 'IP66', 'IP67', 'IP68', 'GLP', 'GN',
  'KG', 'G', 'MG', 'L', 'ML', 'MM', 'CM', 'M', 'MT', 'MTS', 'M2', 'M3',
  'POL', 'V', 'W', 'KW', 'KVA', 'KWH', 'A', 'UN', 'CX', 'PC', 'PCS', 'KIT', 'PAR'
]);

const KNOWN_BRANDS = {
  'starrett': 'Starrett',
  'votoran': 'Votoran',
  'tigre': 'Tigre',
  'amanco': 'Amanco',
  'krona': 'Krona',
  'tramontina': 'Tramontina',
  'vonder': 'Vonder',
  'dewalt': 'DeWalt',
  'bosch': 'Bosch',
  'makita': 'Makita',
  'stanley': 'Stanley',
  'irwin': 'Irwin',
  'gedore': 'Gedore',
  'coral': 'Coral',
  'suvinil': 'Suvinil',
  'quartzolit': 'Quartzolit',
  'fortlev': 'Fortlev',
  'deca': 'Deca',
  'docol': 'Docol',
  'lorenzetti': 'Lorenzetti',
  'gerdau': 'Gerdau',
  'belgo': 'Belgo',
  'lonax': 'Lonax',
  'fortex': 'Fortex',
  'ciplan': 'Ciplan',
  'saint-gobain': 'Saint-Gobain',
  '3m': '3M',
  'daisa': 'Daisa',
  'sil': 'SIL',
  'pirelli': 'Pirelli',
  'cobrecom': 'Cobrecom',
  'corfio': 'Corfio',
  'blukit': 'Blukit',
  'astra': 'Astra',
  'tigre tubos': 'Tigre',
};

// Limpa ruídos comuns de ERP
function sanitizeRawText(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/\s*\(\d+\)\s*$/g, '') // remove sufixos como (1)
    .replace(/[*#]/g, '')           // remove * e # do ERP
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleWord(rawWord, index) {
  const match = rawWord.match(/^([^a-zA-Z0-9À-ÿ]*)([a-zA-Z0-9À-ÿ/".-]+)([^a-zA-Z0-9À-ÿ]*)$/);
  if (!match) return rawWord;

  const prefix = match[1];
  const word = match[2];
  const suffix = match[3];
  const wordUpper = word.toUpperCase();
  const wordLower = word.toLowerCase();

  // Multiplicação/dimensão isolada: "x" ou "X" (ex: 4 x 100mt)
  if (wordLower === 'x') {
    return prefix + 'x' + suffix;
  }

  // Siglas conhecidas da construção civil
  if (ACRONYMS.has(wordUpper)) {
    return prefix + wordUpper + suffix;
  }

  // Marcas conhecidas
  if (KNOWN_BRANDS[wordLower]) {
    return prefix + KNOWN_BRANDS[wordLower] + suffix;
  }

  // Padrão de medidas coladas (Ex: 50kg, 25mm, 220v, 100w, 3.6l, 100mt)
  if (/^\d+(?:[.,]\d+)?(?:kg|g|mg|l|ml|m|mt|mts|cm|mm|m2|m3|pol|"|v|w|a|kva|kwh|cv|hp|un|pcs|pc)$/i.test(word)) {
    return prefix + word.toUpperCase() + suffix;
  }

  // Frações de polegada (1/2", 3/4", 1.1/2")
  if (/^\d*(?:\.\d+)?\/\d+(?:"|pol)?$/i.test(word)) {
    return prefix + word + suffix;
  }

  // Palavras com hífen (Bi-Metal, Anti-Ferrugem)
  if (word.includes('-')) {
    const parts = word.split('-');
    const formattedParts = parts.map((part) => {
      const pUpper = part.toUpperCase();
      if (ACRONYMS.has(pUpper)) return pUpper;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    });
    return prefix + formattedParts.join('-') + suffix;
  }

  // Preposições
  if (index > 0 && PREPOSITIONS.has(wordLower)) {
    return prefix + wordLower + suffix;
  }

  // Capitalização padrão
  return prefix + word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + suffix;
}

function normalizeTitle(title) {
  if (!title) return '';
  const clean = sanitizeRawText(title);
  if (!clean) return '';

  const words = clean.split(' ');
  const normalizedWords = words.map((w, idx) => normalizeTitleWord(w, idx));
  return normalizedWords.join(' ');
}

function normalizeBrand(brand) {
  if (!brand) return '';
  const clean = sanitizeRawText(brand);
  if (!clean) return '';
  const lower = clean.toLowerCase();
  if (KNOWN_BRANDS[lower]) return KNOWN_BRANDS[lower];
  if (ACRONYMS.has(clean.toUpperCase())) return clean.toUpperCase();
  return normalizeTitle(clean);
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`====================================================`);
  console.log(`🚀 INICIANDO NORMALIZAÇÃO DE CATÁLOGO & NCM`);
  console.log(`Modo: ${isDryRun ? '🔍 DRY-RUN (Simulação sem salvar)' : '💾 APLICAÇÃO REAL NO BANCO'}`);
  console.log(`====================================================\n`);

  // 1. Carregar NCM da planilha Excel se existir
  const excelNcmMap = new Map();
  const excelPath = path.resolve(__dirname, '../../produtos.xlsx');
  if (fs.existsSync(excelPath)) {
    console.log(`📂 Lendo planilha de referência: ${excelPath}...`);
    try {
      const wb = XLSX.readFile(excelPath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      for (const row of rows) {
        const sku = (row['Código'] || row['Codigo'] || '').toString().trim();
        const ncm = (row['NCM'] || '').toString().replace(/[^0-9]/g, '').trim();
        if (sku && ncm) {
          excelNcmMap.set(sku, ncm);
          // Adiciona também sem zeros à esquerda e com zeros
          excelNcmMap.set(sku.replace(/^0+/, ''), ncm);
        }
      }
      console.log(`✅ Planilha processada: ${excelNcmMap.size} referências de NCM mapeadas.\n`);
    } catch (err) {
      console.warn(`⚠️ Não foi possível ler ${excelPath}:`, err.message);
    }
  } else {
    console.log(`ℹ️ Planilha de referência não encontrada na raiz, usando extração das especificações.\n`);
  }

  // 2. Buscar todos os produtos no banco
  console.log(`📦 Carregando produtos do banco de dados...`);
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      ncm: true,
      brand: true,
      specifications: true,
      description: true,
    }
  });

  console.log(`Total de produtos encontrados no banco: ${products.length}\n`);

  let updatedCount = 0;
  let ncmFoundCount = 0;
  let nameChangedCount = 0;
  let brandChangedCount = 0;

  const samples = [];
  const tasksToUpdate = [];

  for (const product of products) {
    let changed = false;
    const updateData = {};

    // 1. Resolver NCM
    let finalNcm = product.ncm ? product.ncm.trim() : '';

    if (!finalNcm) {
      // Tentar planilha
      const cleanSku = (product.sku || '').trim();
      if (cleanSku && excelNcmMap.has(cleanSku)) {
        finalNcm = excelNcmMap.get(cleanSku);
      } else if (cleanSku && excelNcmMap.has(cleanSku.replace(/^0+/, ''))) {
        finalNcm = excelNcmMap.get(cleanSku.replace(/^0+/, ''));
      }

      // Se ainda não achou, tentar regex em especificações
      if (!finalNcm && product.specifications) {
        const match = product.specifications.match(/(?:NCM:?\s*)(\d{4,8})/i);
        if (match) {
          finalNcm = match[1];
        }
      }

      // Se ainda não achou, tentar regex em descrição
      if (!finalNcm && product.description) {
        const match = product.description.match(/(?:NCM:?\s*)(\d{4,8})/i);
        if (match) {
          finalNcm = match[1];
        }
      }

      if (finalNcm) {
        updateData.ncm = finalNcm;
        changed = true;
        ncmFoundCount++;
      }
    }

    // 2. Normalizar Nome
    const normalizedName = normalizeTitle(product.name);
    if (normalizedName && normalizedName !== product.name) {
      updateData.name = normalizedName;
      changed = true;
      nameChangedCount++;
    }

    // 3. Normalizar Marca
    if (product.brand) {
      const normalizedBrand = normalizeBrand(product.brand);
      if (normalizedBrand && normalizedBrand !== product.brand) {
        updateData.brand = normalizedBrand;
        changed = true;
        brandChangedCount++;
      }
    }

    if (changed) {
      updatedCount++;

      if (samples.length < 10) {
        samples.push({
          sku: product.sku,
          antes: {
            name: product.name,
            brand: product.brand,
            ncm: product.ncm || '(vazio)'
          },
          depois: {
            name: updateData.name || product.name,
            brand: updateData.brand || product.brand,
            ncm: updateData.ncm || product.ncm || '(não encontrado)'
          }
        });
      }

      tasksToUpdate.push({
        id: product.id,
        data: updateData
      });
    }
  }

  // Executar atualizações em lotes concorrentes para alta performance
  if (!isDryRun && tasksToUpdate.length > 0) {
    console.log(`⚡ Aplicando ${tasksToUpdate.length} atualizações em lotes concorrentes (25 por vez)...`);
    const CHUNK_SIZE = 25;
    for (let i = 0; i < tasksToUpdate.length; i += CHUNK_SIZE) {
      const chunk = tasksToUpdate.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) =>
          prisma.product.update({
            where: { id: item.id },
            data: item.data
          })
        )
      );
      const progress = Math.min(i + CHUNK_SIZE, tasksToUpdate.length);
      if (progress % 200 === 0 || progress === tasksToUpdate.length) {
        console.log(`  Progresso: ${progress} / ${tasksToUpdate.length} produtos atualizados...`);
      }
    }
  }

  console.log(`\n====================================================`);
  console.log(`📊 RELATÓRIO DE PROCESSAMENTO`);
  console.log(`====================================================`);
  console.log(`Total de produtos analisados: ${products.length}`);
  console.log(`Produtos que receberam alterações: ${updatedCount}`);
  console.log(`  - NCM preenchido/corrigido: ${ncmFoundCount}`);
  console.log(`  - Título/Nome normalizado: ${nameChangedCount}`);
  console.log(`  - Marca padronizada: ${brandChangedCount}`);
  console.log(`====================================================\n`);

  console.log(`🔍 AMOSTRA DE TRANSFORMAÇÕES (10 PRIMEIROS):`);
  samples.forEach((s, idx) => {
    console.log(`\n[${idx + 1}] SKU: ${s.sku}`);
    console.log(`  ANTES: "${s.antes.name}" | Marca: ${s.antes.brand} | NCM: ${s.antes.ncm}`);
    console.log(`  DEPOIS: "${s.depois.name}" | Marca: ${s.depois.brand} | NCM: ${s.depois.ncm}`);
  });

  if (isDryRun) {
    console.log(`\n💡 Esta foi uma simulação (DRY-RUN). Nenhuma alteração foi gravada.`);
    console.log(`Para aplicar de verdade no banco, execute sem a flag --dry-run.`);
  } else {
    console.log(`\n🎉 Alterações aplicadas com sucesso no banco de dados!`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro na execução:', e);
  await prisma.$disconnect();
  process.exit(1);
});
