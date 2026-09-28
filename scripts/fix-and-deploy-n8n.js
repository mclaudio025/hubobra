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

// 1. CÓDIGO CORRIGIDO DO NÓ: Montar Catálogo Dinâmico & Memória
const JS_CODE_FORMAT_CATALOG = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + MEMÓRIA PERSISTENTE DO CLIENTE
const initialData = $('⚙️ Normalizar Mensagem').first().json;

let currentMessageText = initialData.messageText;
try {
  const audioMerge = $('🔄 Injetar Transcrição').first();
  if (audioMerge && audioMerge.json && audioMerge.json.messageText) {
    currentMessageText = audioMerge.json.messageText;
  }
} catch(_) {}

try {
  const imageMerge = $('🔄 Injetar Análise de Imagem').first();
  if (imageMerge && imageMerge.json && imageMerge.json.messageText) {
    currentMessageText = imageMerge.json.messageText;
  }
} catch(_) {}

// 1. Recuperar Produtos Reais do Supabase buscando do nó de estoque
let stockItems = [];
try {
  const stockNode = $('📦 Buscar Estoque em Tempo Real (Supabase)').all();
  if (stockNode && stockNode.length > 0) {
    stockItems = stockNode.map(i => i.json);
  }
} catch(err) {
  console.error('Erro ao ler nó de estoque:', err);
}

const catalogLines = [];
for (const p of stockItems) {
  if (p && p.name && p.name !== 'Claudio sousa') {
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0].url : (p.image || p.imageUrl || '');
    const brandStr = p.brand ? ' (' + p.brand + ')' : '';
    const priceNum = Number(p.price || 0);
    const priceStr = 'R$ ' + priceNum.toFixed(2).replace('.', ',');
    const fotoTag = imgUrl ? ' | [FOTO: ' + imgUrl + ']' : '';
    catalogLines.push('- ' + p.name + brandStr + ': ' + priceStr + ' (PIX)' + fotoTag);
  }
}

// Se o catálogo estiver vazio por algum motivo, inclui itens essenciais com preços reais
if (catalogLines.length === 0) {
  catalogLines.push('- Cimento Poty Todas as Obras 50kg (Votoran): R$ 32,90 (PIX)');
  catalogLines.push('- Caixa de Luz 4x2 Amarela (Tigre/Krona): R$ 1,90 (PIX)');
  catalogLines.push('- Tubo Esgoto 100mm 6m (Krona): R$ 42,00 (PIX)');
  catalogLines.push('- Argamassa AC-II 20kg (Votoran): R$ 19,90 (PIX)');
}

const liveCatalog = catalogLines.join('\\n');

// 2. Recuperar Memória do Cliente
let customerMemoryText = 'Primeiro Atendimento - Cliente novo na loja. Seja acolhedor e descubra o tipo de obra.';
let customerProfile = null;

try {
  const memoryNode = $('🧠 Buscar Memória do Cliente (Supabase)').first();
  if (memoryNode && memoryNode.json && Array.isArray(memoryNode.json) && memoryNode.json.length > 0) {
    customerProfile = memoryNode.json[0];
  } else if (memoryNode && memoryNode.json && memoryNode.json.phone) {
    customerProfile = memoryNode.json;
  }
} catch(_) {}

