const https = require('https');

const N8N_URL = 'https://n8n-n8n.q6zw3x.easypanel.host/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz'; // hubobra

const UAZAPI_BASE = 'https://hubobra.uazapi.com';
const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';

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

const systemPrompt = `Você é o sistema de atendimento inteligente da HubObra (HubConstruções) no WhatsApp.

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS E HIERARQUIA DE ATENDIMENTO
══════════════════════════════════════════════════════════════

1. 🙋‍♀️ LIA É A ATENDENTE PRINCIPAL E EXCLUSIVA DE ENTRADA:
   - Toda saudação inicial ("Oi", "Olá", "Bom dia", "Boa tarde", "Tudo bem?"), perguntas sobre preços, estoque, marcas, fotos, frete, formas de pagamento e fechamento de pedidos devem ser respondidas EXCLUSIVAMENTE pela 🙋‍♀️ LIA.
   - NUNCA inclua o Zé da Obra em cumprimentos simples ou perguntas comerciais normais!

2. 👷‍♂️ ZÉ DA OBRA É UM ESPECIALISTA TÉCNICO DE APOIO (SOB DEMANDA):
   - O Zé da Obra NUNCA fala em cumprimentos ou saudações.
   - O Zé da Obra SÓ entra na conversa se o cliente fizer uma pergunta de:
     * CÁLCULO DE MATERIAIS DE OBRA (ex: "quantos tijolos?", "quanto de cimento pra 10m²?", "quanto rende?", "quantas latas de tinta para 50m²?").
     * MODO DE APLICAÇÃO / ENGENHARIA PRÁTICA (ex: "como aplica Vedatop?", "qual o traço do reboco?", "quantas demãos?", "como preparar a superfície?").
   - Quando o Zé da Obra entrar, ele explica a parte técnica primeiro com linguagem prática de mestre de obras.
   - Logo em seguida, a 🙋‍♀️ LIA assume imediatamente para passar os preços no PIX e fechar o pedido!

══════════════════════════════════════════════════════════════
📐 FÓRMULAS DE ENGENHARIA DO ZÉ DA OBRA:
══════════════════════════════════════════════════════════════
- Alvenaria/Paredes: 30 tijolos 8 furos por m² (já com 10% de margem de quebra) + 0.5 saco de cimento 50kg por m² + 0.1 m³ de areia média por m².
- Reboco/Emboço: 0.25 saco cimento 50kg por m² + 0.04 m³ areia fina/média.
- Contrapiso (5cm): 0.35 saco cimento 50kg por m² + 0.04 m³ areia + 0.04 m³ brita.
- Argamassa Colante Piso: 1 saco ACII 20kg a cada 4.5 m² de piso.
- Impermeabilização: Vedatop caixa 18kg rende de 6 a 9 m² com 3 demãos cruzadas.

══════════════════════════════════════════════════════════════
🛒 CATÁLOGO OFICIAL HUBOBRA COM FOTOS DO SUPABASE:
══════════════════════════════════════════════════════════════
- Tinta Acrílica Standard Fosco Rende Muito Branco Neve 20L (Coral): R$ 299,90 (PIX) | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/52519499-5c7a-45c7-86d0-c3ba0954f3a3.jpg]
- Cimento Poty Todas as Obras 50kg: R$ 48,00 (PIX) | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/2bfc0e1c-814d-4672-bf24-b873cee3498c.jpg]
- Cimento Apodi 50kg: R$ 41,00 (PIX) | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/6c50bbe8-f464-408f-aeda-158085f02c44.jpg]
- Tijolo Cerâmico 8 Furos: R$ 0,45 cada (R$ 450 o milheiro) | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/4abea552-8ce7-40e3-8fa2-71cd5367610f.jpg]
- Caixa d'Água Polietileno Fortlev 1000L: R$ 599,00 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/001648c5-c420-4965-b5b4-e86bb0c130e1.jpg]
- Caixa d'Água Polietileno Fortlev 500L: R$ 379,00 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/daa5ff94-dbb1-4ee9-87fa-fec2fe689366.jpg]
- Colher de Pedreiro 06 Pacetta: R$ 49,90 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/82de3ff4-f992-4c09-9240-98a5c207a385.jpg]
- Sika 1 Aditivo Impermeabilizante 1L: R$ 21,90 | [FOTO: https://cdn.awsli.com.br/300x300/2544/2544059/produto/226898863/10300_sika-1-1litro-1uz4q4fk0t.jpg]
- Fita Manta Asfáltica Kala 10cmx10m: R$ 39,90 | [FOTO: https://afer.vtexassets.com/arquivos/ids/189754/Fita-Manta-Asfaltica-Autoadesiva-Flexivel-Aluminio-10cmx10m-Kala.jpg?v=638692183635870000]
- Disco de Corte Diamantado Cortag: R$ 54,90 | [FOTO: https://ecoms1.com/51546/imgs/big/@v3/1725393081321-designsemnome-2024-09-03t165031.714.png.avif]
- Joelho 90° Soldável 25mm Tigre: R$ 1,46 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/54e45ee2-3bd1-4b04-829a-9ea91f81cd7b.webp]
- Joelho 45° Soldável 25mm Tigre: R$ 1,46 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/76ccb942-206f-4b39-a1f3-e962292c2268.jpg]
- Cola PVC Polytubes 75g: R$ 7,90 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/a938e012-1c2e-4514-85f2-71149a044f64.jpg]
- Cabos Flexíveis 6mm Cobrecom 100m: R$ 799,00 | [FOTO: https://zeywqzkmevytzkdbzwni.supabase.co/storage/v1/object/public/products/products/bef7e903-fb9a-40ed-ba8b-4daef65573ed.jpg]
- Spray WD-40 300ml: R$ 43,70 | [FOTO: https://cdn-cosmos.bluesoft.com.br/products/7898193140435]

- CONDIÇÕES COMERCIAIS:
  * 10% de desconto no PIX à vista.
  * Frete Grátis e entrega rápida direto na obra para Fortaleza e Região Metropolitana.
  * Sempre que o cliente pedir FOTO, inclua OBRIGATORIAMENTE a tag [FOTO: url] correspondente!`;

