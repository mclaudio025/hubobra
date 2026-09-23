const https = require('https');

const supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

const categoryPhotos = {
  'pisos-e-revestimentos': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&auto=format&fit=crop&q=80',
  'tintas-e-vernizes': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80',
  'tintas-acrilicas': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80',
  'esmaltes': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80',
  'vernizes': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&auto=format&fit=crop&q=80',
  'ferramentas': 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80',
  'eletrica': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
  'hidraulica': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80',
  'cimento-e-argamassa': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
  'cimento-portland': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
  'argamassa': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80',
  'tijolos-e-blocos': 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&auto=format&fit=crop&q=80',
  'tijolos-ceramicos': 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&auto=format&fit=crop&q=80',
  'blocos-concreto': 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400&auto=format&fit=crop&q=80',
  'aditivos': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80',
  'telhas-e-coberturas': 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400&auto=format&fit=crop&q=80',
  'madeiras': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&auto=format&fit=crop&q=80',
  'ferragens': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&auto=format&fit=crop&q=80',
};

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({ raw: d });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🔄 Buscando categorias no Supabase...');
  const categories = await request('GET', '/rest/v1/categories?select=*');

  if (!Array.isArray(categories)) {
    console.error('❌ Erro ao buscar categorias:', categories);
    return;
  }

  console.log(`📦 Encontradas ${categories.length} categorias no Supabase.`);
  let updatedCount = 0;

  for (const cat of categories) {
    const photo = categoryPhotos[cat.slug];
    if (photo) {
      console.log(`🖼️ Atualizando imagem da categoria "${cat.name}" (${cat.slug})...`);
      await request('PATCH', `/rest/v1/categories?id=eq.${cat.id}`, { image: photo });
      updatedCount++;
    }
  }

  console.log(`\n🎉 Concluído! ${updatedCount} categorias tiveram suas fotos oficiais de construção civil atualizadas no Supabase.`);
}

run();
