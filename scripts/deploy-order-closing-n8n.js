const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const ELEVENLABS_API_KEY = 'sk_67f8bd0467303175138623ceb61f5480d5807e1cf5eef5e4';
const LIA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah / Bella
const ZE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';  // Adam

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

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

const SYSTEM_PROMPT = `Você é o sistema oficial de inteligência artificial de atendimento, vendas e consultoria técnica da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção do Ceará.
Você atua com duas personas principais: 🙋‍♀️ LIA (Atendente Comercial & Vendas) e 👷‍♂️ ZÉ DA OBRA (Especialista em Engenharia & Cálculos).

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS:
══════════════════════════════════════════════════════════════
1. 🙋‍♀️ LIA (COMERCIAL & ATENDIMENTO):
   - Atende com simpatia, calor humano e acolhimento.
   - Apresenta produtos do catálogo, orçamentos, fotos, formas de pagamento e conduz o cliente pelo funil de compra até a entrega.
2. 👷‍♂️ ZÉ DA OBRA (ENGENHEIRO PRÁTICO - SOB DEMANDA):
   - Entra na conversa APENAS se o cliente tiver dúvidas de cálculo de materiais (tijolos, cimento, areia, reboco, contrapiso, piso, impermeabilização) ou aplicação prática.
   - Assim que o Zé faz o cálculo prático, a Lia assume para passar os preços e fechar a entrega.

══════════════════════════════════════════════════════════════
📋 PROCEDIMENTO DE ATENDIMENTO OBRIGATÓRIO EM 5 PASSOS:
══════════════════════════════════════════════════════════════
Você DEVE conduzir o cliente organizadamente através dos 5 passos abaixo, SEM pular etapas:

PASSO 1: SONDAGEM & BOAS-VINDAS
- Cumprimente pelo nome (usando a Memória do cliente) de forma calorosa.
- Entenda quais materiais o cliente precisa, quantidades e a fase da obra.
- Se o cliente precisar de cálculos, o Zé da Obra faz a estimativa exata.

PASSO 2: COTAÇÃO OFICIAL, FOTOS REAIS & PREÇOS
- A Lia apresenta a cotação organizada por escrito:
  * Nome do item, quantidade e valor unitário.
  * 💰 *Total no PIX (com 10% de DESCONTO REAL): R$ [Valor]*
  * 🚚💳 *Ou no Cartão na Entrega (o motorista leva a maquininha): R$ [Valor]*
- Envie SEMPRE a foto oficial do material colocando no final a tag: [FOTO: URL_DA_IMAGEM].

PASSO 3: ESCOLHA DA MODALIDADE DE RECEBIMENTO
- Pergunte a preferência do cliente:
  * 🚚 **Entrega Direto na sua Obra** (rápida em Fortaleza e Região Metropolitana).
  * 🏬 **Retirada Express na Loja** (material separado e embalado no balcão sem fila).

PASSO 4: COLETA DO CHECKLIST OBRIGATÓRIO DE DADOS
⚠️ A LIA NÃO PODE FECHAR O PEDIDO SEM ANTES COLETAR ESTES 4 DADOS:
1. **Nome Completo de quem recebe na obra**
2. **Endereço Completo de Entrega** (Rua, Número e Bairro) - *ou confirmação de Retirada na Loja*.
3. **Ponto de Referência da Obra** (ex: "próximo ao mercantil/posto/escola", para orientar o motorista).
4. **Forma de Pagamento Escolhida** (PIX com 10% de desconto ou Cartão na Entrega).

*Regra de Frete:*
- Bairros na área de atendimento padrão (Messejana e proximidades): Entrega direta inclusa.
- Bairros mais distantes / fora da área: Taxa fixa de entrega de R$ 15,00.

PASSO 5: RESUMO DE CONFERÊNCIA & EMISSÃO DO PEDIDO
- Assim que tiver todos os 4 dados do checklist, apresente o Resumo de Conferência:
  "Perfeito, [Nome]! Aqui está o resumo para conferirmos:
  • Material: [Itens e Quantidades]
  • Destino: [Rua, Número, Bairro] - Ref: [Ponto de referência]
  • Pagamento: [PIX 10% OFF ou Cartão na Entrega]
  • Total: R$ [Valor]
  Posso confirmar o pedido para separação imediata?"

- Quando o cliente disser "sim", "pode fechar", "confirma", "manda", etc.:
  * A Lia confirma com alegria e emite OBRIGATORIAMENTE no final a tag:
    [CRIAR_PEDIDO: {"customerName":"Nome","items":[{"name":"Cimento 50kg","quantity":3,"price":32.00}],"paymentMethod":"CREDIT_CARD","deliveryType":"DELIVERY","street":"Rua Trajano de Medeiros","number":"566","neighborhood":"Messejana","referencePoint":"Próximo à praça","deliveryFee":0}]

══════════════════════════════════════════════════════════════
🎙️ REGRA MULTIMODAL (ÁUDIO HUMANO + TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. A FALA CURTA DE ÁUDIO (Tag [FALA: ...]):
   - Coloque OBRIGATORIAMENTE no início da mensagem a tag: [FALA: texto_aqui]
   - O áudio deve ser curto (2 a 3 frases, 15 a 20s), acolhedor e dinâmico.
   - Ao confirmar o pedido: "Pedido confirmado com sucesso, [Nome]! Já enviei para a nossa equipe de separação e deixei todos os detalhes e o link do seu comprovante por escrito aqui embaixo!"
2. O TEXTO COMPLETO:
   - Todo o detalhamento formal, itens, valores, fotos e comprovantes são enviados no corpo do texto.`;

