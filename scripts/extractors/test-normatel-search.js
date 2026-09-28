const axios = require('axios');

async function scrapeNormatel(query) {
  const url = `https://www.normatel.com.br/busca?termo=${encodeURIComponent(query)}`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }
  });

  const html = res.data;
  
  // Encontrar blocos de produtos
  // No HTML da Normatel, cada produto tem uma imagem em normatel.fbitsstatic.net/img/p/<slug>/<id>.jpg
  const imgRegex = /https:\/\/normatel\.fbitsstatic\.net\/img\/p\/([a-z0-9-]+)\/(\d+)-1\.jpg[^\s"']*/gi;
  const products = [];
  const seenSlugs = new Set();
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const slug = match[1];
    const fullImg = match[0].split('?')[0] + '?w=500&h=500';
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    // Formatar nome a partir do slug
    const cleanName = slug
      .replace(/-\d+$/, '') // remove ID final
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Buscar trecho próximo para encontrar o preço
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
      price: price > 0 ? price : 49.9,
      image: fullImg,
      url: `https://www.normatel.com.br/${slug}`,
      brand: 'Normatel',
      ean: '',
    });
  }

  console.log(`✅ Normatel Extração: Encontrados ${products.length} produtos para "${query}":`);
  console.log(products.slice(0, 5));
  return products;
}

scrapeNormatel('cimento');
scrapeNormatel('tinta suvinil');
