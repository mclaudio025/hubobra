const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

async function sendMasterMessage(text) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      phone: '558589219126',
      name: 'Claudio Sousa',
      fromMe: false,
      message: {
        text: text,
        fromMe: false,
        wasSentByApi: false
      }
    });

    const req = https.request({
      host: N8N_HOST,
      path: '/webhook/hubobra-whatsapp',
      method: 'POST',
      headers: {
        'Host': N8N_HEADER_HOST,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      rejectUnauthorized: false
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.write(payload);
    req.end();
  });
}

async function checkTrainers() {
  return new Promise((resolve) => {
    https.get(SUPABASE_URL + '/rest/v1/ai_trainers?select=*&order=created_at.desc', {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

async function run() {
  console.log('🧪 Master Trainer (Claudio) autorizando novo vendedor pelo WhatsApp...');
  await sendMasterMessage('Lia, autoriza o número 5585999991122 do João Balcão como treinador.');

  console.log('⏳ Aguardando cadastro automático...');
  await new Promise(r => setTimeout(r, 6000));

  const list = await checkTrainers();
  console.log('\n📋 Treinadores cadastrados no Supabase:');
  console.log(list);
}

run().catch(console.error);
