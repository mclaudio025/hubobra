const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';

async function sendTestMessage(text) {
  return new Promise((resolve, reject) => {
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

async function run() {
  console.log('🧪 Testando envio de mensagem com gíria cearense...');
  const res = await sendTestMessage('Cuida Lia! Quanto tá o rabicho de pia e 2 cotovelo de 25?');
  console.log('Webhook Status:', res.status, res.body);
}

run().catch(console.error);
