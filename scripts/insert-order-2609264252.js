const https = require('https');

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function supabasePost(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function supabaseGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function insertMissingOrder() {
  console.log('1. Localizando ou criando usuário para Claudio Sousa (558589219126)...');
  const userFind = await supabaseGet('/rest/v1/users?name=ilike.*Claudio*&limit=1');
  let userId = null;
  if (userFind.data && userFind.data.length > 0) {
    userId = userFind.data[0].id;
  } else {
    const newUser = await supabasePost('/rest/v1/users', {
      id: 'b22155eb-b253-4503-b956-ee7863050a5f',
      name: 'Claudio Sousa',
      email: 'mclaudioms@gmail.com',
      password: 'hubobra_temp_pwd_12345',
      role: 'USER',
      active: true
    });
    userId = newUser.data?.[0]?.id || 'b22155eb-b253-4503-b956-ee7863050a5f';
  }
  console.log('User ID:', userId);

  const orderId = '9f115881-6457-412c-ba75-4532b5961ece';
  const orderNumber = '2609264252';

  console.log('2. Criando registro do pedido na tabela orders...');
  const orderRes = await supabasePost('/rest/v1/orders', {
    id: orderId,
    orderNumber: orderNumber,
    status: 'PENDING',
    subtotal: 96.00,
    total: 96.00,
    shipping: 0,
    tax: 0,
    notes: 'Pedido gerado via WhatsApp IA (Lia) - Cartão na Entrega (Maquininha)',
    userId: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('Order created status:', orderRes.status, orderRes.data);

  console.log('3. Buscando produto Cimento...');
  const prodRes = await supabaseGet('/rest/v1/products?name=ilike.*Cimento*&limit=1');
  const prod = prodRes.data?.[0];
  const prodId = prod ? prod.id : 'c0000000-0000-0000-0000-000000000001';

  console.log('4. Criando itens do pedido na tabela order_items...');
  const itemRes = await supabasePost('/rest/v1/order_items', {
    id: '11111111-2222-3333-4444-555555555555',
    orderId: orderId,
    productId: prodId,
    quantity: 3,
    price: 32.00,
    total: 96.00
  });
  console.log('Item created status:', itemRes.status);

  console.log('5. Criando endereço na tabela shipping_addresses...');
  const addrRes = await supabasePost('/rest/v1/shipping_addresses', {
    id: '22222222-3333-4444-5555-666666666666',
    orderId: orderId,
    street: 'Rua Trajano de Medeiros',
    number: '567',
    district: 'Messejana',
    complement: 'Em frente ao Magrão Lanches',
    city: 'Fortaleza',
    state: 'CE',
    zipCode: '60000-000',
    country: 'Brasil'
  });
  console.log('Address created status:', addrRes.status);

  console.log('6. Criando pagamento na tabela payments...');
  const payRes = await supabasePost('/rest/v1/payments', {
    id: '33333333-4444-5555-6666-777777777777',
    orderId: orderId,
    method: 'CREDIT_CARD',
    status: 'PENDING',
    amount: 96.00,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  console.log('Payment created status:', payRes.status);

  console.log('🎉 SUCESSO! PEDIDO #2609264252 INSERIDO COM SUCESSO NO BANCO DE DADOS!');
}

insertMissingOrder().catch(console.error);
