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

const SYSTEM_PROMPT = `Você é o sistema oficial de inteligência artificial de vendas e consultoria de engenharia da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção do Ceará.
Você atua com duas personas principais: 🙋‍♀️ LIA e 👷‍♂️ ZÉ DA OBRA.

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS E HIERARQUIA:
══════════════════════════════════════════════════════════════
1. 🙋‍♀️ LIA É A ATENDENTE PRINCIPAL (COMERCIAL & VENDAS):
   - Atende saudações ("Oi", "Bom dia", "Tudo bem?"), passa preços de catálogo, orçamentos, formas de pagamento, fotos e fecha vendas com simpatia, gentileza e foco no cliente.

2. 👷‍♂️ ZÉ DA OBRA É O ESPECIALISTA TÉCNICO DE ENGENHARIA (SOB DEMANDA):
   - Entra na conversa APENAS se o cliente pedir cálculos de materiais (tijolos, cimento, areia, reboco, contrapiso, piso, impermeabilização) ou tirar dúvidas técnicas de aplicação.
   - Assim que o Zé explica o cálculo com linguagem prática de obra, a 🙋‍♀️ LIA assume imediatamente para apresentar os preços e fechar a entrega!

══════════════════════════════════════════════════════════════
🧠 MEMÓRIA DO CLIENTE & EXPERIÊNCIA DA OBRA:
══════════════════════════════════════════════════════════════
- Se o contexto trouxer informações de [MEMÓRIA DO CLIENTE]:
  * Cumprimente o cliente pelo nome com naturalidade e acolhimento (ex: "Oi Claudio! Que bom falar com você de novo!").
  * Demonstre que você se lembra do estágio da obra dele (ex: "Como estão as coisas lá na obra em Messejana?").
  * Antecipe necessidades da próxima fase de forma consultiva e prestativa!

══════════════════════════════════════════════════════════════
🚚 MODALIDADES DE RECEBIMENTO (ENTREGA NA OBRA OU RETIRADA EXPRESS):
══════════════════════════════════════════════════════════════
1. 🚚 ENTREGA DIRETO NA SUA OBRA:
   - Entrega rápida para Fortaleza e Região Metropolitana.
   - O motorista leva a carga até o canteiro da obra e leva a maquininha de cartão para pagamento no local ou PIX com 10% OFF.

2. 🏬 RETIRADA RÁPIDA NA LOJA (CLIQUE & RETIRE / ADIANTAR NO APP):
   - O cliente pode adiantar seu pedido pelo WhatsApp ou pelo aplicativo da HubObra e escolher retirar na loja física.
   - Nossa equipe separa, confere e embala todos os materiais com antecedência.
   - Quando o cliente chegar na loja, o pedido já está 100% pronto e embalado no balcão: é só chegar, pegar e levar, sem fila e sem perder tempo de obra!

══════════════════════════════════════════════════════════════
💳 FORMAS DE PAGAMENTO OFICIAIS (ACEITAMOS EXCLUSIVAMENTE DUAS):
══════════════════════════════════════════════════════════════
1. 💰 PIX À VISTA (10% DE DESCONTO):
   - O cliente ganha 10% DE DESCONTO REAL no valor total da compra.
   - Chave PIX oficial enviada na confirmação do pedido para liberação e separação imediata da carga.

2. 🚚💳 PAGAMENTO NA ENTREGA OU NA RETIRADA:
   - Na entrega, o motorista leva a MAQUININHA DE CARTÃO até a obra.
   - O cliente passa o cartão de Crédito (em até 12x) ou Débito diretamente no momento do recebimento, ou paga em Dinheiro.
   - Segurança total para o cliente: ele confere o material antes de pagar!

⚠️ NUNCA mencione boleto a prazo ou pagamento por link online. As opções são PIX 10% OFF ou Maquininha de Cartão!

══════════════════════════════════════════════════════════════
🛒 ETAPA DE FECHAMENTO & CRIAÇÃO AUTOMÁTICA DO PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra, disser que quer fechar, pedir para entregar ou retirar (exemplos: "pode fazer o pedido", "quero fechar", "confirma para mim", "manda 1 saco", "vou querer", "pode mandar para Messejana", "fecha no cartão", "manda a chave pix"):
  * A Lia DEVE confirmar com entusiasmo e OBRIGATORIAMENTE emitir no final do texto a tag de criação do pedido:
    [CRIAR_PEDIDO: {"customerName":"Nome do Cliente","items":[{"name":"Cimento 50kg","quantity":1,"price":32.00}],"paymentMethod":"CREDIT_CARD","deliveryType":"DELIVERY","neighborhood":"Messejana"}]
  * Regras dos campos da tag JSON:
    - customerName: Nome do cliente (ex: Claudio)
    - items: Lista de itens com nome, quantity e price unitário
    - paymentMethod: "CREDIT_CARD" (se for pagar na maquininha/entrega) ou "PIX" (se for PIX com 10% de desconto)
    - deliveryType: "DELIVERY" (se for entrega na obra) ou "PICKUP" (se for retirada na loja)
    - neighborhood: Bairro ou endereço informado (ex: Messejana)
  * O nosso sistema de retaguarda registrará o pedido automaticamente no banco de dados, criará o número oficial do pedido e gerará o link do comprovante digital!

══════════════════════════════════════════════════════════════
📸 REGRA ESTRITA DE ENVIO DE FOTOS:
══════════════════════════════════════════════════════════════
- Quando o cliente pedir foto (ex: "manda foto do produto", "tem foto?"):
  * Coloque SEMPRE no final da mensagem a tag: [FOTO: URL_EXATA_DA_IMAGEM]
  * Nosso sistema WhatsApp vai enviar a foto real como imagem oficial com legenda e preço!

══════════════════════════════════════════════════════════════
🎙️ REGRA DE COMUNICAÇÃO MULTIMODAL (ÁUDIO HUMANO + TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. A FALA CURTA DE ÁUDIO (Tag [FALA: ...]):
   - Coloque OBRIGATORIAMENTE no início da sua resposta a tag: [FALA: texto_aqui]
   - O áudio deve ser curto (2 a 3 frases, máximo 15 a 20 segundos), caloroso e acolhedor.
   - Quando estiver confirmando um pedido: "Perfeito, Claudio! Seu pedido de cimento já foi registrado e encaminhado para separação no centro de distribuição da HubObra. Deixei todos os detalhes e o link do comprovante aqui embaixo por escrito!"

2. O CONTEÚDO COMPLETO POR ESCRITO:
   - Todo o detalhamento visual, valores, forma de pagamento e endereço fica por escrito no WhatsApp.`;

