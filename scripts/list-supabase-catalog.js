const https = require('https');

const supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function get(path) {
  return new Promise((resolve, reject) => {
    https.get(supabaseUrl + path, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function run() {
  const [products, images] = await Promise.all([
    get('/rest/v1/products?select=id,name,price,brand,stock&active=eq.true'),
    get('/rest/v1/product_images?select=productId,url,alt')
  ]);

  const map = {};
  if (Array.isArray(images)) {
    images.forEach(img => {
      if (!map[img.productId]) map[img.productId] = [];
      map[img.productId].push(img.url);
    });
  }

  console.log('=== PRODUTOS E IMAGENS REAIS DO SUPABASE ===');
  if (Array.isArray(products)) {
    products.forEach(p => {
      const imgs = map[p.id] || [];
      console.log(`• Nome: "${p.name}" | R$ ${p.price} | Marca: ${p.brand || 'N/A'}`);
      console.log(`  Foto Oficial: ${imgs[0] || 'SEM FOTO'}`);
    });
  }
}

run();
