const axios = require('axios');

async function testWake() {
  const token = 'tcs_norma_b560a74eb4fe44dfab40ebe312306382';
  const urls = [
    'https://api.fbits.net/produtos?termo=cimento',
    'https://api.fbits.net/search?term=cimento',
    'https://api.wakecommerce.com.br/v1/products/search?query=cimento',
    'https://normatel.fbitsstore.com.br/api/produtos?termo=cimento',
    'https://www.normatel.com.br/api/produtos?termo=cimento',
    'https://www.normatel.com.br/api/busca?q=cimento',
    'https://www.normatel.com.br/api/search?q=cimento',
    'https://www.normatel.com.br/produtos?termo=cimento',
    'https://www.normatel.com.br/busca?termo=cimento',
  ];

  for (const u of urls) {
    try {
      const res = await axios.get(u, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Tcs-Token': token,
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 5000
      });
      console.log('SUCCESS:', u, '-> Status:', res.status, 'Type:', typeof res.data, 'Length:', res.data?.length || res.data?.produtos?.length);
    } catch(e) {
      console.log('FAILED:', u, '-> Status:', e.response?.status || e.message);
    }
  }
}
testWake();
