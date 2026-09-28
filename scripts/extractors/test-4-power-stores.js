const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function searchStore(storeName, url, logo) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Referer': url,
      },
      timeout: 8000,
    });

    if (!Array.isArray(res.data)) return [];

    return res.data.map(item => {
      const sku = item.items?.[0] || {};
      const seller = sku.sellers?.[0]?.commertialOffer || {};
      const image = sku.images?.[0]?.imageUrl || item.items?.[0]?.images?.[0]?.imageUrl || '';
      return {
        store: storeName,
        storeLogo: logo,
        productId: `${storeName.toLowerCase()}-${item.productId}`,
        name: (item.productName || item.name || '').replace(/\|\s*(Acal|Carajás|Obramax|Telhanorte|Normatel)/gi, '').trim(),
        brand: item.brand || storeName,
        ean: sku.ean || item.productReference || '',
        price: Number(seller.Price) || Number(seller.ListPrice) || 0,
        listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
        image: image,
        url: item.link || '',
      };
    }).filter(i => i.price > 0);
  } catch(e) {
    console.log(`[${storeName}] Erro:`, e.response?.status || e.message);
    return [];
  }
}

async function searchAll(query) {
  console.log(`\n========================================`);
  console.log(`🔍 Pesquisa 4-Lojas: "${query}"`);
  console.log(`========================================`);

  const [carajas, acal, obramax, telhanorte] = await Promise.all([
    searchStore('Carajás', `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, 'https://www.carajas.com.br/arquivos/logo-carajas.png'),
    searchStore('Acal', `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, 'https://www.acalhomecenter.com.br/arquivos/logo-acal.png'),
    searchStore('Obramax', `https://www.obramax.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, 'https://lojaobramax.vteximg.com.br/arquivos/logo-obramax.png'),
    searchStore('Telhanorte', `https://www.telhanorte.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, 'https://telhanorte.vteximg.com.br/arquivos/logo-telhanorte.png'),
  ]);

  console.log(`- Carajás: ${carajas.length}`);
  console.log(`- Acal: ${acal.length}`);
  console.log(`- Obramax: ${obramax.length}`);
  console.log(`- Telhanorte: ${telhanorte.length}`);
  console.log(`🎉 Total Combinado: ${carajas.length + acal.length + obramax.length + telhanorte.length} produtos reais!`);
}

async function run() {
  await searchAll('Caixa 4x2');
  await searchAll('Tinta Suvinil 18L');
  await searchAll('Cimento CP II 50kg');
  await searchAll('Tubo Tigre 100mm');
}

run();
