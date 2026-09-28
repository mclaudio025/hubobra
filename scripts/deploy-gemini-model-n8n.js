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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function switchToGemini() {
  console.log('🚀 Buscando workflow atual...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  if (current.status !== 200) {
    console.error('Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  // Substituir o modelo da OpenAI pelo Google Gemini 2.5 Flash
  nodes = nodes.map(n => {
    if (n.id === 'openai-model' || n.name.includes('Chat Model')) {
      return {
        id: 'google-gemini-model',
        name: 'Google Gemini Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        typeVersion: 1,
        position: n.position,
        parameters: {
          modelName: 'models/gemini-2.5-flash',
          options: {
            temperature: 0.2
          }
        },
        credentials: {
          googlePalmApi: {
            id: 'ReYrBIedAeEJeyLk',
            name: 'Google Gemini Account New'
          }
        }
      };
    }
    return n;
  });

  // Atualizar conexões de modelo de linguagem
  delete connections['OpenAI Chat Model'];
  connections['Google Gemini Chat Model'] = {
    ai_languageModel: [
      [
        {
          node: '🤖 Agente IA (Lia + Zé da Obra)',
          type: 'ai_languageModel',
          index: 0
        }
      ]
    ]
  };

  console.log('📦 Enviando atualização para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO! A LIA AGORA ESTÁ OPERANDO 100% COM O GOOGLE GEMINI 2.5 FLASH!');
  } else {
    console.error('Erro ao salvar:', updateRes.data || updateRes.raw);
  }
}

switchToGemini().catch(console.error);
