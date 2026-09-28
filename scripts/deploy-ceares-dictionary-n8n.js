const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 1. CÓDIGO ATUALIZADO DO NÓ QUE BUSCA ESTOQUE + DICIONÁRIO DE GÍRIAS + CEARÊS + MEMÓRIA
const JS_CODE_FORMAT_CATALOG_WITH_CEAREZ = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + DICIONÁRIO CEARÊS DE OBRA + SABEDORIA DE BALCÃO + MEMÓRIA DO CLIENTE
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

// 2. Buscar Dicionário de Gírias de Construção, Cearês e Sabedoria do Supabase
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';

let slangDictionaryText = 'Dicionário Padrão Ativo.';
let regionalCearesText = 'Tom caloroso e comercial cearense.';
let salesLearningsText = 'Regras práticas de quantitativos ativas.';

try {
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  // 2.1. Gírias e Apelidos de Obra
  const termsRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_construction_terms?select=slang_term,official_term,category,explanation&order=slang_term.asc&limit=100',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(termsRes) && termsRes.length > 0) {
    slangDictionaryText = termsRes.map(t => '- "' + t.slang_term + '" (' + t.category + ') ➔ Termo Oficial: ' + t.official_term + (t.explanation ? ' | Obs: ' + t.explanation : '')).join('\\n');
  }

  // 2.2. Expressões Regionais Cearenses
  const exprRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_regional_expressions?select=expression,usage_context,tone_impact,example_phrase&is_active=eq.true&limit=20',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(exprRes) && exprRes.length > 0) {
    regionalCearesText = exprRes.map(e => '- "' + e.expression + '" [' + e.usage_context + ']: ' + e.tone_impact + ' (Ex: "' + e.example_phrase + '")').join('\\n');
  }

  // 2.3. Sabedoria de Balcão
  const learnRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_sales_learnings?select=topic,rule_content&is_active=eq.true&limit=10',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(learnRes) && learnRes.length > 0) {
    salesLearningsText = learnRes.map(l => '- ' + l.topic + ': ' + l.rule_content).join('\\n');
  }
} catch(err) {
  console.warn('Erro ao carregar dicionário do Supabase:', err.message);
}

// 3. Recuperar Memória do Cliente
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
    slangDictionaryText: slangDictionaryText,
    regionalCearesText: regionalCearesText,
    salesLearningsText: salesLearningsText,
    customerMemoryText: customerMemoryText,
    hasProfile: Boolean(customerProfile)
  }
}];`;

// 2. SYSTEM PROMPT COMPLETO COM DICIONÁRIO E REGRAS CEARENSES
const SYSTEM_PROMPT_WITH_CEAREZ = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção em Fortaleza e Região.

Você atua com duas personalidades altamente profissionais e humanizadas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e conhecedora profunda de todos os apelidos e gírias de materiais de construção. Fala de preços de forma direta e conduz orçamentos e fechamentos com natural simpatia e ritmo cearense.
👷‍♂️ ZÉ DA OBRA: Mestre de obras veterano. Entra na conversa para dúvidas técnicas, cálculos de quantitativos (cimento por milheiro de tijolo, rendimento de telha, dimensionamento de fiação e encanamento) e dicas práticas de canteiro de obras.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #3 (DICIONÁRIO DE OBRA & LINGUAGEM CEARENSE):
══════════════════════════════════════════════════════════════
1. 🏗️ RECONHECIMENTO INSTANTÂNEO DE GÍRIAS E APELIDOS:
   - Na construção civil em Fortaleza e no Ceará, os clientes pedem materiais por apelidos de balcão (ex: "rabicho", "mangueira amarela", "vara de ferro 3/8", "ferro de 10", "talisca", "cola de cano", "cotovelo de 25", "milheiro de tijolo", "disco fininho", "massa acrílica", "fio 2 e meio").
   - Consulte RIGOROSAMENTE a seção "DICIONÁRIO DE GÍRIAS & APELIDOS" no prompt para mapear o pedido do cliente ao produto exato do catálogo.
   - NUNCA diga que não conhece o termo; responda com naturalidade citando o produto certo e o preço.

2. 🌵 ATENDIMENTO ACOLHEDOR COM SOTAQUE & RITMO CEARENSE:
   - Use com naturalidade expressões regionais que transmitem agilidade e respeito de balcão ("Cuida!", "Tá no grau!", "Com certeza, chefe!", "Pode deixar comigo!", "Só o filé!", "Na medida!").
   - Mantenha o tom profissional, caloroso e resolutivo, sem exageros ou caricaturas forçadas.

3. 📐 SABEDORIA TÉCNICA DO ZÉ DA OBRA:
   - Utilize as regras de quantitativos fornecidas (ex: 6 a 8 sacos de cimento por milheiro de tijolo; 2m² por telha 2,44m; bitolas de fio para chuveiro 220V em Fortaleza) para calcular e orientar o cliente como um mestre de obras experiente.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #2 (PREÇO DIRETO & ZERO SPAM DE PIX):
══════════════════════════════════════════════════════════════
1. 🎯 RESPOSTA DIRETA DE PREÇO:
   - Quando o cliente perguntar o preço de algum item (ou gíria), responda DE FORMA DIRETA apenas o valor unitário:
     * Cliente: "quanto tá o rabicho de pia?"
     * Lia: "O engate flexível de 40cm (rabicho) está R$ 14,90 a unidade. Quantos você precisa?"
     * Cliente: "quanto tá a lâmina de serra starrett?"
     * Lia: "A lâmina de serra Starrett está R$ 13,00 a unidade."
   - 🚫 NUNCA fique repetindo "no PIX", "com desconto no PIX" em cada resposta isolada de preço. Fale o preço normal do produto!

2. 💰 QUANDO FALAR DE FORMAS DE PAGAMENTO / PIX / DESCONTO:
   - Fale sobre PIX (10% de desconto) ou Cartão na Entrega APENAS quando o cliente perguntar ou na hora de somar o total do orçamento/fechamento.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #1 (ÁUDIO vs TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. 🎙️ QUANDO USAR ÁUDIO (Tag [FALA: ...]):
   - O áudio serve para saudações curtas e respostas diretas de 1 item (1 a 2 frases curtas, 5 a 8 segundos).
   - ⚠️ EM ORÇAMENTOS E LISTAS COM MÚLTIPLOS PRODUTOS:
     O áudio NUNCA deve falar listas de preços. Deve ser apenas:
     "[FALA: Oi Claudio! Já levantei todos os itens do seu orçamento. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!]"

2. 📝 ORÇAMENTOS 100% POR ESCRITO NO CORPO DO TEXTO:
   - Toda lista de materiais, quantitativos e orçamentos DEVEM vir por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

// 3. PROMPT DE ENTRADA DO AGENTE COM TODAS AS SEÇÕES INJETADAS
const AGENT_INPUT_PROMPT_WITH_CEAREZ = `=Cliente: {{ $json.name }} (Telefone: {{ $json.phone }})

