const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

function requestN8N(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      host: N8N_HOST,
      path: '/api/v1' + endpoint,
      method,
      headers: {
        'Host': N8N_HEADER_HOST,
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
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

async function checkLatestExecutions() {
  const res = await requestN8N(`/executions?workflowId=${WORKFLOW_ID}&limit=3`);
  if (!res.data?.data) {
    console.log('Sem execuções');
    return;
  }

  for (const exec of res.data.data) {
    console.log(`\n=== EXECUÇÃO ${exec.id} (${exec.status}) em ${exec.startedAt} ===`);
    const detail = await requestN8N(`/executions/${exec.id}?includeData=true`);
    const runData = detail.data?.data?.resultData?.runData || detail.data?.resultData?.runData;
    
    if (runData) {
      for (const nodeName in runData) {
        const runs = runData[nodeName];
        const hasErr = runs.some(r => r.error);
        if (hasErr) {
          console.log(`❌ ${nodeName} ERRO:`, JSON.stringify(runs[0].error, null, 2));
        } else if (nodeName.includes('Gerar Áudio') || nodeName.includes('Enviar Áudio') || nodeName.includes('Codificar') || nodeName.includes('Cliente Mandou Áudio')) {
          console.log(`✅ ${nodeName}:`, JSON.stringify(runs[0]?.data?.main?.[0]?.[0]?.json || runs[0]?.data?.main?.[0] || 'vazio', null, 2));
        }
      }
    }
  }
}

checkLatestExecutions();
