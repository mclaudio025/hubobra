const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testAll() {
  console.log('=== TESTE DE CONEXÃO DOS HOME CENTERS ===\n');

  // 1. Carajás
  try {
    const cRes = await axios.get('https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=cimento&_from=0&_to=5', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Referer': 'https://www.carajas.com.br/',
      },
      timeout: 8000
    });
    console.log('✅ Carajás: OK (' + cRes.data.length + ' produtos encontrados)');
  } catch (e) {
    console.log('❌ Carajás: Erro ->', e.response?.status || e.message);
  }

  // 2. Acal
  try {
    const aRes = await axios.get('https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=cimento&_from=0&_to=5', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Referer': 'https://www.acalhomecenter.com.br/',
      },
      timeout: 8000
    });
    console.log('✅ Acal: OK (' + aRes.data.length + ' produtos encontrados)');
  } catch (e) {
    console.log('❌ Acal: Erro ->', e.response?.status || e.message);
  }

  // 3. Normatel
  try {
    const nRes = await axios.get('https://www.normatel.com.br/', {
      headers: { 'User-Agent': userAgent },
      timeout: 8000
    });
    console.log('ℹ️ Normatel Homepage carregada (' + nRes.data.length + ' bytes)');
    const vtexMatches = (nRes.data.match(/vtex/gi) || []).length;
    const linxMatches = (nRes.data.match(/linx|chaordic|neemu|wake|tray|nuvemshop|shopify|magento|deco/gi) || []);
    console.log('   - VTEX tags:', vtexMatches);
    console.log('   - Outras tags:', linxMatches);
  } catch (e) {
    console.log('❌ Normatel: Erro ->', e.response?.status || e.message);
  }

  // 4. Leroy Merlin
  try {
    const lRes = await axios.get('https://www.leroymerlin.com.br/api/v2/products?term=cimento&page=1&perPage=5', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Referer': 'https://www.leroymerlin.com.br/',
      },
      timeout: 8000
    });
    console.log('✅ Leroy Merlin: OK (' + (lRes.data.products?.length || lRes.data.data?.length || 0) + ' produtos)');
  } catch (e) {
    console.log('❌ Leroy Merlin: Erro ->', e.response?.status || e.message);
  }
}

testAll();
