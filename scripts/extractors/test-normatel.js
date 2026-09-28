const axios = require('axios');

async function listScripts() {
  const res = await axios.get('https://www.normatel.com.br/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const inlineScripts = res.data.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('Inline scripts found:', inlineScripts.length);
  for (let i = 0; i < inlineScripts.length; i++) {
    const text = inlineScripts[i];
    if (text.includes('search') || text.includes('location.href') || text.includes('window.location')) {
      console.log(`Script ${i}:`, text.slice(0, 500));
    }
  }
}
listScripts();
