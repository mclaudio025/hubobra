const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const ELEVENLABS_API_KEY = 'sk_67f8bd0467303175138623ceb61f5480d5807e1cf5eef5e4';
const LIA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah / Bella
const ZE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';  // Adam

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

async function deployElevenLabsToN8N() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  // 1. Atualizar o nó formatador de resposta para aplicar a fonética 'Hub, Obra' e escolher a voz correta
  nodes = nodes.map(node => {
    if (node.name.includes('Formatar Resposta')) {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = `// 📝 FORMATADOR MULTIMODAL INTELIGENTE (ELEVENLABS + FALA + TEXTO + FOTO NATIVA)
const item = $input.first().json;
const initialData = $('⚙️ Normalizar Mensagem').first().json;

let rawText = '';
if (item.output) {
  rawText = item.output;
} else if (item.text) {
  rawText = item.text;
} else if (typeof item === 'string') {
  rawText = item;
}

// 1. Extração Universal de Imagens
let imageUrl = null;
const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
if (fotoTagMatch && fotoTagMatch[1]) {
  imageUrl = fotoTagMatch[1].trim();
}

if (!imageUrl) {
  const mdMatch = rawText.match(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/i);
  if (mdMatch && mdMatch[1]) imageUrl = mdMatch[1].trim();
}

if (!imageUrl) {
  const urlDirectMatch = rawText.match(/(https?:\\/\\/[^\\s\\)]+\\.(?:jpg|jpeg|png|webp|avif|gif)(?:\\?[^\\s\\)]*)?)/i);
  if (urlDirectMatch && urlDirectMatch[1]) imageUrl = urlDirectMatch[1].trim();
}

if (!imageUrl) {
  const supaMatch = rawText.match(/(https?:\\/\\/[^\\s\\)]+supabase\\.co\\/storage[^\\s\\)]+)/i);
  if (supaMatch && supaMatch[1]) imageUrl = supaMatch[1].trim();
}

// 2. Extrair Fala para o Áudio [FALA: ...]
let speechText = '';
const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
if (falaMatch && falaMatch[1]) {
  speechText = falaMatch[1].trim();
} else {
  const cleanFirst = rawText.split('\\n')[0].replace(/[*_~#\`\\[\\]!]/g, '').trim();
  if (cleanFirst && cleanFirst.length > 10 && cleanFirst.length < 180) {
    speechText = cleanFirst + ' Preparei todos os detalhes por escrito aqui embaixo para você conferir.';
  } else {
    speechText = "Oi, " + (initialData.name || 'amigo') + "! Já separei todas as informações que você pediu. Dá uma olhada aqui embaixo!";
  }
}

// Determinar se a persona falando é o Zé da Obra ou a Lia
const isZe = rawText.includes('Zé da Obra') || rawText.includes('👷‍♂️') || rawText.includes('Zé:');
const voiceId = isZe ? '${ZE_VOICE_ID}' : '${LIA_VOICE_ID}';

// Normalização Fonética Especial para ElevenLabs (Hub, Obra + Pícs + medidas)
speechText = speechText
  .replace(/https?:\\/\\/\\S+/g, '')
  .replace(/HubObra/gi, 'Hub, Obra')
  .replace(/Hub\\s*Obra/gi, 'Hub, Obra')
  .replace(/Hub\\s*Construções/gi, 'Hub, Construções')
  .replace(/\\bPIX\\b/g, 'Pícs')
  .replace(/\\bPix\\b/g, 'Pícs')
  .replace(/\\bWhatsApp\\b/gi, 'Uatizap')
  .replace(/[*_~#\`\\[\\]!]/g, '')
  .replace(/R\\$\\s*([0-9]+)[,\\.]([0-9]{2})/g, '$1 reais e $2 centavos')
  .replace(/R\\$\\s*([0-9]+)/g, '$1 reais')
  .replace(/m²/g, 'metros quadrados')
  .replace(/m³/g, 'metros cúbicos')
  .replace(/kg/g, 'quilos')
  .replace(/\\n+/g, ' ')
  .trim();

if (speechText.length > 400) {
  speechText = speechText.substring(0, 400) + '...';
}

// 3. Resposta formatada por escrito para o WhatsApp
let respostaFormatada = rawText
  .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
  .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
  .replace(/!\\[.*?\\]\\([^\\)]+\\)/gi, '')
  .trim();

if (imageUrl && respostaFormatada.includes(imageUrl)) {
  respostaFormatada = respostaFormatada.replace(imageUrl, '').trim();
}

if (!respostaFormatada) {
  respostaFormatada = "Aqui estão as informações dos materiais da HubObra! Deseja incluir no seu pedido para entrega na obra ou retirada express?";
}

const hasImage = Boolean(imageUrl && imageUrl.startsWith('http'));

return [{
  json: {
    ...initialData,
    rawAiOutput: rawText,
    respostaFormatada: respostaFormatada,
    speechText: speechText,
    voiceId: voiceId,
    isZePersona: isZe,
    imageUrl: imageUrl,
    hasImage: hasImage,
    isAudioInput: Boolean(initialData.isAudio),
    hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
  }
}];`;
    }

    // 2. Atualizar os parâmetros do nó TTS mantendo o nome exato para preservar as conexões
    if (node.name.includes('Gerar Áudio') || node.id === 'openai-generate-tts') {
      node.type = "n8n-nodes-base.httpRequest";
      node.typeVersion = 4.3;
      node.parameters = {
        method: "POST",
        url: `={{ 'https://api.elevenlabs.io/v1/text-to-speech/' + ($json.voiceId || '${LIA_VOICE_ID}') }}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "xi-api-key", value: ELEVENLABS_API_KEY },
            { name: "Content-Type", value: "application/json" },
            { name: "Accept", value: "audio/mpeg" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { text: $json.speechText, model_id: 'eleven_multilingual_v2', voice_settings: { stability: $json.isZePersona ? 0.55 : 0.45, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true } } }}",
        options: {
          response: {
            response: {
              responseFormat: "file"
            }
          },
          timeout: 30000
        }
      };
      delete node.credentials;
    }

    return node;
  });

  console.log('📦 Enviando atualização do ElevenLabs para o n8n no servidor...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! ELEVENLABS ATIVADO EM TEMPO REAL NO WHATSAPP DA HUBOBRA!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployElevenLabsToN8N().catch(console.error);
