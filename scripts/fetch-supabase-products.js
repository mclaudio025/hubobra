const https = require('https');

const supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function get(path) {
  return new Promise((resolve, reject) => {
    https.get(supabaseUrl + path, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch(e) {
          resolve({ raw: d });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const products = await get('/rest/v1/products?select=*');
  console.log('Total de produtos encontrados:', Array.isArray(products) ? products.length : 'Erro');
  if (Array.isArray(products)) {
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. [ID: ${p.id}] ${p.name || p.title} | Preço: R$ ${p.price}`);
      console.log('   Imagens / Photos:', JSON.stringify(p.images || p.image || p.photo || p.photos || p.image_url || p.imageUrl));
    });
  } else {
    console.log(products);
  }
}

run();
