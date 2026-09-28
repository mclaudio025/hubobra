const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const KIE_API_KEY = 'b30b1489000ba908bd72cc04e0d6cc16';

function requestN8N(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    let payload = null;
    if (body) {
      payload = Buffer.from(JSON.stringify(body), 'utf8');
    }

    const options = {
      host: N8N_HOST,
      path: '/api/v1' + endpoint,
      method,
      headers: {
        'Host': N8N_HEADER_HOST,
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      rejectUnauthorized: false
    };

    if (payload) {
      options.headers['Content-Length'] = payload.length;
    }

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
    if (payload) req.write(payload);
    req.end();
  });
}

// 1. CÓDIGO RESILIENTE DE GERAÇÃO DE ÁUDIO (COM FALLBACK SEGURO - NUNCA TRAVA)
const JS_CODE_GEMINI_TTS_RESILIENT = `// 🗣️ GERAR ÁUDIO GEMINI 2.5 PRO TTS VIA KIE.AI (COM FALLBACK RESILIENTE)
const item = $input.first().json;
const text = item.speechText;
const isZe = Boolean(item.isZePersona);
const voiceName = isZe ? 'Charon' : 'Aoede';
const apiKey = '${KIE_API_KEY}';

if (!text || text.trim().length === 0) {
  return [{ json: { ...item, audioGeneratedUrl: null } }];
}

let audioUrl = null;

try {
  // 1. Criar tarefa na Kie
  const createRes = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.kie.ai/api/v1/jobs/createTask',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: {
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
    },
    json: true,
    timeout: 15000
  });

  const taskId = createRes.data?.taskId || createRes.data?.recordId;
  
  if (taskId) {
    // 2. Polling com até 35 tentativas de 1.2s (42 segundos)
    for (let i = 0; i < 35; i++) {
      await new Promise(r => setTimeout(r, 1200));
      try {
        const pollRes = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
          headers: { 'Authorization': 'Bearer ' + apiKey },
          json: true,
          timeout: 10000
        });
        if (pollRes && pollRes.data?.state === 'success' && pollRes.data?.response?.resultUrls?.[0]) {
          audioUrl = pollRes.data.response.resultUrls[0];
          break;
        }
        if (pollRes && pollRes.data?.state === 'failed') {
          console.error('Falha na Kie:', pollRes.data?.failMsg);
          break;
        }
      } catch(pollErr) {
        console.error('Erro no polling Kie:', pollErr.message);
      }
    }
  }
} catch(err) {
  console.error('Erro na criação de TTS Kie:', err.message);
}

// Retorna sempre com sucesso, garantindo que o fluxo prossiga mesmo se o áudio falhar
return [{
  json: {
    ...item,
    audioGeneratedUrl: audioUrl,
    hasAudioUrl: Boolean(audioUrl),
    voiceUsed: voiceName,
    engine: 'Gemini-2.5-Pro-TTS'
  }
}];`;

// 2. CÓDIGO RESILIENTE DE CODIFICAÇÃO / PREPARAÇÃO DE ÁUDIO
const JS_CODE_ENCODE_AUDIO_RESILIENT = `// 📦 PREPARAR ÁUDIO GEMINI PARA O UAZAPI WHATSAPP (COM FALLBACK)
const item = $input.first().json;
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const phone = initialData.phone || initialData.from || '';

const audioUrl = item.audioGeneratedUrl || '';

return [{
  json: {
    ...item,
    phone: phone,
    file: audioUrl,
    type: 'audio',
    ptt: true,
    hasAudioUrl: Boolean(audioUrl)
  }
}];`;

async function deployResilientFlow() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = existingWf.nodes;
  let connections = existingWf.connections;

  // 1. Atualizar nós de TTS e Codificação
  nodes = nodes.map(node => {
    if (node.id === 'openai-generate-tts' || node.name.includes('Gerar Áudio')) {
      node.parameters = { jsCode: JS_CODE_GEMINI_TTS_RESILIENT };
    }
    if (node.id === 'code-encode-audio-base64' || node.name.includes('Codificar Áudio')) {
      node.parameters = { jsCode: JS_CODE_ENCODE_AUDIO_RESILIENT };
    }
    return node;
  });

  // 2. Se o nó "🎙️ Enviar Áudio Gravado (Uazapi)" for disparado:
  // Se hasAudioUrl for false (áudio falhou/timeout), ele NÃO tenta disparar áudio quebrado na Uazapi,
  // mas segue direto para enviar o texto!
  
  // Vamos garantir que se não tiver áudio, o nó "Tem Foto para Enviar?" ou "Enviar Texto" receba a resposta!
  // Vamos adicionar um IF após Codificar Áudio: "Áudio Gerado com Sucesso?"
  let ifAudioSuccess = nodes.find(n => n.id === 'if-audio-success');
  if (!ifAudioSuccess) {
    ifAudioSuccess = {
      id: "if-audio-success",
      name: "Áudio Gerado com Sucesso?",
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [1880, 32],
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict",
            version: 2
          },
          conditions: [
            {
              id: "cond-audio-ok",
              leftValue: "={{ $json.hasAudioUrl }}",
              rightValue: true,
              operator: {
                type: "boolean",
                operation: "equals"
              }
            }
          ],
          combinator: "and"
        }
      }
    };
    nodes.push(ifAudioSuccess);
  }

  const codeEncodeName = "📦 Codificar Áudio em Base64";
  const sendVoiceName = "🎙️ Enviar Áudio Gravado (Uazapi)";
  const needsCompName = "Precisa de Texto ou Foto?";
  const hasImageName = "Tem Foto para Enviar?";

  // Codificar Áudio -> Áudio Gerado com Sucesso?
  connections[codeEncodeName] = {
    main: [
      [
        {
          node: ifAudioSuccess.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Se Áudio Gerado com Sucesso (True):
  // -> Enviar Áudio Gravado (Uazapi) -> Precisa de Texto ou Foto?
  // Se Áudio Falhou/Timeout (False):
  // -> Vai direto para "Tem Foto para Enviar?" (Garante o envio do texto do orçamento 100% das vezes!)
  connections[ifAudioSuccess.name] = {
    main: [
      [
        {
          node: sendVoiceName,
          type: "main",
          index: 0
        }
      ],
      [
        {
          node: hasImageName,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  connections[sendVoiceName] = {
    main: [
      [
        {
          node: needsCompName,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Sanar nomes corrompidos de conexões
  const nodeNames = new Set(nodes.map(n => n.name));
  const memoryNode = nodes.find(n => n.id === 'update-customer-memory');

  for (const sourceName in connections) {
    const sourceConn = connections[sourceName];
    for (const connType in sourceConn) {
      for (let i = 0; i < sourceConn[connType].length; i++) {
        for (let j = 0; j < sourceConn[connType][i].length; j++) {
          const target = sourceConn[connType][i][j];
          if (!nodeNames.has(target.node)) {
            if (target.node.includes('Salvar/Atualizar Memória') && memoryNode) {
              target.node = memoryNode.name;
            }
          }
        }
      }
    }
  }

  console.log('📦 Enviando atualização de Alta Resiliência para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! FLUXO BLINDADO E RESILIENTE ATIVADO NO N8N (TEXTO GARANTIDO 100%)!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployResilientFlow().catch(console.error);