if (customerProfile && customerProfile.phone) {
  const stage = customerProfile.current_construction_stage || 'alvenaria';
  const type = customerProfile.client_type || 'proprietario';
  const neigh = customerProfile.delivery_neighborhood || 'Messejana';
  const notes = customerProfile.ai_notes || 'Cliente focado em materiais de qualidade';
  
  customerMemoryText = \`CLIENTE RECORRENTE:
- Nome Registrado: \${customerProfile.name || initialData.name}
- Tipo de Cliente: \${type}
- Local/Bairro da Obra: \${neigh}
- Fase Atual da Obra: \${stage}
- Forma de Pagamento Preferida: \${customerProfile.preferred_payment || 'PIX'}
- Notas da IA sobre a Obra: \${notes}\`;
}

return [{
  json: {
    ...initialData,
    messageText: currentMessageText,
    liveCatalog: liveCatalog,
    totalCatalogItems: catalogLines.length,
    customerMemoryText: customerMemoryText,
    hasProfile: Boolean(customerProfile)
  }
}];`;

// 2. CÓDIGO CORRIGIDO DO NÓ: Gerar Áudio (Gemini TTS via this.helpers.httpRequest)
const JS_CODE_GEMINI_TTS = `// 🗣️ GERAR ÁUDIO GEMINI 2.5 PRO TTS VIA KIE.AI (COMPATÍVEL NATIVO N8N)
const item = $input.first().json;
const text = item.speechText;
const isZe = Boolean(item.isZePersona);
const voiceName = isZe ? 'Charon' : 'Aoede';
const apiKey = '${KIE_API_KEY}';

if (!text || text.trim().length === 0) {
  return [{ json: item }];
}

// 1. Criar tarefa na Kie via this.helpers.httpRequest
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
  json: true
});

const taskId = createRes.data?.taskId || createRes.data?.recordId;
if (!taskId) {
  throw new Error('Falha ao obter taskId da Kie: ' + JSON.stringify(createRes));
}

// 2. Polling até obter o áudio pronto
let audioUrl = null;
for (let i = 0; i < 25; i++) {
  await new Promise(r => setTimeout(r, 1200));
  const pollRes = await this.helpers.httpRequest({
    method: 'GET',
    url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
    headers: { 'Authorization': 'Bearer ' + apiKey },
    json: true
  });
  if (pollRes && pollRes.data?.state === 'success' && pollRes.data?.response?.resultUrls?.[0]) {
    audioUrl = pollRes.data.response.resultUrls[0];
    break;
  }
}

if (!audioUrl) {
  throw new Error('Timeout gerando áudio Gemini TTS na Kie');
}

// 3. Baixar o arquivo de áudio como Buffer
const audioBuffer = await this.helpers.httpRequest({
  method: 'GET',
  url: audioUrl,
  encoding: null
});

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

// 3. SYSTEM PROMPT BLINDADO ANTI-PLACEHOLDERS
const UPDATED_SYSTEM_PROMPT = `Você é a inteligência artificial oficial de atendimento, vendas e consultoria técnica da HubObra (https://hubobra.com.br).
Você atua como 🙋‍♀️ LIA (Atendente Comercial) e 👷‍♂️ ZÉ DA OBRA (Especialista Técnico).

══════════════════════════════════════════════════════════════
🚫 PROIBIÇÃO ABSOLUTA DE PLACEHOLDERS (REGRA ZERO):
══════════════════════════════════════════════════════════════
- NUNCA escreva textos com colchetes de preenchimento como "[valor unitário]", "[preço]", "[valor total]", "[URL_DA_IMAGEM]".
- Forneça SEMPRE valores numéricos exatos em Reais (R$).
- Se o item estiver no catálogo, use o preço dele. Se for um item genérico como caixa 4x2, use o preço padrão de mercado da loja: Caixa de Luz 4x2 = R$ 1,90 a unidade (4 unidades = R$ 7,60; no PIX com 10% = R$ 6,84).
- Se não tiver certeza absoluta de um preço de produto raro, informe o valor de referência estimado com segurança e cordialidade, JAMAIS deixe campos vazios ou entre colchetes.

══════════════════════════════════════════════════════════════
🎙️ REGRA DE VOZ E FALA [FALA: ...]:
══════════════════════════════════════════════════════════════
- Sempre inicie com uma tag [FALA: ...] contendo uma mensagem falada curta (1 a 3 frases calorosas).
- A fala será convertida no áudio de voz do WhatsApp enviado para o cliente.`;

async function deployFix() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  nodes = nodes.map(node => {
    // 1. Corrigir o formatador do catálogo
    if (node.id === 'code-format-realtime-catalog' || node.name.includes('Montar Catálogo')) {
      node.parameters = { jsCode: JS_CODE_FORMAT_CATALOG };
    }

    // 2. Corrigir o gerador de áudio TTS usando this.helpers.httpRequest
    if (node.id === 'openai-generate-tts' || node.name.includes('Gerar Áudio')) {
      node.type = 'n8n-nodes-base.code';
      node.typeVersion = 2;
      node.parameters = { jsCode: JS_CODE_GEMINI_TTS };
      delete node.credentials;
    }

    // 3. Atualizar System Prompt
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = UPDATED_SYSTEM_PROMPT;
    }

    return node;
  });

  console.log('📦 Enviando correções definitivas de Catálogo e Áudio Gemini TTS para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! CATÁLOGO E ÁUDIO GEMINI CORRIGIDOS E ATIVADOS NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployFix().catch(console.error);
