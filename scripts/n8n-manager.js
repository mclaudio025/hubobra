const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_URL = 'https://n8n-n8n.q6zw3x.easypanel.host/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';

function request(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(N8N_URL + endpoint);
    const options = {
      method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
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

async function listWorkflows() {
  const res = await request('/workflows');
  console.log('Status:', res.status);
  if (res.data && res.data.data) {
    console.log(`\n📋 Encontrados ${res.data.data.length} workflows no n8n:`);
    res.data.data.forEach(w => {
      console.log(`• [${w.active ? '🟢 ATIVO' : '⚪ INATIVO'}] ID: ${w.id} | Nome: "${w.name}"`);
    });
  } else {
    console.log(res);
  }
}

listWorkflows();
