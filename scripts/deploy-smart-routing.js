const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

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

// 📝 FORMATADOR INTELIGENTE COM EXTRAÇÃO EXATA DE FALA E DETECÇÃO DE ORÇAMENTO
const JS_CODE_FORMAT_RESPONSE = `// 📝 FORMATADOR MULTIMODAL INTELIGENTE (SEM FALAS GENÉRICAS E COM ROTEAMENTO PRECISO)
return await (async () => {
  const item = $input.first().json;
  const initialData = $('⚙️ Normalizar Mensagem').first().json;
  const customerName = initialData.name || 'amigo';

  let rawText = '';
  if (item.output) {
    rawText = item.output;
  } else if (item.text) {
    rawText = item.text;
  } else if (typeof item === 'string') {
    rawText = item;
  }

  // 1. Extração de Imagens
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  if (fotoTagMatch && fotoTagMatch[1]) imageUrl = fotoTagMatch[1].trim();

  // 2. Detectar se é Orçamento / Relatório com múltiplos itens
  const hasMultipleBullets = (rawText.match(/[•\\-\\+]\\s+/g) || []).length >= 2;
  const hasBudgetKeywords = rawText.includes('Orçamento') || rawText.includes('Total:') || rawText.includes('subtotal') || rawText.includes('<<<PEDIDO:');
  const isBudgetOrList = hasMultipleBullets || hasBudgetKeywords;

  // 3. Extração da Fala de Áudio [FALA: ...]
  let speechText = '';
  let textBody = rawText;

  const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
  if (falaMatch && falaMatch[1]) {
    const rawFala = falaMatch[1].trim();
    
    // Apenas se a fala for excessivamente longa (> 280 chars) ou for uma lista extensa de orçamento, usa introdução
    if (rawFala.length > 280 || (isBudgetOrList && rawFala.length > 160)) {
      speechText = \`Oi \${customerName}! Já levantei todos os itens do seu orçamento. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!\`;
      
      const outsideText = rawText.replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '').trim();
      if (!outsideText || outsideText.length < 20) {
        textBody = rawFala;
      }
    } else {
      // Fala direta natural e personalizada para o produto perguntado (ex: "A lâmina de serra tá 13 reais...")
      speechText = rawFala;
    }
  } else {
    // Se não veio [FALA], pega a primeira frase
    const firstSentence = rawText.split('\\n')[0].replace(/[*_~#\`\\[\\]!]/g, '').trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 160) {
      speechText = firstSentence;
    } else {
      speechText = \`Oi \${customerName}! Já separei as informações dos materiais da Hub, Obra para você!\`;
    }
  }

  // 4. Limpeza do Texto Escrito
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 5) {
    respostaFormatada = rawText.replace(/\\[FALA:\\s*/gi, '').replace(/\\]/gi, '').trim();
  }

  // 5. Normalização Fonética da Fala
  speechText = speechText
    .replace(/https?:\\/\\/\\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\\s*Obra/gi, 'Hub, Obra')
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

  const isZe = rawText.includes('Zé da Obra') || rawText.includes('👷‍♂️');
  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http'));

  return [{
    json: {
      ...initialData,
      rawAiOutput: rawText,
      respostaFormatada: respostaFormatada,
      speechText: speechText,
      voiceId: isZe ? 'Charon' : 'Aoede',
      isZePersona: isZe,
      imageUrl: imageUrl,
      hasImage: hasImage,
      isBudgetOrList: isBudgetOrList,
      isAudioInput: Boolean(initialData.isAudio),
      hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
    }
  }];
})();`;

async function deploySmartRouting() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = existingWf.nodes;
  let connections = existingWf.connections;

  // 1. Atualizar o Formatador de Resposta
  nodes = nodes.map(node => {
    if (node.id === 'code-format-response') {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_RESPONSE
      };
    }
    return node;
  });

  // 2. Corrigir nomes de conexão corrompidos
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
              console.log(`Corrigindo alvo de conexão: "${target.node}" -> "${memoryNode.name}"`);
              target.node = memoryNode.name;
            }
          }
        }
      }
    }
  }

  // 3. Adicionar nó "Precisa de Texto ou Foto?"
  const complementNodeId = 'if-needs-complement';
  const complementNodeName = 'Precisa de Texto ou Foto?';
  
  let compNode = nodes.find(n => n.id === complementNodeId);
  if (!compNode) {
    compNode = {
      id: complementNodeId,
      name: complementNodeName,
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [2240, 32],
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
              id: "cond-comp",
              leftValue: "={{ $('📝 Formatar Resposta WhatsApp').first().json.hasImage || $('📝 Formatar Resposta WhatsApp').first().json.isBudgetOrList }}",
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
    nodes.push(compNode);
  }

  const sendVoiceNode = nodes.find(n => n.id === 'send-uazapi-voice');
  const hasImageNode = nodes.find(n => n.id === 'if-has-image');
  const chatwootNode = nodes.find(n => n.id === 'chatwoot-contact-http');

  if (sendVoiceNode && hasImageNode && chatwootNode) {
    connections[sendVoiceNode.name] = {
      main: [
        [
          {
            node: complementNodeName,
            type: "main",
            index: 0
          }
        ]
      ]
    };

    connections[complementNodeName] = {
      main: [
        [
          {
            node: hasImageNode.name,
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: chatwootNode.name,
            type: "main",
            index: 0
          }
        ]
      ]
    };
  }

  console.log('📦 Enviando atualização com conexões sanadas para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! ROTEAMENTO INTELIGENTE E FALA PERSONALIZADA ATIVADOS NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploySmartRouting().catch(console.error);
