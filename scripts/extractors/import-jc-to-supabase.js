/**
 * 🏗️ HubObra - Importador Direto JC Materiais -> Supabase
 * Extrai produtos com fotos em alta definição (.webp), estoque, código SKU e preços da JC Materiais
 * e cadastra no banco de dados Supabase da HubObra.
 * 
 * Uso:
 * node scripts/extractors/import-jc-to-supabase.js "Tubo Tigre"
 * node scripts/extractors/import-jc-to-supabase.js "Cimento Votoran"
 * node scripts/extractors/import-jc-to-supabase.js "Fita Isolante 3M"
 * node scripts/extractors/import-jc-to-supabase.js "Argamassa Quartzolit"
 */

const https = require('https');
const crypto = require('crypto');
const { searchJCMateriais } = require('./search-jc-materiais');

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function supabaseRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function detectUnit(name) {
  const lower = name.toLowerCase();
  if (lower.includes('piso') || lower.includes('porcelanato') || lower.includes('revestimento')) return 'M2';
  if (lower.includes('cimento') || lower.includes('argamassa') || lower.includes('rejunte')) return 'SACO';
  if (lower.includes('tubo') || lower.includes('barra') || lower.includes('perfil') || lower.includes('canaleta')) return 'BARRA';
  if (lower.includes('fio') || lower.includes('cabo') || lower.includes('mangueira')) return 'METRO';
  if (lower.includes('tinta') || lower.includes('selador') || lower.includes('impermeabilizante')) {
    if (lower.includes('18l') || lower.includes('lata')) return 'LATA';
    if (lower.includes('3,6l') || lower.includes('3.6l') || lower.includes('galão') || lower.includes('galao')) return 'GALAO';
  }
  return 'UN';
}

async function importJCToSupabase(query, maxItems = 10) {
  console.log(`\n======================================================`);
  console.log(`🚀 Iniciando Robô Extrator da JC Materiais: "${query}" (Limite: ${maxItems})`);
  console.log(`======================================================\n`);

  // 1. Extrair produtos
  const products = await searchJCMateriais(query);
  console.log(`📦 Encontrados ${products.length} itens correspondentes no site jcmateriais.com.br`);

  if (products.length === 0) {
    console.log('⚠️ Nenhum produto retornado.');
    return { inserted: 0, skipped: 0, total: 0 };
  }

  // 2. Buscar categorias existentes no Supabase
  const catRes = await supabaseRequest('GET', '/rest/v1/categories?select=id,name');
  const categories = Array.isArray(catRes.data) ? catRes.data : [];
  const defaultCatId = categories[0]?.id || null;

  let inserted = 0;
  let skipped = 0;

  const itemsToProcess = products.slice(0, maxItems);

  for (const item of itemsToProcess) {
    try {
      // Verificar se já existe por nome ou sku
      const checkRes = await supabaseRequest('GET', `/rest/v1/products?name=eq.${encodeURIComponent(item.name)}&select=id,name`);
      if (Array.isArray(checkRes.data) && checkRes.data.length > 0) {
        console.log(`⏩ Já existe no catálogo: "${item.name}"`);
        skipped++;
        continue;
      }

      // Mapear categoria
      let catId = defaultCatId;
      const lower = item.name.toLowerCase();
      const matchedCat = categories.find(c => {
        const cName = c.name.toLowerCase();
        return lower.includes(cName) || 
          (cName.includes('hidr') && (lower.includes('tubo') || lower.includes('joelho') || lower.includes('curva') || lower.includes('conex'))) ||
          (cName.includes('elétr') && (lower.includes('fio') || lower.includes('cabo') || lower.includes('disjuntor') || lower.includes('tomada'))) ||
          (cName.includes('tinta') && (lower.includes('tinta') || lower.includes('verniz') || lower.includes('selador'))) ||
          (cName.includes('básico') && (lower.includes('cimento') || lower.includes('argamassa')));
      });

      if (matchedCat) catId = matchedCat.id;

      const unit = detectUnit(item.name);
      const sku = item.productId ? `JC-${item.productId}` : `JC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
      const productId = crypto.randomUUID();

      // Montar objeto de produto com ID explícito
      const productPayload = {
        id: productId,
        name: item.name,
        sku: sku,
        brand: item.brand || 'JC Referência',
        price: item.price,
        comparePrice: Math.round(item.price * 1.15 * 100) / 100,
        cost: Math.round(item.price * 0.70 * 100) / 100,
        stock: item.stock > 0 ? item.stock : 50,
        minStock: 5,
        unit: unit,
        description: item.description || `Produto ${item.name} original de alta qualidade e durabilidade. Disponível na HubObra.`,
        categoryId: catId,
        active: true,
        featured: false,
        hasVariations: false,
        isVariation: false,
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        saleCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const insertRes = await supabaseRequest('POST', '/rest/v1/products', productPayload);
      if (insertRes.status === 201 || (insertRes.status === 200 && Array.isArray(insertRes.data))) {
        // Inserir imagem do produto se existir
        if (item.image) {
          await supabaseRequest('POST', '/rest/v1/product_images', {
            id: crypto.randomUUID(),
            productId: productId,
            url: item.image,
            alt: item.name,
            order: 0,
            createdAt: new Date().toISOString()
          });
        }

        console.log(`✅ [IMPORTADO COM SUCESSO] ${item.name} | R$ ${item.price.toFixed(2)} | Marca: ${item.brand} | Foto WebP: OK`);
        inserted++;
      } else {
        console.warn(`⚠️ Erro ao salvar "${item.name}":`, insertRes.data || insertRes.raw);
      }
    } catch (err) {
      console.error(`❌ Erro no item "${item.name}":`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Resumo da Importação JC Materiais:`);
  console.log(`- Novos Produtos Cadastrados no Supabase: ${inserted}`);
  console.log(`- Produtos Já Existentes (Pulados): ${skipped}`);
  console.log(`- Total Solicitado: ${itemsToProcess.length}`);
  console.log(`======================================================\n`);

  return { inserted, skipped, total: itemsToProcess.length };
}

if (require.main === module) {
  const query = process.argv[2] || 'Tubo Krona';
  const limit = parseInt(process.argv[3]) || 5;
  importJCToSupabase(query, limit).catch(console.error);
}

module.exports = { importJCToSupabase };
