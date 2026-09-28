const https = require('https');

const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';
const TEST_AUDIO_URL = 'https://file.aiquickdraw.com/as/821f20475ef328d79c05de9848c336d4_1790552970136.wav';
const PHONE = '558589219126';

function testSendAudio(filePayload, description) {
  return new Promise((resolve) => {
    console.log(`\n--- Testando envio de áudio para Uazapi (${description}) ---`);
    const payload = JSON.stringify({
      number: PHONE,
      file: filePayload,
      type: 'audio',
      ptt: true
    });

    const options = {
      host: 'hubobra.uazapi.com',
      path: '/send/media',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': UAZAPI_TOKEN,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status Uazapi: ${res.statusCode}`);
        console.log(`Resposta:`, data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log('Erro na requisição:', err.message);
      resolve({ error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  // Testar envio por URL direta
  await testSendAudio(TEST_AUDIO_URL, 'URL Direta HTTPS');
}

run();