const hubobraWorkflow = {
  name: "HubObra - Atendimento Inteligente IA (Lia + Zé da Obra)",
  settings: {
    executionOrder: "v1"
  },
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "hubobra-whatsapp",
        responseMode: "onReceived",
        options: {}
      },
      id: "webhook-inbound",
      name: "📥 Entrada WhatsApp (HubObra)",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [-1400, 300],
      webhookId: "hubobra-whatsapp-trigger"
    },
    {
      parameters: {
        jsCode: `// ⚙️ PROCESSAR & NORMALIZAR MENSAGEM DO UAZAPI / WHATSAPP
const items = $input.all();
const results = [];

for (const item of items) {
  const body = item.json.body || item.json;
  
  // Ignorar mensagens enviadas por nós mesmos (fromMe = true ou wasSentByApi = true)
  if (body.message?.fromMe === true || body.fromMe === true || body.message?.wasSentByApi === true) {
    continue;
  }
  
  // Extração de telefone
  let rawPhone = body.chat?.phone || body.message?.sender_pn || body.phone || body.from || body.client_phone || body.remoteJid || body.sender || '';
  let phone = rawPhone.replace(/[^0-9]/g, '');
  
  // Extração de nome
  let name = body.message?.senderName || body.chat?.wa_name || body.chat?.name || body.name || body.pushName || 'Cliente';
  
  // Extração de texto da mensagem
  let messageText = '';
  if (body.message?.content) {
    if (typeof body.message.content === 'string') {
      messageText = body.message.content;
    } else if (body.message.content.text) {
      messageText = body.message.content.text;
    }
  } else if (body.message?.text) {
    messageText = body.message.text;
  } else if (body.text) {
    messageText = body.text;
  } else if (body.message?.conversation) {
    messageText = body.message.conversation;
  } else if (body.message?.extendedTextMessage?.text) {
    messageText = body.message.extendedTextMessage.text;
  } else if (body.content) {
    messageText = body.content;
  } else if (body.messageText) {
    messageText = body.messageText;
  }
  
  // Detecção de áudio
  let isAudio = false;
  let audioUrl = '';
  if (body.message?.mediaType === 'audio' || body.message?.messageType === 'AudioMessage' || body.mediaType === 'audio' || body.type === 'audio') {
    isAudio = true;
    audioUrl = body.message?.mediaUrl || body.mediaUrl || '';
  }
  
  if (!messageText && isAudio) {
    messageText = "Olá, enviei um áudio com o pedido dos materiais da minha obra.";
  }
  
  if (!phone || !messageText) {
    continue;
  }
  
  results.push({
    json: {
      phone: phone,
      name: name,
      messageText: messageText,
      isAudio: isAudio,
      audioUrl: audioUrl,
      sessionId: phone,
      timestamp: new Date().toISOString()
    }
  });
}

return results;`
      },
      id: "code-parser",
      name: "⚙️ Normalizar Mensagem",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-1100, 300]
    },
    {
      parameters: {
        promptType: "define",
        text: "=Mensagem enviada pelo cliente {{ $json.name }} (Telefone {{ $json.phone }}):\n\"{{ $json.messageText }}\"\n\nResponda ao cliente seguindo estritamente as regras de personas (Lia responde sozinha a menos que haja dúvida técnica/cálculo onde o Zé entra e a Lia finaliza):",
        options: {
          systemMessage: systemPrompt
        }
      },
      id: "ai-agent-hubobra",
      name: "🤖 Agente IA (Lia + Zé da Obra)",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 3,
      position: [-750, 300]
    },
    {
      parameters: {
        model: {
          __rl: true,
          value: "gpt-4o-mini",
          mode: "list"
        },
        options: {
          temperature: 0.2
        }
      },
      id: "openai-model",
      name: "OpenAI Chat Model",
      type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      typeVersion: 1.2,
      position: [-950, 520],
      credentials: {
        openAiApi: {
          id: "rLtb1nh0h3hKRbHC",
          name: "OpenAi account"
        }
      }
    },
    {
      parameters: {
        sessionKey: "={{ $json.sessionId }}",
        contextWindowLength: 8
      },
      id: "window-memory",
      name: "Memória da Conversa",
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      typeVersion: 1.3,
      position: [-750, 520]
    },
    {
      parameters: {
        jsCode: `// 📝 PREPARAR RESPOSTA FINAL DO WHATSAPP (TEXTO OU FOTO DO SUPABASE)
const items = $input.all();
const results = [];

for (const item of items) {
  const rawOutput = item.json.output || item.json.text || "Olá! Como posso ajudar você na sua obra hoje?";
  const phone = $('⚙️ Normalizar Mensagem').first().json.phone;
  const name = $('⚙️ Normalizar Mensagem').first().json.name;
  
  // Detecção de Foto na tag [FOTO: url]
  let imageUrl = '';
  let cleanText = rawOutput;
  
  const fotoMatch = rawOutput.match(/\\[FOTO:\\s*(https?:\\/\\/[^\\s\\]]+)\\]/i);
  if (fotoMatch) {
    imageUrl = fotoMatch[1];
    cleanText = rawOutput.replace(fotoMatch[0], '').trim();
  }
  
  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http'));
  
  results.push({
    json: {
      phone: phone,
      name: name,
      respostaFormatada: cleanText,
      imageUrl: imageUrl,
      hasImage: hasImage,
      timestamp: new Date().toISOString()
    }
  });
}

return results;`
      },
      id: "code-format-response",
      name: "📝 Formatar Resposta WhatsApp",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-400, 300]
    },
    {
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
              id: "has-image-condition",
              leftValue: "={{ $json.hasImage }}",
              rightValue: true,
              operator: {
                type: "boolean",
                operation: "equals"
              }
            }
          ],
          combinator: "and"
        },
        options: {}
      },
      id: "if-has-image",
      name: "Tem Foto para Enviar?",
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [-150, 300]
    },
    {
      parameters: {
        method: "POST",
        url: UAZAPI_BASE + "/send/media",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Type", value: "application/json" },
            { name: "token", value: UAZAPI_TOKEN }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { number: $json.phone, file: $json.imageUrl, text: $json.respostaFormatada, type: 'image' } }}",
        options: {
          timeout: 20000
        }
      },
      id: "send-uazapi-media",
      name: "📤 Enviar Foto + Legenda",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [120, 200]
    },
    {
      parameters: {
        method: "POST",
        url: UAZAPI_BASE + "/send/text",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Type", value: "application/json" },
            { name: "token", value: UAZAPI_TOKEN }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { number: $json.phone, text: $json.respostaFormatada } }}",
        options: {
          timeout: 15000
        }
      },
      id: "send-uazapi-text",
      name: "📤 Enviar Texto",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [120, 400]
    }
  ],
  connections: {
    "📥 Entrada WhatsApp (HubObra)": {
      main: [
        [
          {
            node: "⚙️ Normalizar Mensagem",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "⚙️ Normalizar Mensagem": {
      main: [
        [
          {
            node: "🤖 Agente IA (Lia + Zé da Obra)",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      ai_languageModel: [
        [
          {
            node: "🤖 Agente IA (Lia + Zé da Obra)",
            type: "ai_languageModel",
            index: 0
          }
        ]
      ]
    },
    "Memória da Conversa": {
      ai_memory: [
        [
          {
            node: "🤖 Agente IA (Lia + Zé da Obra)",
            type: "ai_memory",
            index: 0
          }
        ]
      ]
    },
    "🤖 Agente IA (Lia + Zé da Obra)": {
      main: [
        [
          {
            node: "📝 Formatar Resposta WhatsApp",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "📝 Formatar Resposta WhatsApp": {
      main: [
        [
          {
            node: "Tem Foto para Enviar?",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Tem Foto para Enviar?": {
      main: [
        [
          {
            node: "📤 Enviar Foto + Legenda",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "📤 Enviar Texto",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  }
};

async function deploy() {
  console.log('🚀 Atualizando workflow com regras refinadas de Handoff...');
  const res = await request('/workflows/' + WORKFLOW_ID, 'PUT', hubobraWorkflow);
  console.log('Status:', res.status);
  if (res.status === 200) {
    console.log('✅ WORKFLOW REFINADO COM SUCESSO!');
    const act = await request('/workflows/' + WORKFLOW_ID + '/activate', 'POST');
    console.log('Status de Ativação:', act.status);
  } else {
    console.error('Erro na atualização:', res);
  }
}

deploy();
