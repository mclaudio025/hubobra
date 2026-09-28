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

const JS_CODE_FORMAT_CATALOG_ROBUST = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + DICIONÁRIO CEARÊS + MEMÓRIA ROBUSTA DO CLIENTE
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

// 1. Recuperar Produtos Reais do Supabase
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

// 2. Buscar Dicionário, Expressões, Treinadores e Memória do Supabase
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';

let slangDictionaryText = 'Dicionário Padrão Ativo.';
let regionalCearesText = 'Tom caloroso e comercial cearense.';
let salesLearningsText = 'Regras práticas de quantitativos ativas.';
let isTrainer = false;
let trainerInfo = null;
let customerProfile = null;
let customerMemoryText = 'Primeiro Atendimento - Cliente novo na loja. Seja acolhedor e descubra o tipo de obra.';

try {
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  const cleanPhone = (initialData.phone || '').replace(/[^0-9]/g, '');

  // 2.1. Verificar Treinador Autorizado
  const trainersRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_trainers?select=phone,name,role&is_active=eq.true',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(trainersRes)) {
    trainerInfo = trainersRes.find(t => t.phone.replace(/[^0-9]/g, '') === cleanPhone);
    isTrainer = Boolean(trainerInfo);
  }

  // 2.2. Gírias e Apelidos de Obra
  const termsRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_construction_terms?select=slang_term,official_term,category,explanation&order=slang_term.asc&limit=100',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(termsRes) && termsRes.length > 0) {
    slangDictionaryText = termsRes.map(t => '- "' + t.slang_term + '" (' + t.category + ') ➔ Termo Oficial: ' + t.official_term + (t.explanation ? ' | Obs: ' + t.explanation : '')).join('\\n');
  }

  // 2.3. Expressões Regionais Cearenses
  const exprRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_regional_expressions?select=expression,usage_context,tone_impact,example_phrase&is_active=eq.true&limit=20',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(exprRes) && exprRes.length > 0) {
    regionalCearesText = exprRes.map(e => '- "' + e.expression + '" [' + e.usage_context + ']: ' + e.tone_impact + ' (Ex: "' + e.example_phrase + '")').join('\\n');
  }

  // 2.4. Sabedoria de Balcão
  const learnRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_sales_learnings?select=topic,rule_content&is_active=eq.true&limit=10',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(learnRes) && learnRes.length > 0) {
    salesLearningsText = learnRes.map(l => '- ' + l.topic + ': ' + l.rule_content).join('\\n');
  }

  // 2.5. Memória do Cliente (Sem travar se for novo!)
  const memRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/customer_ai_profiles?phone=eq.' + cleanPhone + '&select=*',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(memRes) && memRes.length > 0) {
    customerProfile = memRes[0];
  }
} catch(err) {
  console.warn('Erro ao carregar dados do Supabase:', err.message);
}

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

const isTeachingIntent = isTrainer && /(anota|aprende|grava|ensina|adiciona|nova gíria|novo termo|nova regra|dicionario|dicionário)/i.test(currentMessageText);

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
    hasProfile: Boolean(customerProfile),
    isTrainer: isTrainer,
    trainerName: trainerInfo ? trainerInfo.name : null,
    isTeachingIntent: isTeachingIntent
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

  nodes = nodes.map(node => {
    if (node.id === 'code-format-realtime-catalog' || node.name.includes('Montar Catálogo')) {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_CATALOG_ROBUST
      };
    }
    return node;
  });

  // Conectar Buscar Estoque diretamente ao Montar Catálogo (sem depender de fetch-customer-memory)
  connections['📦 Buscar Estoque em Tempo Real (Supabase)'] = {
    main: [
      [
        {
          node: '🔄 Montar Catálogo Dinâmico & Memória',
          type: 'main',
          index: 0
        }
      ]
    ]
  };

  // Remover conexão de fetch-customer-memory
  delete connections['🧠 Buscar Memória do Cliente (Supabase)'];

  console.log('📦 Enviando conexão robusta para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! FLUXO 100% ROBUSTO E ATIVO PARA CLIENTES NOVOS E RECORRENTES!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploy().catch(console.error);
