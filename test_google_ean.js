const https = require('https');

async function fetchHtml(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function lookupGoogleEan(ean) {
  // 1. Query DuckDuckGo Lite / HTML for EAN
  console.log('--- 1. Querying DuckDuckGo HTML for EAN:', ean);
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(ean)}`;
  const ddgHtml = await fetchHtml(ddgUrl, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  });

  // Extract result titles from DDG
  const ddgTitles = [];
  const ddgRegex = /<a class="result__url"[^>]*>(.*?)<\/a>.*?<a class="result__snippet"[^>]*>(.*?)<\/a>/gis;
  const linkRegex = /<a class="result__snippet"[^>]*>(.*?)<\/a>/gis;
  const titleRegex = /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/gis;
  
  let m;
  while ((m = titleRegex.exec(ddgHtml)) !== null) {
    const raw = m[1].replace(/<[^>]+>/g, '').trim();
    if (raw) ddgTitles.push(raw);
  }
  console.log('DDG Titles found:', ddgTitles);

  // 2. Query Google Search with headers
  console.log('--- 2. Querying Google Search for EAN:', ean);
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(ean)}&hl=pt-BR&gl=br&num=5`;
  const googleHtml = await fetchHtml(googleUrl, {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9',
  });

  // Extract titles / snippets from Google mobile HTML
  const gTitles = [];
  const gRegex = /<div class="BNeawe vvjwJb AP7Wnd"[^>]*>(.*?)<\/div>/gis;
  let gm;
  while ((gm = gRegex.exec(googleHtml)) !== null) {
    const title = gm[1].replace(/<[^>]+>/g, '').trim();
    if (title) gTitles.push(title);
  }
  console.log('Google Mobile Titles found:', gTitles);

  // Also check standard h3
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gis;
  let hm;
  const h3Titles = [];
  while ((hm = h3Regex.exec(googleHtml)) !== null) {
    const title = hm[1].replace(/<[^>]+>/g, '').trim();
    if (title) h3Titles.push(title);
  }
  console.log('Google H3 Titles:', h3Titles);
}

lookupGoogleEan('7898693159388');
