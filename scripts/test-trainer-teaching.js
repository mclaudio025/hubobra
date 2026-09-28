const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

async function sendTestMessage(phone, name, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      phone: phone,
      name: name,
      fromMe: false,
      message: {
        text: text,
        fromMe: false,
        wasSentByApi: false
      }
    });

    const options = {
      host: N8N_HOST,
      path: '/webhook/hubobra-whatsapp',
      method: 'POST',
      headers: {
        'Host': N8N_HEADER_HOST,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function checkSupabaseTerm(slang) {
  return new Promise((resolve) => {
    https.get(SUPABASE_URL + '/rest/v1/ai_construction_terms?slang_term=eq.' + encodeURIComponent(slang) + '&select=*', {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(_) {
          resolve(data);
        }
      });
    });
  });
}

async function run() {
  console.log('🧪 [TESTE 1] Master Trainer (Claudio) ensinando novo termo no WhatsApp...');
  const teachingText = "Lia, anota aí: quando o cliente pedir 'massa plástica', o produto oficial é a 'Massa Plástica Iberê Branca 400g' da categoria Pintura e Adesivos, usada para colar pia e mármore.";
  
  await sendTestMessage('558589219126', 'Claudio Sousa', teachingText);
  console.log('Mensagem de treinamento enviada!');

  console.log('⏳ Aguardando processamento e persistência da IA...');
  await new Promise(r => setTimeout(r, 6000));

  console.log('🔍 Verificando se o termo foi gravado no banco de dados Supabase...');
  const termInDb = await checkSupabaseTerm('massa plástica');
  console.log('Resultado no Supabase:', termInDb);

  if (Array.isArray(termInDb) && termInDb.length > 0) {
    console.log('🎉 SUCESSO ABSOLUTO! A LIA APRENDEU E GRAVOU NO BANCO DE DADOS EM TEMPO REAL!');
  } else {
    console.log('⚠️ Termo ainda não apareceu, verificando logs...');
  }
}

run().catch(console.error);
