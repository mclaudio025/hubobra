const https = require('https');

const N8N_URL = 'https://n8n-n8n.q6zw3x.easypanel.host/api/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const UAZAPI_BASE = 'https://hubobra.uazapi.com';
const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';

const CHATWOOT_URL = 'https://atendimento-chatwoot.q6zw3x.easypanel.host';
const CHATWOOT_TOKEN = 'EE8HZn79o6Hdp5h2gAcqbFgu';
const CHATWOOT_ACCOUNT_ID = 1;
const CHATWOOT_INBOX_ID = 1;

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

const systemPrompt = `Você é o sistema de atendimento inteligente oficial da HubObra (HubConstruções) no WhatsApp.

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

3. 👤 TRANSBORDO HUMANO:
   - Se o cliente pedir explicitamente para falar com um atendente humano, vendedor ou dono da loja, a Lia responde com cordialidade: "🙋‍♀️ Com certeza! Estou transferindo seu atendimento para a nossa equipe humana agora mesmo. Um instante!"

══════════════════════════════════════════════════════════════
📸 REGRA ESTRITA DE ENVIO DE FOTOS:
══════════════════════════════════════════════════════════════
- SÓ envie a tag [FOTO: url] se o cliente PEDIR EXPLICITAMENTE para ver a foto (ex: "tem foto?", "manda a foto", "como ele é?", "envia foto do disco").
- NUNCA envie foto se o cliente apenas perguntou preço, pediu orçamento, mandou lista de compras ou tirou dúvida técnica! Nesses casos, responda apenas em texto.

══════════════════════════════════════════════════════════════
📋 REGRA DE ORÇAMENTO / MÚLTIPLOS PRODUTOS (ORÇAMENTO FORMAL):
══════════════════════════════════════════════════════════════
- Sempre que o cliente pedir cotação de 2 ou mais produtos ou enviar uma lista de materiais, estruture a resposta como um ORÇAMENTO OFICIAL DA HUBOBRA:

Exemplo de estrutura:
🙋‍♀️ Olá, [Nome]! Preparei o seu orçamento na HubObra:

📋 *Orçamento de Materiais:*
• [Qtd]x [Nome do Produto]: R$ [Unitário] | Subtotal: R$ [Subtotal]
• [Qtd]x [Nome do Produto]: R$ [Unitário] | Subtotal: R$ [Subtotal]

💰 *Total no PIX (com 10% de desconto): R$ [Total PIX]*
💳 *Ou no Cartão em até 12x: R$ [Total Cartão]*
🚚 *Entrega:* Rápida direto na sua obra com Frete Grátis para Fortaleza e Região!

Deseja que eu reserve esses materiais e gere seu pedido para entrega hoje?

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
  * Frete Grátis e entrega rápida direto na obra para Fortaleza e Região Metropolitana.`;

