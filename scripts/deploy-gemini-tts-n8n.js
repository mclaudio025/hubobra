const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const KIE_API_KEY = 'b30b1489000ba908bd72cc04e0d6cc16';

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

const JS_KIE_GEMINI_TTS = `// 🗣️ GERAR ÁUDIO GEMINI 2.5 PRO TTS VIA KIE.AI (VOZES AOEDE E CHARON)
const item = $input.first().json;
const text = item.speechText;
const isZe = Boolean(item.isZePersona);
const voiceName = isZe ? 'Charon' : 'Aoede';
const apiKey = '${KIE_API_KEY}';

// 1. Criar tarefa na Kie
const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2-5-pro-tts',
    input: {
      speakers: [
        {
          speaker_id: 'Speaker 1',
          voice_name: voiceName
        }
      ],
      dialogue_turns: [
        {
          speaker_id: 'Speaker 1',
          text: text
        }
      ]
    }
  })
});

const createData = await createRes.json();
const taskId = createData.data?.taskId || createData.data?.recordId;

if (!taskId) {
  throw new Error('Falha ao obter taskId na Kie: ' + JSON.stringify(createData));
}

// 2. Polling até obter o áudio pronto
let audioUrl = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 1200));
  const pollRes = await fetch('https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId, {
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
  if (pollRes.ok) {
    const pollData = await pollRes.json();
    if (pollData.data?.state === 'success' && pollData.data?.response?.resultUrls?.[0]) {
      audioUrl = pollData.data.response.resultUrls[0];
      break;
    }
    if (pollData.data?.state === 'failed') {
      throw new Error('Falha ao gerar áudio na Kie: ' + (pollData.data?.failMsg || 'Erro'));
    }
  }
}

if (!audioUrl) {
  throw new Error('Timeout gerando áudio Gemini TTS na Kie');
}

// 3. Baixar o arquivo de áudio e retornar como binário para o nó de envio
const audioFetch = await fetch(audioUrl);
const audioBuffer = await audioFetch.arrayBuffer();

return [{
  json: {
    ...item,
    audioGeneratedUrl: audioUrl,
    voiceUsed: voiceName,
    engine: 'Gemini-2.5-Pro-TTS'
  },
  binary: {
    data: {
      data: Buffer.from(audioBuffer).toString('base64'),
      mimeType: 'audio/wav',
      fileName: 'audio_hubobra.wav'
    }
  }
}];`;

async function deployGeminiTtsToN8N() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  // Atualizar o nó Gerar Áudio (ID: openai-generate-tts) mantendo o nome exato para preservar conexões
  nodes = nodes.map(node => {
    if (node.id === 'openai-generate-tts' || node.name.includes('Gerar Áudio')) {
      node.type = 'n8n-nodes-base.code';
      node.typeVersion = 2;
      node.parameters = {
        jsCode: JS_KIE_GEMINI_TTS
      };
      delete node.credentials;
    }
    return node;
  });

  console.log('📦 Enviando atualização com Gemini Studio TTS para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! VOZES DO GEMINI TTS (AOEDE & CHARON) ATIVADAS NO WHATSAPP DA HUBOBRA!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployGeminiTtsToN8N().catch(console.error);
