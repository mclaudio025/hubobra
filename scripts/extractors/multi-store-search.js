/**
 * 🏗️ HubObra Multi-Store Extractor & Price Intelligence
 * Conectores para os 4 Maiores Home Centers Regionais e Nacionais:
 * - Normatel Home Center
 * - Acal Home Center
 * - Carajás Home Center
 * - Leroy Merlin
 */

const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const client = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  }
});

/**
 * 1. Conector Normatel (VTEX Intelligent Search / Catalog API)
 */
async function searchNormatel(query) {
  try {
    const endpoints = [
      `https://www.normatel.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=9`,
      `https://normatel.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=9`
    ];

    let data = null;
    for (const ep of endpoints) {
      try {
        const res = await client.get(ep);
        if (Array.isArray(res.data) && res.data.length > 0) {
          data = res.data;
          break;
        }
      } catch (e) {}
    }

    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';

      return {
        store: 'Normatel',
        storeLogo: 'https://www.normatel.com.br/arquivos/logo-normatel.png',
        productId: item.productId,
        name: cleanProductName(item.productName || item.name),
        brand: item.brand || 'Normatel',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        available: seller.AvailableQuantity > 0,
        url: item.link || `https://www.normatel.com.br/${item.linkText}/p`,
        image: image,
        categories: item.categories || [],
        description: item.description || ''
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.warn(`[Normatel] Falha na busca (${query}):`, err.message);
    return [];
  }
}

/**
 * 2. Conector Carajás (VTEX Intelligent Search / Catalog API)
 */
async function searchCarajas(query) {
  try {
    const url = `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=9`;
    const res = await client.get(url);
    if (!Array.isArray(res.data)) return [];

    return res.data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';

      return {
        store: 'Carajás',
        storeLogo: 'https://www.carajas.com.br/arquivos/logo-carajas.png',
        productId: item.productId,
        name: cleanProductName(item.productName || item.name),
        brand: item.brand || 'Carajás',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        available: seller.AvailableQuantity > 0,
        url: item.link || `https://www.carajas.com.br/${item.linkText}/p`,
        image: image,
        categories: item.categories || [],
        description: item.description || ''
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.warn(`[Carajás] Falha na busca (${query}):`, err.message);
    return [];
  }
}

/**
 * 3. Conector Acal Home Center
 */
async function searchAcal(query) {
  try {
    const url = `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=9`;
    const res = await client.get(url);
    if (!Array.isArray(res.data)) return [];

    return res.data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';

      return {
        store: 'Acal',
        storeLogo: 'https://www.acalhomecenter.com.br/arquivos/logo-acal.png',
        productId: item.productId,
        name: cleanProductName(item.productName || item.name),
        brand: item.brand || 'Acal',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        available: seller.AvailableQuantity > 0,
        url: item.link || `https://www.acalhomecenter.com.br/${item.linkText}/p`,
        image: image,
        categories: item.categories || [],
        description: item.description || ''
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.warn(`[Acal] Falha na busca (${query}):`, err.message);
    return [];
  }
}

/**
 * 4. Conector Leroy Merlin
 */
async function searchLeroy(query) {
  try {
    const url = `https://www.leroymerlin.com.br/api/v2/products?term=${encodeURIComponent(query)}&page=1&perPage=10`;
    const res = await client.get(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    const items = res.data?.products || res.data?.data || [];
    if (!Array.isArray(items)) return [];

    return items.map(item => {
      return {
        store: 'Leroy Merlin',
        storeLogo: 'https://assets.leroymerlin.com.br/assets/images/logos/logo-leroy-merlin.svg',
        productId: String(item.id || item.code || ''),
        name: cleanProductName(item.name || item.title || ''),
        brand: item.brand?.name || item.brand || 'Leroy Merlin',
        ean: item.ean || item.code || '',
        price: Number(item.price?.to || item.price?.value || item.price || 0),
        listPrice: Number(item.price?.from || item.price?.listPrice || item.price || 0),
        available: true,
        url: item.url ? `https://www.leroymerlin.com.br${item.url}` : '',
        image: item.picture?.url || item.image || item.photos?.[0]?.url || '',
        categories: item.categories || [],
        description: item.description || ''
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.warn(`[Leroy Merlin] Falha na busca (${query}):`, err.message);
    return [];
  }
}

/**
 * Higieniza o nome do produto removendo menções proprietárias de concorrentes
 */
function cleanProductName(name) {
  if (!name) return '';
  return name
    .replace(/\|\s*Normatel/gi, '')
    .replace(/\|\s*Acal/gi, '')
    .replace(/\|\s*Carajás/gi, '')
    .replace(/\|\s*Leroy Merlin/gi, '')
    .replace(/Exclusivo\s+(Acal|Normatel|Carajás|Leroy\s*Merlin)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca unificada nos 4 Home Centers
 */
async function searchAllStores(query) {
  console.log(`\n🔍 Pesquisando "${query}" nas 4 grandes redes (Normatel, Carajás, Acal, Leroy Merlin)...`);
  
  const [normatel, carajas, acal, leroy] = await Promise.all([
    searchNormatel(query),
    searchCarajas(query),
    searchAcal(query),
    searchLeroy(query),
  ]);

  const all = [...normatel, ...carajas, ...acal, ...leroy];

  console.log(`\n✅ Resultados Encontrados: ${all.length} produtos`);
  console.log(`- Normatel: ${normatel.length}`);
  console.log(`- Carajás: ${carajas.length}`);
  console.log(`- Acal: ${acal.length}`);
  console.log(`- Leroy Merlin: ${leroy.length}`);

  return {
    query,
    total: all.length,
    stores: {
      normatel,
      carajas,
      acal,
      leroy
    },
    products: all
  };
}

module.exports = {
  searchNormatel,
  searchCarajas,
  searchAcal,
  searchLeroy,
  searchAllStores
};

// Execução direta no terminal (CLI)
if (require.main === module) {
  const searchTerm = process.argv.slice(2).join(' ') || 'Cimento CP II';
  searchAllStores(searchTerm).then(res => {
    console.log('\n--- 📋 Top 5 Produtos de Referência ---');
    res.products.slice(0, 5).forEach((p, idx) => {
      console.log(`${idx + 1}. [${p.store}] ${p.name}`);
      console.log(`   Preço: R$ ${p.price.toFixed(2)} | Marca: ${p.brand} | EAN: ${p.ean || 'N/A'}`);
      console.log(`   Foto: ${p.image ? p.image.slice(0, 60) + '...' : 'Sem foto'}`);
    });
  }).catch(console.error);
}
