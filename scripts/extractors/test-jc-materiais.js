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

async function analyze() {
  console.log('Buscando produtos em jcmateriais.com.br...');
  const html = await fetchPage('/search/?q=cimento');
  
  console.log('Tamanho da resposta:', html.length);

  // Procurar scripts com dados JSON
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('"itemListElement"') || content.includes('"@type":"Product"')) {
      console.log('Encontrado Schema JSON-LD Product/ItemList!');
      console.log(content.substring(0, 500));
    }
  }

  // Analisar links de produtos (/produtos/...)
  const productLinkRegex = /href=["'](https?:\/\/www\.jcmateriais\.com\.br\/produtos\/[^"']+|\/produtos\/[^"']+)["']/gi;
  const links = new Set();
  while ((match = productLinkRegex.exec(html)) !== null) {
    links.add(match[1]);
  }
  console.log('Total de links de produtos encontrados:', links.size);
  console.log('Exemplos de links:', Array.from(links).slice(0, 5));

  // Vamos inspecionar um trecho de card de produto da Nuvemshop
  const itemMatch = html.match(/<div[^>]*class=["'][^"']*js-item-product[^"']*["'][\s\S]*?<\/div>\s*<\/div>/i) ||
                    html.match(/<div[^>]*data-product-id[^>]*>[\s\S]*?<\/div>/i) ||
                    html.match(/<article[^>]*>[\s\S]*?<\/article>/i);
  
  if (itemMatch) {
    console.log('\n--- CARD DE PRODUTO ENCONTRADO ---');
    console.log(itemMatch[0].substring(0, 1000));
  } else {
    console.log('Buscando trechos com data-product ou data-store...');
    const dataStoreMatch = html.match(/data-store="product-item-[^"]*"/g);
    console.log('data-store matches:', dataStoreMatch);
  }
}

analyze().catch(console.error);