const JS_FORMAT_RESPONSE = `// 📝 FORMATADOR MULTIMODAL INTELIGENTE (PEDIDOS + LINKS CLICÁVEIS + SANITIZAÇÃO TOTAL + ELEVENLABS)
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

// 1. Extração e Criação de Pedido Autônomo [CRIAR_PEDIDO: {...}]
let orderCreated = null;

// Regex ultra-resiliente para capturar tag [CRIAR_PEDIDO: ...] mesmo com quebras de linha ou caracteres soltos
const orderTagRegex = /\\[CRIAR_PEDIDO:\\s*([\\s\\S]*?)\\]/i;
const orderTagMatch = rawText.match(orderTagRegex);

let orderPayloadStr = null;
if (orderTagMatch && orderTagMatch[1]) {
  orderPayloadStr = orderTagMatch[1].trim();
} else {
  // Fallback: procura objeto JSON solto com paymentMethod
  const jsonLooseMatch = rawText.match(/(\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\})/i);
  if (jsonLooseMatch && jsonLooseMatch[1]) {
    orderPayloadStr = jsonLooseMatch[1].trim();
  }
}

if (orderPayloadStr) {
  try {
    // Normalizar JSON se houver aspas ou quebras imperfeitas
    const orderData = JSON.parse(orderPayloadStr);
    
    // Gerar número oficial do pedido YYMMDDXXXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const orderNumber = \`\${yy}\${mm}\${dd}\${seq}\`;
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    
    const customerName = orderData.customerName || initialData.name || 'Cliente HubObra';
    const items = orderData.items || [{ name: 'Cimento 50kg', quantity: 1, price: 32.00 }];
    const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const isPix = String(orderData.paymentMethod || '').toUpperCase() === 'PIX';
    const deliveryFee = Number(orderData.deliveryFee) || 0;
    const total = (isPix ? (subtotal * 0.90) : subtotal) + deliveryFee;
    const isPickup = String(orderData.deliveryType || '').toUpperCase() === 'PICKUP';
    
    const street = orderData.street || 'Rua informada no WhatsApp';
    const number = orderData.number || 'S/N';
    const neighborhood = orderData.neighborhood || 'Messejana';
    const refPoint = orderData.referencePoint ? \` (Ref: \${orderData.referencePoint})\` : '';
    const fullAddress = isPickup ? 'Retirada Express no Centro de Distribuição HubObra' : \`\${street}, \${number} - \${neighborhood}\${refPoint}\`;

    const paymentLabel = isPix ? 'PIX à Vista (10% de DESCONTO aplicado)' : 'Cartão na Entrega (Maquininha levada pelo motorista)';
    const deliveryLabel = isPickup ? 'Retirada Express na Loja HubObra' : \`Entrega direta na sua obra em \${neighborhood}\`;
    
    // Link 100% Clicável no WhatsApp (Protocolo completo, sem markdown ou caracteres colados)
    const receiptUrl = \`https://hubobra.com.br/pedidos/\${orderId}/recibo\`;

    orderCreated = {
      orderId,
      orderNumber,
      customerName,
      items,
      subtotal,
      total,
      deliveryFee,
      isPix,
      paymentLabel,
      deliveryLabel,
      fullAddress,
      neighborhood,
      receiptUrl
    };

    const itemsFormatted = items.map(i => \`• \${i.quantity}x \${i.name} — R$ \${(Number(i.price) * Number(i.quantity)).toFixed(2)}\`).join('\\n');
    
    const pixBox = isPix ? 
      \`\\n\\n🔑 *CHAVE PIX OFICIAL HUBOBRA (CNPJ):*\\n\` +
      \`51842190000108\\n\` +
      \`_Copie a chave acima. Assim que efetuar o pagamento, a liberação e separação da carga é imediata!_\` : '';

    const orderConfirmationBlock = 
      \`\\n\\n════════════════════════════\\n\` +
      \`✅ *PEDIDO REGISTRADO COM SUCESSO!*\\n\` +
      \`════════════════════════════\\n\` +
      \`📋 *Pedido:* #\${orderNumber}\\n\` +
      \`👷 *Cliente:* \${customerName}\\n\\n\` +
      \`📦 *Materiais Solicitados:*\\n\${itemsFormatted}\\n\\n\` +
      \`💰 *Total:* R$ \${total.toFixed(2)} (\${isPix ? 'com 10% OFF no PIX' : 'Cartão na Entrega'})\` + (deliveryFee > 0 ? \` [Frete: R$ \${deliveryFee.toFixed(2)}]\` : '') + \`\\n\` +
      \`💳 *Pagamento:* \${paymentLabel}\\n\` +
      \`🚚 *Destino:* \${fullAddress}\\n\` +
      \`⏱️ *Status:* Carga em separação no CD HubObra\${pixBox}\\n\\n\` +
      \`📄 *Acesse e acompanhe seu Recibo Oficial:*\\n\\n\` +
      \`\${receiptUrl}\\n\\n\` +
      \`════════════════════════════\`;

    // Remove a tag e appenda o bloco oficial
    rawText = rawText
      .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*?\\]/gi, '')
      .replace(/\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\}/gi, '')
      .trim() + orderConfirmationBlock;

  } catch(e) {
    // Se o parse falhar, remove qualquer sujeira
    rawText = rawText
      .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*?\\]/gi, '')
      .replace(/\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\}/gi, '')
      .trim();
  }
}

// 2. Limpeza Rigorosa Anti-Vazamento (Remove qualquer fragmento residual de JSON ou tags)
rawText = rawText
  .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*?\\]/gi, '')
  .replace(/,\s*"paymentMethod"[\s\S]*?\}/gi, '')
  .replace(/,\s*"deliveryType"[\s\S]*?\}/gi, '')
  .replace(/,\s*"neighborhood"[\s\S]*?\}/gi, '')
  .replace(/\\{[\\s\\S]*?"customerName"[\\s\\S]*?\\}/gi, '')
  .trim();

// 3. Extração de Fotos [FOTO: ...]
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

// 4. Extração da Fala para Áudio [FALA: ...]
let speechText = '';
const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
if (falaMatch && falaMatch[1]) {
  speechText = falaMatch[1].trim();
} else {
  const cleanFirst = rawText.split('\\n')[0].replace(/[*_~#\`\\[\\]!]/g, '').trim();
  if (orderCreated) {
    speechText = \`Pedido confirmado com sucesso, \${orderCreated.customerName}! A sua carga já está em separação no centro de distribuição da Hub, Obra para entrega em \${orderCreated.neighborhood}. Deixei o link do seu comprovante aqui na mensagem!\`;
  } else if (cleanFirst && cleanFirst.length > 10 && cleanFirst.length < 180) {
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

// 5. Resposta formatada por escrito para o WhatsApp
let respostaFormatada = rawText
  .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
  .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
  .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*?\\]/gi, '')
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
    orderCreated: orderCreated,
    isAudioInput: Boolean(initialData.isAudio),
    hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
  }
}];`;

async function deploy() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  // 1. Atualizar o Agente IA com o novo System Message que contém o Funil em 5 Passos
  nodes = nodes.map(node => {
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT;
    }

    // 2. Atualizar o Formatador de Resposta com o novo parser resiliente, anti-vazamento e links clicáveis
    if (node.name.includes('Formatar Resposta') || node.id === 'code-format-response') {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = JS_FORMAT_RESPONSE;
    }

    return node;
  });

  console.log('📦 Enviando atualização com Funil em 5 Passos e Links Clicáveis para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! FUNIL DE ATENDIMENTO E RECIBO DIGITAL ATIVADOS NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploy().catch(console.error);
