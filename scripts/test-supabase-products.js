const https = require('https');

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function getProducts() {
  const options = {
    host: 'zeywqzkmevytzkdbzwni.supabase.co',
    path: '/rest/v1/products?select=name,brand,price,images:product_images(url)&order=name.asc&limit=15',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status Supabase:', res.statusCode);
      try {
        const list = JSON.parse(data);
        console.log(`Retornou ${list.length} produtos. Exemplos:`);
        list.slice(0, 5).forEach(p => console.log(`- ${p.name} (${p.brand}): R$ ${p.price}`));
      } catch(e) {
        console.log('Erro:', data);
      }
    });
  });

  req.on('error', console.error);
  req.end();
}

getProducts();