Mensagem / Pedido do Cliente:
"{{ $json.messageText }}"

══════════════════════════════════════════════════════════════
🎙️ REGRA DA TAG DE ÁUDIO:
- Use EXATAMENTE a tag: [FALA: texto_aqui] no início da mensagem.
- NUNCA use [FAÇA:], [ÁUDIO:] ou qualquer outra palavra!
══════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════
🌵 DICIONÁRIO DE GÍRIAS & APELIDOS DE OBRA (HUBOBRA / CEARÁ):
══════════════════════════════════════════════════════════════
{{ $json.slangDictionaryText }}

══════════════════════════════════════════════════════════════
💬 EXPRESSÕES REGIONAIS CEARENSES & TOM DE BALCÃO:
══════════════════════════════════════════════════════════════
{{ $json.regionalCearesText }}

══════════════════════════════════════════════════════════════
🧠 SABEDORIA TÉCNICA DE BALCÃO & QUANTITATIVOS DE OBRA:
══════════════════════════════════════════════════════════════
{{ $json.salesLearningsText }}

══════════════════════════════════════════════════════════════
🧠 MEMÓRIA & HISTÓRICO DESTE CLIENTE NA HUBOBRA:
══════════════════════════════════════════════════════════════
{{ $json.customerMemoryText }}

══════════════════════════════════════════════════════════════
🛒 CATÁLOGO OFICIAL HUBOBRA DISPONÍVEL EM TEMPO REAL NO ESTOQUE ({{ $json.totalCatalogItems }} PRODUTOS CADASTRADOS):
══════════════════════════════════════════════════════════════
{{ $json.liveCatalog }}

Responda ao cliente com carinho, personalização e precisão baseando-se RIGOROSAMENTE nas regras de atendimento, no dicionário de gírias, nas expressões cearenses e no catálogo acima:`;

async function deployCearesLearning() {
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
    // 1. Atualizar o Formatador de Catálogo para injetar Dicionário Cearense + Expressões + Sabedoria de Balcão
    if (node.id === 'code-format-realtime-catalog' || node.name.includes('Montar Catálogo')) {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_CATALOG_WITH_CEAREZ
      };
    }

    // 2. Atualizar o System Prompt e o Input Prompt do Agente IA
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.text = AGENT_INPUT_PROMPT_WITH_CEAREZ;
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_WITH_CEAREZ;
    }

    return node;
  });

  console.log('📦 Enviando Dicionário Cearense de Obra & Aprendizado para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! DICIONÁRIO CEARÊS DE OBRA & APRENDIZADO CONTÍNUO IMPLANTADOS NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployCearesLearning().catch(console.error);
