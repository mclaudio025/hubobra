const https = require('https');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&eacute;/gi, 'é')
    .replace(/&aacute;/gi, 'á')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function fetchSearchHTML(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const req = https.request({
      host: 'www.jcmateriais.com.br',
      path: `/search/?q=${encoded}`,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Extrator Conector JC Materiais de Construção (Nuvemshop)
 */
async function searchJCMateriais(query) {
  try {
    const html = await fetchSearchHTML(query);
    if (!html) return [];

    const products = [];
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']\s+data-component=['"]structured-data\.item['"]>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const item = JSON.parse(match[1].trim());
        if (item['@type'] === 'Product') {
          const offer = item.offers || {};
          const brand = typeof item.brand === 'object' ? item.brand.name : (item.brand || 'JC Materiais');
          const price = parseFloat(offer.price) || 0;
          const url = offer.url || item.mainEntityOfPage?.['@id'] || '';
          let image = Array.isArray(item.image) ? item.image[0] : (item.image || '');
          if (image.startsWith('//')) image = 'https:' + image;
          
          const stock = offer.inventoryLevel?.value ? parseInt(offer.inventoryLevel.value) : 0;
          const available = offer.availability ? offer.availability.includes('InStock') : true;

          const rawName = item.name ? decodeHtmlEntities(item.name).trim() : '';
          const rawDesc = item.description ? decodeHtmlEntities(item.description).trim() : '';

          if (price > 0 && rawName) {
            products.push({
              store: 'JC Materiais',
              storeLogo: 'https://www.jcmateriais.com.br/favicon.ico',
              productId: String(item.sku || ''),
              name: rawName,
              brand: brand,
              ean: item.sku || '',
              price: price,
              listPrice: price,
              stock: stock,
              available: available,
              url: url,
              image: image,
              categories: [],
              description: rawDesc
            });
          }
        }
      } catch (e) {
        // Ignora JSON mal formatado individual
      }
    }

    return products;
  } catch (err) {
    console.warn(`[JC Materiais] Falha na busca (${query}):`, err.message);
    return [];
  }
}

// Teste direto
if (require.main === module) {
  const query = process.argv.slice(2).join(' ') || 'Joelho 90 soldavel';
  console.log(`🔍 Buscando "${query}" na JC Materiais...`);
  searchJCMateriais(query).then(res => {
    console.log(`✅ Encontrados ${res.length} produtos na JC Materiais:\n`);
    res.slice(0, 5).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
      console.log(`   Preço: R$ ${p.price.toFixed(2)} | Marca: ${p.brand} | Estoque: ${p.stock} un`);
      console.log(`   SKU: ${p.productId} | Foto: ${p.image}`);
      console.log(`   Link: ${p.url}\n`);
    });
  }).catch(console.error);
}

module.exports = { searchJCMateriais };
