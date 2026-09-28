const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

async function sendCustomerMessage(phone, name, text) {
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

async function getLatestExecutionText() {
  return new Promise((resolve) => {
    https.request({
      host: N8N_HOST,
      path: '/api/v1/executions?workflowId=' + WORKFLOW_ID + '&limit=1',
      headers: {
        'Host': N8N_HEADER_HOST,
        'X-N8N-API-KEY': API_KEY
      },
      rejectUnauthorized: false
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const list = JSON.parse(data);
          const execId = list.data[0].id;
          https.request({
            host: N8N_HOST,
            path: '/api/v1/executions/' + execId + '?includeData=true',
            headers: {
              'Host': N8N_HEADER_HOST,
              'X-N8N-API-KEY': API_KEY
            },
            rejectUnauthorized: false
          }, res2 => {
            let data2 = '';
            res2.on('data', c => data2 += c);
            res2.on('end', () => {
              const detail = JSON.parse(data2);
              const sendText = detail.data?.resultData?.runData?.['📤 Enviar Texto']?.[0]?.data?.main?.[0]?.[0]?.json;
              resolve(sendText);
            });
          }).end();
        } catch(e) {
          resolve(null);
        }
      });
    }).end();
  });
}

async function run() {
  console.log('🧪 Cliente comum perguntando sobre o termo recém-aprendido ("massa plástica")...');
  await sendCustomerMessage('5585988776655', 'Marcio Pedreiro', 'Opa Lia, vocês tem massa plástica aí na loja?');
  
  console.log('⏳ Aguardando resposta da IA...');
  await new Promise(r => setTimeout(r, 6000));

  const reply = await getLatestExecutionText();
  console.log('\n======================================================');
  console.log('🤖 RESPOSTA DA LIA AO CLIENTE USANDO O NOVO APRENDIZADO:');
  console.log(reply?.text || reply?.message || reply);
  console.log('======================================================\n');
}

run().catch(console.error);
