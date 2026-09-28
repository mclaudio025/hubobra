const axios = require('axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testStores() {
  const query = 'tinta suvinil';
  console.log(`=== Buscando "${query}" em múltiplos Home Centers ===\n`);

  // 1. Carajás
  try {
    const res = await axios.get(`https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=5`, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.carajas.com.br/',
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Carajás: ${res.data.length} itens encontrados.`);
    if (res.data.length > 0) {
      console.log(`   Exemplo: [${res.data[0].brand}] ${res.data[0].productName} -> R$ ${res.data[0].items[0]?.sellers[0]?.commertialOffer?.Price}`);
    }
  } catch (e) {
    console.log(`❌ Carajás: ${e.response?.status || e.message}`);
  }

  // 2. Acal
  try {
    const res = await axios.get(`https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=5`, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.acalhomecenter.com.br/',
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Acal: ${res.data.length} itens encontrados.`);
    if (res.data.length > 0) {
      console.log(`   Exemplo: [${res.data[0].brand}] ${res.data[0].productName} -> R$ ${res.data[0].items[0]?.sellers[0]?.commertialOffer?.Price}`);
    }
  } catch (e) {
    console.log(`❌ Acal: ${e.response?.status || e.message}`);
  }

  // 3. Ferreira Costa
  try {
    const res = await axios.get(`https://ferreiracosta.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=5`, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://www.ferreiracosta.com/',
        'Accept': 'application/json',
      }
    });
    console.log(`✅ Ferreira Costa: ${res.data.length} itens encontrados.`);
  } catch (e) {
    console.log(`❌ Ferreira Costa: ${e.response?.status || e.message}`);
  }
}

testStores();
