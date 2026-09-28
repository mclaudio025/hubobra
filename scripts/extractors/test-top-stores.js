const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testStoreSearch(name, url, transformFn) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Referer': url,
      },
      timeout: 6000,
    });

    const items = transformFn(res.data);
    console.log(`✅ [${name}] ${items.length} produtos encontrados`);
    if (items.length > 0) {
      console.log(`   Exemplo: ${items[0].name} | R$ ${items[0].price} | Foto: ${items[0].image?.slice(0, 50)}...`);
    }
    return items;
  } catch (e) {
    console.log(`❌ [${name}] Falha: ${e.response?.status || e.message}`);
    return [];
  }
}

async function testAll() {
  const query = 'Caixa 4x2';
  console.log(`\n🔍 Testando busca para: "${query}" em grandes Home Centers\n`);

  // 1. Carajás
  await testStoreSearch('Carajás', `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, (data) => {
    return (Array.isArray(data) ? data : []).map(i => ({
      name: i.productName,
      price: i.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
      image: i.items?.[0]?.images?.[0]?.imageUrl || '',
    })).filter(i => i.price > 0);
  });

  // 2. Acal
  await testStoreSearch('Acal', `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, (data) => {
    return (Array.isArray(data) ? data : []).map(i => ({
      name: i.productName,
      price: i.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
      image: i.items?.[0]?.images?.[0]?.imageUrl || '',
    })).filter(i => i.price > 0);
  });

  // 3. Obramax
  await testStoreSearch('Obramax', `https://www.obramax.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, (data) => {
    return (Array.isArray(data) ? data : []).map(i => ({
      name: i.productName,
      price: i.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
      image: i.items?.[0]?.images?.[0]?.imageUrl || '',
    })).filter(i => i.price > 0);
  });

  // 4. Telhanorte
  await testStoreSearch('Telhanorte', `https://www.telhanorte.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, (data) => {
    return (Array.isArray(data) ? data : []).map(i => ({
      name: i.productName,
      price: i.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
      image: i.items?.[0]?.images?.[0]?.imageUrl || '',
    })).filter(i => i.price > 0);
  });

  // 5. Potiguar
  await testStoreSearch('Potiguar', `https://www.apotiguar.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=15`, (data) => {
    return (Array.isArray(data) ? data : []).map(i => ({
      name: i.productName,
      price: i.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
      image: i.items?.[0]?.images?.[0]?.imageUrl || '',
    })).filter(i => i.price > 0);
  });
}

testAll();
