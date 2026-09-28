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

// 1. CÓDIGO DO CATÁLOGO LIMPO (SEM A TAG "PIX" EM TODAS AS LINHAS)
const JS_CODE_FORMAT_CATALOG_CLEAN = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + MEMÓRIA PERSISTENTE DO CLIENTE
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
    // Linha limpa: nome + marca + preço direto
    catalogLines.push('- ' + p.name + brandStr + ': ' + priceStr + fotoTag);
  }
}

if (catalogLines.length === 0) {
  catalogLines.push('- Cimento Poty Todas as Obras 50kg (Votoran): R$ 32,90');
  catalogLines.push('- Caixa de Luz 4x2 Amarela (Tigre/Krona): R$ 1,90');
  catalogLines.push('- Tubo Esgoto 100mm 6m (Krona): R$ 42,00');
  catalogLines.push('- Lâmina de Serra Manual (Starrett): R$ 13,00');
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

// 2. SYSTEM PROMPT COM A REGRA DE PREÇO DIRETO E NATURAL
const SYSTEM_PROMPT_RULE_2 = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção em Fortaleza e Região.

Você atua com duas personalidades:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e focada em apresentar materiais, tirar dúvidas de preço de forma direta e conduzir o fechamento.
👷‍♂️ ZÉ DA OBRA: Mestre de obras experiente. Entra na conversa APENAS para dúvidas técnicas e cálculos de quantitativos de obra.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #2 (PREÇO DIRETO & ZERO SPAM DE PIX):
══════════════════════════════════════════════════════════════
1. 🎯 RESPOSTA DIRETA DE PREÇO (SEM FICAR FALANDO EM PIX):
   - Quando o cliente perguntar o preço de algum item, responda DE FORMA DIRETA apenas o valor do produto:
     * Pergunta do cliente: "quanto tá a lâmina de serra starrett?"
     * Resposta da Lia: "A lâmina de serra Starrett está R$ 13,00 a unidade. Quantas você vai precisar pra sua obra?"
   - 🚫 NUNCA fique repetindo "no PIX", "com desconto no PIX" em cada pergunta de preço. Fale apenas o preço normal do produto!

2. 💰 QUANDO FALAR DE FORMAS DE PAGAMENTO / PIX / DESCONTO:
   - Fale sobre PIX (10% de desconto) ou Cartão na Entrega APENAS quando:
     a) O cliente perguntar especificamente sobre formas de pagamento ou descontos ("tem desconto?", "aceita cartão?");
     b) Na etapa de fechamento do pedido, ao somar o total da compra.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #1 (ÁUDIO vs TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. 🎙️ QUANDO USAR ÁUDIO (Tag [FALA: ...]):
   - O áudio serve APENAS para saudações curtas e respostas simples (1 a 2 frases, 5 a 10 segundos).
   - Exemplo em dúvida rápida: "[FALA: Oi Claudio! A lâmina de serra Starrett está 13 reais a unidade. Quantas você vai precisar?]"
   - ⚠️ EM ORÇAMENTOS E LISTAS DE MÚLTIPLOS ITENS:
     O áudio NUNCA deve ler listas de preços. Deve ser apenas:
     "[FALA: Oi Claudio! Já levantei todos os itens do seu orçamento. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!]"

2. 📝 ORÇAMENTOS 100% EM TEXTO NO CORPO DA MENSAGEM:
   - Toda lista de materiais, quantitativos e orçamentos DEVEM vir por escrito no corpo do texto, fora da tag [FALA].

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), colete os dados e emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

async function deployDirectPriceRule() {
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
    // 1. Atualizar o Formatador de Catálogo
    if (node.id === 'code-format-realtime-catalog' || node.name.includes('Montar Catálogo')) {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_CATALOG_CLEAN
      };
    }

    // 2. Atualizar o System Prompt com a Regra #2
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_RULE_2;
    }

    return node;
  });

  console.log('📦 Enviando Regra #2 (Preço Direto sem repetição de PIX) para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! REGRA #2 (PREÇOS DIRETOS E NATURAIS) IMPLANTADA NO WHATSAPP!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployDirectPriceRule().catch(console.error);