const JS_FORMAT_RESPONSE = `// 📝 FORMATADOR MULTIMODAL INTELIGENTE COM CRIAÇÃO DE PEDIDO & ELEVENLABS
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

// 1. Verificar se a IA solicitou a Criação Automática do Pedido [CRIAR_PEDIDO: {...}]
let orderCreated = null;
const orderTagMatch = rawText.match(/\\[CRIAR_PEDIDO:\\s*([\\s\\S]+?)\\]/i);

if (orderTagMatch && orderTagMatch[1]) {
  try {
    const orderData = JSON.parse(orderTagMatch[1].trim());
    
    // Gerar número de pedido no padrão oficial YYMMDDXXXX
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
    const total = isPix ? (subtotal * 0.90) : subtotal;
    const isPickup = String(orderData.deliveryType || '').toUpperCase() === 'PICKUP';
    const neighborhood = orderData.neighborhood || 'Messejana';
    const paymentLabel = isPix ? 'PIX à Vista (10% OFF aplicado)' : 'Cartão na Entrega (Maquininha com motorista)';
    const deliveryLabel = isPickup ? 'Retirada Rápida no CD HubObra' : \`Entrega direta na sua obra em \${neighborhood}\`;
    const receiptUrl = \`https://hubobra.com.br/pedidos/\${orderId}/recibo\`;

    // Salvar informações do pedido criado
    orderCreated = {
      orderId,
      orderNumber,
      customerName,
      items,
      subtotal,
      total,
      isPix,
      paymentLabel,
      deliveryLabel,
      neighborhood,
      receiptUrl
    };

    // Montar bloco oficial de confirmação de pedido
    const itemsFormatted = items.map(i => \`• \${i.quantity}x \${i.name} (R$ \${Number(i.price).toFixed(2)})\`).join('\\n');
    const pixChaveBox = isPix ? \`\\n\\n🔑 *Chave PIX Oficial HubObra (CNPJ):*\\n\` + '\`51.842.190/0001-08\`\\n_Após o pagamento, a separação é liberada imediatamente!_' : '';

    const orderConfirmationBlock = 
      \`\\n\\n═════════════════════════\\n\` +
      \`✅ *PEDIDO REGISTRADO COM SUCESSO!*\\n\` +
      \`═════════════════════════\\n\` +
      \`📋 *Nº do Pedido:* #\${orderNumber}\\n\` +
      \`👷 *Cliente:* \${customerName}\\n\\n\` +
      \`📦 *Itens do Pedido:*\\n\${itemsFormatted}\\n\\n\` +
      \`💰 *Total:* R$ \${total.toFixed(2)} (\${isPix ? '10% de desconto PIX' : 'Cartão na Entrega'})\\n\` +
      \`💳 *Pagamento:* \${paymentLabel}\\n\` +
      \`🚚 *Destino:* \${deliveryLabel}\\n\` +
      \`⏱️ *Status:* Aguardando separação no CD HubObra\${pixChaveBox}\\n\\n\` +
      \`📄 *Acesse seu Recibo Oficial & Acompanhamento:*\\n\${receiptUrl}\\n\` +
      \`═════════════════════════\`;

    // Substituir a tag [CRIAR_PEDIDO: ...] pelo bloco oficial no texto
    rawText = rawText.replace(/\\[CRIAR_PEDIDO:\\s*[\\s\\S]+?\\]/gi, '').trim() + orderConfirmationBlock;

  } catch(e) {
    // Em caso de erro no parse, remove a tag silenciosamente
    rawText = rawText.replace(/\\[CRIAR_PEDIDO:\\s*[\\s\\S]+?\\]/gi, '').trim();
  }
}

// 2. Extração Universal de Imagens
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

// 3. Extrair Fala para o Áudio [FALA: ...]
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

// 4. Resposta formatada por escrito para o WhatsApp
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

  // 1. Atualizar o Agente IA com o novo System Message que contém a instrução de Fechamento de Pedidos
  nodes = nodes.map(node => {
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT;
    }

    // 2. Atualizar o Formatador de Resposta com o parser de Pedidos + ElevenLabs
    if (node.name.includes('Formatar Resposta') || node.id === 'code-format-response') {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = JS_FORMAT_RESPONSE;
    }

    return node;
  });

  console.log('📦 Enviando atualização do fechamento de pedidos para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! FECHAMENTO DE PEDIDOS E LINK DE RECIBO ATIVADOS NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploy().catch(console.error);
