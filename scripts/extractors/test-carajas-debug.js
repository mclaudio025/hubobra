const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testCarajasQuery(term) {
  console.log(`\n--- Testando Carajás para: "${term}" ---`);
  const urls = [
    `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(term)}&_from=0&_to=15`,
    `https://www.carajas.com.br/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=15`,
    `https://www.carajas.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(term)}`,
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Referer': 'https://www.carajas.com.br/',
          'Accept': 'application/json',
        },
        timeout: 6000,
      });
      console.log(`OK: ${url.slice(0, 70)}... -> Status: ${res.status} -> Data type: ${typeof res.data} -> Count: ${Array.isArray(res.data) ? res.data.length : (res.data?.products?.length || 'obj')}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log(`   Primeiro item: ${res.data[0].productName}`);
      } else if (res.data?.products?.length > 0) {
        console.log(`   Primeiro item (IS): ${res.data.products[0].productName}`);
      }
    } catch (e) {
      console.log(`FAIL: ${url.slice(0, 70)}... -> ${e.response?.status || e.message}`);
    }
  }
}

async function run() {
  await testCarajasQuery('Caixa 4x2');
  await testCarajasQuery('Caixa de Luz');
  await testCarajasQuery('Tinta Suvinil');
}

run();