const workflowPayload = {
  name: "HubObra - Atendimento Inteligente IA (Lia + Zé da Obra) Multimodal Uazapi + Chatwoot CRM",
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
      position: [-1600, 300],
      webhookId: "hubobra-whatsapp-trigger"
    },
    {
      parameters: {
        jsCode: `// ⚙️ PROCESSAR & NORMALIZAR MENSAGEM DO UAZAPI (TEXTO, ÁUDIO OU FOTO)
const items = $input.all();
const results = [];

for (const item of items) {
  const body = item.json.body || item.json;
  
  // Ignorar mensagens enviadas pelo próprio robô/atendente (fromMe = true ou wasSentByApi = true)
  if (body.message?.fromMe === true || body.fromMe === true || body.message?.wasSentByApi === true) {
    continue;
  }
  
  // Extração de telefone do cliente
  let rawPhone = body.chat?.phone || body.message?.sender_pn || body.phone || body.from || body.client_phone || body.remoteJid || body.sender || '';
  let phone = rawPhone.replace(/[^0-9]/g, '');
  
  // Extração de nome
  let name = body.message?.senderName || body.chat?.wa_name || body.chat?.name || body.name || body.pushName || 'Cliente';
  
  // Extração de Message ID para Uazapi download
  let messageId = body.message?.id || body.message?.messageid || body.id || '';
  
  // Detecção de tipo de mensagem
  let mediaType = (body.message?.mediaType || body.mediaType || body.message?.type || body.type || '').toLowerCase();
  let messageType = (body.message?.messageType || body.messageType || '').toLowerCase();
  
  let isAudio = (mediaType === 'ptt' || mediaType === 'audio' || messageType.includes('audio'));
  let isImage = (mediaType === 'image' || messageType.includes('image'));
  
  // Extração de texto
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
  }
  
  if (!phone) {
    continue;
  }
  
  results.push({
    json: {
      phone: phone,
      name: name,
      messageId: messageId,
      mediaType: mediaType,
      messageType: messageType,
      isAudio: isAudio,
      isImage: isImage,
      messageText: messageText,
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
      position: [-1300, 300]
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
              id: "is-audio-condition",
              leftValue: "={{ $json.isAudio }}",
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
      id: "if-is-audio",
      name: "É Áudio de Voz?",
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [-1050, 200]
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
              id: "is-image-condition",
              leftValue: "={{ $json.isImage }}",
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
      id: "if-is-image",
      name: "É Imagem / Foto?",
      type: "n8n-nodes-base.if",
      typeVersion: 2.2,
      position: [-1050, 450]
    },
    {
      parameters: {
        method: "POST",
        url: UAZAPI_BASE + "/message/download",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Type", value: "application/json" },
            { name: "token", value: UAZAPI_TOKEN }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { id: $json.messageId } }}",
        options: {
          timeout: 20000
        }
      },
      id: "download-uazapi-audio-url",
      name: "🔗 Obter URL do Áudio (Uazapi)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [-800, 100]
    },
    {
      parameters: {
        method: "GET",
        url: "={{ $json.fileURL }}",
        options: {
          response: {
            response: {
              responseFormat: "file"
            }
          },
          timeout: 30000
        }
      },
      id: "download-audio-binary",
      name: "⬇️ Baixar Arquivo MP3",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [-550, 100]
    },
    {
      parameters: {
        resource: "audio",
        operation: "transcribe",
        options: {}
      },
      id: "whisper-transcription",
      name: "🎙️ Transcrever Áudio (Whisper)",
      type: "@n8n/n8n-nodes-langchain.openAi",
      typeVersion: 1.8,
      position: [-300, 100],
      credentials: {
        openAiApi: {
          id: "rLtb1nh0h3hKRbHC",
          name: "OpenAi account"
        }
      }
    },
    {
      parameters: {
        jsCode: `// 🔄 COMBINAR TRANSCRIÇÃO DE ÁUDIO COM DADOS DO CLIENTE
const items = $input.all();
const initialData = $('⚙️ Normalizar Mensagem').first().json;

return items.map(item => ({
  json: {
    ...initialData,
    messageText: item.json.text || item.json.transcription || "Áudio recebido.",
    isTranscribedAudio: true
  }
}));`
      },
      id: "code-merge-transcription",
      name: "🔄 Injetar Transcrição",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-50, 100]
    },
    {
      parameters: {
        method: "POST",
        url: UAZAPI_BASE + "/message/download",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "Content-Type", value: "application/json" },
            { name: "token", value: UAZAPI_TOKEN }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { id: $json.messageId } }}",
        options: {
          timeout: 20000
        }
      },
      id: "download-uazapi-image-url",
      name: "🔗 Obter URL da Imagem (Uazapi)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [-800, 450]
    },
    {
      parameters: {
        method: "GET",
        url: "={{ $json.fileURL }}",
        options: {
          response: {
            response: {
              responseFormat: "file"
            }
          },
          timeout: 30000
        }
      },
      id: "download-image-binary",
      name: "⬇️ Baixar Arquivo Foto",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [-550, 450]
    },
    {
      parameters: {
        resource: "image",
        operation: "analyze",
        modelId: {
          __rl: true,
          value: "gpt-4o-mini",
          mode: "list"
        },
        text: "Analise esta foto de material de construção ou obra. Identifique os produtos visíveis, marcas, medidas e o que o cliente provavelmente deseja orçar na HubObra.",
        inputType: "binary",
        options: {}
      },
      id: "image-analyzer",
      name: "👁️ Analisar Imagem Material (GPT-4o)",
      type: "@n8n/n8n-nodes-langchain.openAi",
      typeVersion: 1.8,
      position: [-300, 450],
      credentials: {
        openAiApi: {
          id: "rLtb1nh0h3hKRbHC",
          name: "OpenAi account"
        }
      }
    },
    {
      parameters: {
        jsCode: `// 🔄 COMBINAR ANÁLISE DE IMAGEM COM DADOS DO CLIENTE
const items = $input.all();
const initialData = $('⚙️ Normalizar Mensagem').first().json;

return items.map(item => ({
  json: {
    ...initialData,
    messageText: "O cliente enviou uma foto de materiais/obra. Análise visual: " + (item.json.text || item.json.content || "Foto de material de construção recebida."),
    isImageAnalysis: true
  }
}));`
      },
      id: "code-merge-image",
      name: "🔄 Injetar Análise de Imagem",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-50, 450]
    },
    {
      parameters: {
        promptType: "define",
        text: "=Cliente: {{ $json.name }} (Telefone: {{ $json.phone }})\n\nMensagem / Pedido do Cliente:\n\"{{ $json.messageText }}\"\n\nResponda ao cliente seguindo com rigor as regras de personas (Lia responde sempre de forma comercial com preços e fotos, e o Zé da Obra entra apenas para cálculos técnicos e engenharia prática):",
        options: {
          systemMessage: systemPrompt
        }
      },
      id: "ai-agent-hubobra",
      name: "🤖 Agente IA (Lia + Zé da Obra)",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 3,
      position: [250, 300]
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
      position: [100, 550],
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
      position: [300, 550]
    },
    {
      parameters: {
        jsCode: `// 📝 PREPARAR RESPOSTA FINAL DO WHATSAPP (TEXTO OU FOTO)
const items = $input.all();
const results = [];

for (const item of items) {
  const rawOutput = item.json.output || item.json.text || "Olá! Como posso ajudar você na sua obra hoje?";
  const phone = $('⚙️ Normalizar Mensagem').first().json.phone;
  const name = $('⚙️ Normalizar Mensagem').first().json.name;
  const clientText = $('⚙️ Normalizar Mensagem').first().json.messageText;
  
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
      clientText: clientText,
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
      position: [600, 300]
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
      position: [850, 300]
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
      position: [1100, 200]
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
      position: [1100, 400]
    },
    {
      parameters: {
        method: "POST",
        url: `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "api_access_token", value: CHATWOOT_TOKEN },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { name: $json.name || 'Cliente WhatsApp', phone_number: '+' + $json.phone, identifier: $json.phone } }}",
        options: {
          timeout: 10000
        }
      },
      id: "chatwoot-create-contact",
      name: "💬 Chatwoot: Criar/Obter Contato",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [1400, 300],
      continueOnFail: true
    },
    {
      parameters: {
        method: "POST",
        url: `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "api_access_token", value: CHATWOOT_TOKEN },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { source_id: $('📝 Formatar Resposta WhatsApp').first().json.phone, inbox_id: " + CHATWOOT_INBOX_ID + ", contact_id: $json.payload ? $json.payload.contact.id : $json.id, status: 'pending' } }}",
        options: {
          timeout: 10000
        }
      },
      id: "chatwoot-create-conv",
      name: "💬 Chatwoot: Abrir Conversa",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [1650, 300],
      continueOnFail: true
    },
    {
      parameters: {
        method: "POST",
        url: `=${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/{{ $json.id }}/messages`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "api_access_token", value: CHATWOOT_TOKEN },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { content: $('📝 Formatar Resposta WhatsApp').first().json.clientText, message_type: 'incoming' } }}",
        options: {
          timeout: 10000
        }
      },
      id: "chatwoot-post-client-msg",
      name: "💬 Chatwoot: Mensagem Cliente",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [1900, 200],
      continueOnFail: true
    },
    {
      parameters: {
        method: "POST",
        url: `=${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/{{ $('💬 Chatwoot: Abrir Conversa').first().json.id }}/messages`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "api_access_token", value: CHATWOOT_TOKEN },
            { name: "Content-Type", value: "application/json" }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ { content: $('📝 Formatar Resposta WhatsApp').first().json.respostaFormatada, message_type: 'outgoing' } }}",
        options: {
          timeout: 10000
        }
      },
      id: "chatwoot-post-lia-msg",
      name: "💬 Chatwoot: Resposta Lia",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.3,
      position: [2150, 200],
      continueOnFail: true
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
            node: "É Áudio de Voz?",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "É Áudio de Voz?": {
      main: [
        [
          {
            node: "🔗 Obter URL do Áudio (Uazapi)",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "É Imagem / Foto?",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "É Imagem / Foto?": {
      main: [
        [
          {
            node: "🔗 Obter URL da Imagem (Uazapi)",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "🤖 Agente IA (Lia + Zé da Obra)",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "🔗 Obter URL do Áudio (Uazapi)": {
      main: [
        [
          {
            node: "⬇️ Baixar Arquivo MP3",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "⬇️ Baixar Arquivo MP3": {
      main: [
        [
          {
            node: "🎙️ Transcrever Áudio (Whisper)",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "🎙️ Transcrever Áudio (Whisper)": {
      main: [
        [
          {
            node: "🔄 Injetar Transcrição",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "🔄 Injetar Transcrição": {
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
    "🔗 Obter URL da Imagem (Uazapi)": {
      main: [
        [
          {
            node: "⬇️ Baixar Arquivo Foto",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "⬇️ Baixar Arquivo Foto": {
      main: [
        [
          {
            node: "👁️ Analisar Imagem Material (GPT-4o)",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "👁️ Analisar Imagem Material (GPT-4o)": {
      main: [
        [
          {
            node: "🔄 Injetar Análise de Imagem",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "🔄 Injetar Análise de Imagem": {
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
          },
          {
            node: "💬 Chatwoot: Criar/Obter Contato",
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
    },
    "💬 Chatwoot: Criar/Obter Contato": {
      main: [
        [
          {
            node: "💬 Chatwoot: Abrir Conversa",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "💬 Chatwoot: Abrir Conversa": {
      main: [
        [
          {
            node: "💬 Chatwoot: Mensagem Cliente",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "💬 Chatwoot: Mensagem Cliente": {
      main: [
        [
          {
            node: "💬 Chatwoot: Resposta Lia",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  }
};

async function deploy() {
  console.log('🚀 Atualizando workflow com pipeline multimodal + Chatwoot CRM HTTP Nodes...');
  const res = await request('/workflows/' + WORKFLOW_ID, 'PUT', workflowPayload);
  console.log('Status do PUT:', res.status);
  if (res.status === 200) {
    console.log('✅ WORKFLOW MULTIMODAL + CHATWOOT ATUALIZADO COM SUCESSO!');
    const act = await request('/workflows/' + WORKFLOW_ID + '/activate', 'POST');
    console.log('Status de Ativação:', act.status);
  } else {
    console.error('Erro na atualização:', JSON.stringify(res, null, 2));
  }
}

deploy();
