const https = require('https');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: 'www.jcmateriais.com.br',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
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

async function inspectProductCard() {
  const html = await fetchPage('/search/?q=cimento');
  
  // Encontrar o bloco de um produto
  const startIdx = html.indexOf('class="js-product-item-private product-item');
  if (startIdx !== -1) {
    const endIdx = html.indexOf('class="js-product-item-private product-item', startIdx + 50);
    const cardHtml = html.substring(startIdx, endIdx !== -1 ? endIdx : startIdx + 4000);
    console.log('=== CARD COMPLETO ===');
    console.log(cardHtml);
  }
}

inspectProductCard().catch(console.error);
