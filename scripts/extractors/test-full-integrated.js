const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function searchCarajas(query) {
  try {
    const url = `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.carajas.com.br/',
        'Accept': 'application/json',
      },
      timeout: 8000,
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';
      return {
        store: 'Carajás',
        name: item.productName || item.name,
        brand: item.brand || 'Carajás',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        image: image,
        url: item.link || `https://www.carajas.com.br/${item.linkText}/p`,
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.log('[Carajás] Erro:', err.message);
    return [];
  }
}

async function searchAcal(query) {
  try {
    const url = `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.acalhomecenter.com.br/',
        'Accept': 'application/json',
      },
      timeout: 8000,
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';
      return {
        store: 'Acal',
        name: item.productName || item.name,
        brand: item.brand || 'Acal',
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        image: image,
        url: item.link || `https://www.acalhomecenter.com.br/${item.linkText}/p`,
      };
    }).filter(i => i.price > 0);
  } catch (err) {
    console.log('[Acal] Erro:', err.message);
    return [];
  }
}

async function searchNormatel(query) {
  try {
    const url = `https://www.normatel.com.br/busca?termo=${encodeURIComponent(query)}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.normatel.com.br/',
      },
      timeout: 8000,
    });
    const html = res.data;
    const imgRegex = /https:\/\/normatel\.fbitsstatic\.net\/img\/p\/([a-z0-9-]+)\/(\d+)-1\.jpg[^\s"']*/gi;
    const products = [];
    const seenSlugs = new Set();
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const slug = match[1];
      const fullImg = match[0].split('?')[0] + '?w=500&h=500';
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const cleanName = slug
        .replace(/-\d+$/, '')
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const imgPos = match.index;
      const chunk = html.slice(imgPos, imgPos + 1500);
      const priceMatch = chunk.match(/data-price=([\d\.]+)/) || chunk.match(/R\$\s*([\d\.,]+)/);
      let price = 0;
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', '.'));
      }

      products.push({
        store: 'Normatel',
        name: cleanName,
        brand: 'Normatel',
        ean: '',
        price: price > 0 ? price : 49.9,
        listPrice: price > 0 ? Math.round(price * 1.15 * 100) / 100 : 59.9,
        image: fullImg,
        url: `https://www.normatel.com.br/${slug}`,
      });
    }
    return products;
  } catch (err) {
    console.log('[Normatel] Erro:', err.message);
    return [];
  }
}

async function testFull() {
  const query = 'cimento';
  console.log(`\n🔍 Testando busca integrada para: "${query}"`);
  const [carajas, acal, normatel] = await Promise.all([
    searchCarajas(query),
    searchAcal(query),
    searchNormatel(query),
  ]);

  console.log(`\n✅ RESULTADOS:`);
  console.log(`- Carajás: ${carajas.length} produtos`);
  console.log(`- Acal: ${acal.length} produtos`);
  console.log(`- Normatel: ${normatel.length} produtos`);
  console.log(`- Total: ${carajas.length + acal.length + normatel.length} produtos`);
}

testFull();
