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

// 1. Novo código do nó "🔄 Montar Catálogo Dinâmico & Memória"
const newCatalogJsCode = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + DICIONÁRIO CEARÊS + DIÁLOGOS + MEMÓRIA + ORÇAMENTOS + TREINADORES / ADMIN
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
    const skuStr = p.sku ? ' [SKU: ' + p.sku + ']' : '';
    const priceNum = Number(p.price || 0);
    const priceStr = 'R$ ' + priceNum.toFixed(2).replace('.', ',');
    const fotoTag = imgUrl ? ' | [FOTO: ' + imgUrl + ']' : '';
    catalogLines.push('- ' + p.name + brandStr + skuStr + ': ' + priceStr + fotoTag);
  }
}

if (catalogLines.length === 0) {
  catalogLines.push('- Cimento Poty Todas as Obras 50kg (Votoran) [SKU: 7891234567890]: R$ 32,90');
  catalogLines.push('- Caixa de Luz 4x2 Amarela (Tigre/Krona) [SKU: 7891234567891]: R$ 1,90');
  catalogLines.push('- Tubo Esgoto 100mm 6m (Krona) [SKU: 7891234567892]: R$ 42,00');
  catalogLines.push('- Lâmina de Serra Manual (Starrett) [SKU: 7891234567893]: R$ 13,00');
  catalogLines.push('- Fita Isolante Imperial 5m (3M) [SKU: 7891234567894]: R$ 5,50');
  catalogLines.push('- Fita Isolante Imperial 10m (3M) [SKU: 7891234567895]: R$ 8,00');
}

const liveCatalog = catalogLines.join('\\n');

// 2. Buscar Dados do Supabase
const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

const supaHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json'
};

let slangDictionaryText = 'Dicionário Padrão Ativo.';
let regionalCearesText = 'Tom caloroso e comercial cearense.';
let salesLearningsText = 'Regras práticas de quantitativos ativas.';
let openQuotesText = 'Nenhum orçamento aberto no momento.';
let isTrainer = false;
let trainerInfo = null;

const rawPhone = (initialData.phone || initialData.from || '').replace(/\\D/g, '');

try {
  // 2.1. Checagem de Treinador / Administrador Autorizado (ai_trainers)
  const last8 = rawPhone.slice(-8);
  const trainerRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_trainers?is_active=eq.true&select=phone,name,role',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(trainerRes)) {
    trainerInfo = trainerRes.find(t => {
      const tDigits = (t.phone || '').replace(/\\D/g, '');
      return rawPhone.includes(tDigits) || tDigits.includes(rawPhone) || (last8 && last8.length >= 8 && tDigits.endsWith(last8));
    });
    if (trainerInfo) {
      isTrainer = true;
    }
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

  // 2.3. Expressões Regionais
  const exprRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_regional_expressions?select=expression,usage_context,tone_impact,example_phrase&is_active=eq.true&order=created_at.desc&limit=30',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(exprRes) && exprRes.length > 0) {
    regionalCearesText = exprRes.map((e, idx) => {
      let block = '【EXEMPLO ' + (idx + 1) + ' - ' + e.expression + ' (' + e.usage_context + ')】\\n';
      if (e.example_phrase) block += e.example_phrase + '\\n';
      if (e.tone_impact) block += '➔ Dica de Atendimento: ' + e.tone_impact;
      return block;
    }).join('\\n\\n');
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

  // 2.5. Buscar Orçamentos em Aberto
  if (last8 && last8.length >= 8) {
    const quotesRes = await this.helpers.httpRequest({
      url: SUPABASE_URL + '/rest/v1/quotes?customerPhone=like.*' + last8 + '*&status=eq.OPEN&order=createdAt.desc&limit=3&select=quoteNumber,total,createdAt,validUntil,notes,items:quote_items(name,quantity,unitPrice,total)',
      method: 'GET',
      headers: supaHeaders,
      timeout: 3000
    });

    if (Array.isArray(quotesRes) && quotesRes.length > 0) {
      openQuotesText = quotesRes.map(q => {
        const itemsList = (q.items || []).map(i => i.quantity + 'x ' + i.name).join(', ');
        const totalStr = 'R$ ' + Number(q.total || 0).toFixed(2).replace('.', ',');
        return '- Orçamento #' + q.quoteNumber + ' (' + totalStr + '): ' + itemsList;
      }).join('\\n');
    }
  }
} catch(err) {
  console.warn('Erro ao carregar dados do Supabase:', err.message);
}

// 3. Recuperar Memória do Usuário
let customerMemoryText = 'Primeiro Atendimento - Cliente novo na loja.';
let customerProfile = null;

try {
  const memoryNode = $('🧠 Buscar Memória do Cliente (Supabase)').first();
  if (memoryNode && memoryNode.json && Array.isArray(memoryNode.json) && memoryNode.json.length > 0) {
    customerProfile = memoryNode.json[0];
  } else if (memoryNode && memoryNode.json && memoryNode.json.phone) {
    customerProfile = memoryNode.json;
  }
} catch(_) {}

if (isTrainer && trainerInfo) {
  customerMemoryText = \`👑 PERFIL DO USUÁRIO NA CONVERSA:
- NOME: \${trainerInfo.name} (\${trainerInfo.role || 'Treinador Master / Administrador da Loja'})
- AUTORIDADE: TOTAL / ADMINISTRADOR DO SISTEMA
- TELEFONE REGISTRADO: \${trainerInfo.phone}
- CAPACIDADES ESPECIAIS DESTE USUÁRIO:
  1. Pode pedir para você ALTERAR O PREÇO DE QUALQUER PRODUTO DO CATÁLOGO (Ex: "Lia, altera o preço do cimento para 34,90", "ajusta o vedatop para 95,00", "#preco SKU 34.90").
  2. Pode te ENSINAR novas regras de vendas, termos de construção e gírias.
  3. Pode simular compras normais e orçamentos em testes.
- INSTRUÇÃO OBRIGATÓRIA PARA A LIA:
  * NUNCA diga a ele que você não consegue alterar valores ou que é apenas uma IA de vendas!
  * Atenda com prontidão: localize o produto no catálogo, confirme o preço atual e novo, e aplique a alteração.\`;
} else if (customerProfile && customerProfile.phone) {
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
    openQuotesText: openQuotesText,
    customerMemoryText: customerMemoryText,
    isTrainer: isTrainer,
    trainerName: trainerInfo ? trainerInfo.name : null,
    hasProfile: Boolean(customerProfile)
  }
}];
`;

// 2. Novo System Prompt do Agente IA (Lia + Zé da Obra)
const newAgentSystemPrompt = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o marketplace de materiais de construção de Fortaleza e Ceará.

Você atua com duas personalidades altamente profissionais e humanizadas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e conhecedora profunda do catálogo e dos termos práticos de materiais de construção. Fala de preços de forma direta, clara e prestativa, com o ritmo acolhedor e simpático do comércio de Fortaleza.
👷‍♂️ ZÉ DA OBRA: Mestre de obras veterano. Entra na conversa apenas para tirar dúvidas técnicas, cálculos de quantitativos (cimento por milheiro de tijolo, rendimento de telha, dimensionamento de fiação e encanamento) e dicas práticas de canteiro de obras.

══════════════════════════════════════════════════════════════
👑 REGRAS ESPECIAIS PARA TREINADORES MASTER & ADMINS:
══════════════════════════════════════════════════════════════
- Quando o usuário identificado como Treinador Master / Administrador (como o Claudio Sousa) falar com você, ELE POSSUI PERMISSÃO ADMINISTRATIVA TOTAL.
- 🏷️ ALTERAÇÃO DE PREÇOS NO CATÁLOGO:
  * Se ele pedir para alterar, atualizar, mudar ou ajustar o preço de qualquer produto (ex: "Lia, altera o preço do cimento poty para 34,90", "mudar preço do vedatop para 95,00", "#preco SKU-1002 34.90", "o cimento agora custa 33,50"):
    1. ✅ VOCÊ CONSEGUE SIM ALTERAR! NUNCA diga que não consegue ou que é apenas uma IA de vendas.
    2. Localize o produto no "ESTOQUE E CATÁLOGO EM TEMPO REAL" abaixo.
    3. Responda com simpatia no áudio [FALA: ...] e no texto.
    4. Apresente os dados com clareza: Produto, Preço Atual, Novo Preço e % de Variação.
    5. Se ele já pediu a alteração diretamente ("altera", "muda", "atualiza") ou se respondeu "SIM" / "CONFIRMO", emita OBRIGATORIAMENTE no final da mensagem a tag:
       <<<UPDATE_PRICE: {"product_name":"Nome Exato do Produto","sku":"SKU_SE_HOUVER","new_price":34.90,"old_price":32.90} >>>
    6. Confirme com entusiasmo: "✅ Preço do [Produto] atualizado com sucesso no catálogo para R$ XX,XX!"

══════════════════════════════════════════════════════════════
🤖 REGRA DE IDENTIDADE & TRANSPARÊNCIA (SOU UMA IA):
══════════════════════════════════════════════════════════════
- Quando o cliente perguntar se você é uma pessoa, robô, humano ou inteligência artificial:
  * 🚫 NUNCA minta dizendo "Sou sim uma pessoa" ou finja ser humana!
  * 💡 Responda com transparência, simpatia e presteza:
    1. Explique que você é a Lia, a Inteligência Artificial e Consultora Virtual oficial da HubObra.
    2. Diga que você consegue fazer o atendimento completo (tirar dúvidas técnicas, consultar estoque em tempo real, passar preços, montar orçamentos oficiais com PDF e fechar pedidos).
    3. Informe que se ele preferir falar com uma pessoa da equipe física, basta avisar que você transfere o atendimento para um humano na hora!
  * 🎙️ NO ÁUDIO [FALA: ...]: Fale com clareza e acolhimento (ex: "Oi, Claudio! Eu sou a Lia, a inteligência artificial oficial da HubObra! Consigo fazer seu atendimento completo por aqui, mas se preferir falar com um atendente humano da nossa equipe, é só me avisar que eu transfiro na hora pra você!").

══════════════════════════════════════════════════════════════
⭐ REGRA DE DOSAGEM NATURAL DO SOTAQUE CEARENSE (JEITO LIA):
══════════════════════════════════════════════════════════════
1. 🌵 REALISMO & ZERO EXAGERO (NÃO SEJA UMA CARICATURA):
   - O atendente cearense da vida real fala português correto, educado, ágil e acolhedor.
   - 🚫 PROIBIDO EMPILHAR GÍRIAS: NUNCA use mais de 1 expressão ou gíria por mensagem. Na dúvida, use nenhuma!
   - 🚫 NUNCA coloque 2 ou 3 expressões juntas na mesma frase.
   - 💡 O sotaque e o jeito cearense devem ser SUTIS e ESPORÁDICOS.

2. 🏗️ COMPREENSÃO PERFEITA DO DICIONÁRIO DE OBRA:
   - Use o dicionário de termos de obra para entender o que o cliente quer quando ele usar apelidos regionais ("rabicho", "fita de isolar", "boca de lobo", "pescoço de ganso", "esquadro").
   - Ao responder, confirme com o nome comercial claro e passe o valor exato.

3. 📸 REGRA RIGOROSA DE FOTOS NO WHATSAPP:
   - ⚠️ SÓ ENVIE FOTO SE O CLIENTE PEDIR EXPLICITAMENTE ("tem foto?", "manda a foto", "como ele é?").
   - 🚫 NUNCA envie foto se o cliente apenas perguntou o preço ou pediu orçamento.
   - Quando pedirem foto, inclua a tag [FOTO: url_da_imagem].

4. 🎯 PREÇO DIRETO & ZERO SPAM DE PIX:
   - Fale o preço unitário direto. Guarde condições de pagamento para o fechamento ou quando o cliente perguntar.

5. 🎙️ REGRA DE ÁUDIO (Tag [FALA: ...]):
   - Áudio curto (5-8s) para respostas simples ou saudações.
   - O texto do áudio deve ser limpo, natural e sem gírias empilhadas.
   - 💰 PREÇOS NO ÁUDIO: Fale valores de forma humana e direta (ex: "está 379 reais" ou "sai por 34 reais e 90 centavos"). NUNCA diga "zero centavos" ou "vírgula zero zero"!
   - Listas e orçamentos múltiplos SEMPRE por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
📋 GESTÃO DE ORÇAMENTOS & PDF (SOB DEMANDA):
══════════════════════════════════════════════════════════════
1. 📝 EMISSÃO DE ORÇAMENTO:
   - Quando o cliente pedir preço de vários itens ou um orçamento completo, calcule e liste todos os itens com valores unitários e total por escrito na mensagem.
   - Emita no final a tag:
   <<<ORCAMENTO: {"customerName":"Nome","items":[{"name":"Cimento Poty 50kg","brand":"Votoran","unit":"SC","quantity":10,"unitPrice":32.90}],"discount":0,"shipping":0,"notes":"Orçamento para obra"} >>>

2. 📄 ENVIO DE PDF:
   - Se o cliente pedir em PDF ("tem como mandar em PDF?", "manda o arquivo"), o sistema enviará o arquivo PDF anexado automaticamente.

3. 🔄 CONVERSÃO DE ORÇAMENTO EM PEDIDO:
   - Se o cliente pedir para fechar o pedido, confirme itens, endereço e emita a tag:
   <<<PEDIDO: {"customerName":"Nome","items":[{"name":"Cimento Poty 50kg","quantity":10,"price":32.90}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>
`;

// 3. Novo código do nó "📝 Formatar Resposta WhatsApp"
const newFormatJsCode = `// 🎯 PROCESSAR RESPOSTA DA IA (EXTRATOR MULTIMODAL + ALTERAÇÃO DE PREÇO + SUPABASE + UAZAPI)
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const aiResult = $input.first().json;

const rawText = aiResult.output || aiResult.text || '';
const customerName = initialData.name || 'Cliente';
const userMessage = initialData.messageText || '';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

async function httpReq(options) {
  try {
    if (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest) {
      return await this.helpers.httpRequest(options);
    }
  } catch(_) {}
  try {
    const res = await fetch(options.url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (options.json) return await res.json();
    return res;
  } catch(err) {
    console.warn('httpReq error:', err.message);
    return null;
  }
}

const supaHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

return (async () => {
  // 1. Processar tag UPDATE_PRICE (Alteração de Preço Solicitada pelo Treinador/Admin)
  if (rawText.includes('<<<UPDATE_PRICE:')) {
    const priceMatch = rawText.match(/<<<UPDATE_PRICE:\\s*([\\s\\S]*?)>>>/i);
    if (priceMatch && priceMatch[1]) {
      try {
        const pData = JSON.parse(priceMatch[1].trim());
        const newPrice = Number(pData.new_price);
        if (!isNaN(newPrice) && newPrice > 0) {
          let targetProd = null;

          // Buscar por SKU
          if (pData.sku) {
            const skuRes = await httpReq({
              url: SUPABASE_URL + '/rest/v1/products?sku=eq.' + encodeURIComponent(pData.sku) + '&select=id,name,sku,price',
              method: 'GET',
              headers: supaHeaders,
              json: true
            });
            if (Array.isArray(skuRes) && skuRes.length > 0) targetProd = skuRes[0];
          }

          // Se não achou por SKU, busca por Nome
          if (!targetProd && pData.product_name) {
            const cleanSearch = pData.product_name.replace(/[^a-zA-Z0-9\\s]/g, '').trim();
            const nameRes = await httpReq({
              url: SUPABASE_URL + '/rest/v1/products?name=ilike.*' + encodeURIComponent(cleanSearch) + '*&select=id,name,sku,price&limit=1',
              method: 'GET',
              headers: supaHeaders,
              json: true
            });
            if (Array.isArray(nameRes) && nameRes.length > 0) targetProd = nameRes[0];
          }

          if (targetProd) {
            // Atualizar produto no banco
            await httpReq({
              url: SUPABASE_URL + '/rest/v1/products?id=eq.' + targetProd.id,
              method: 'PATCH',
              headers: supaHeaders,
              body: {
                price: newPrice,
                updatedAt: new Date().toISOString()
              }
            });

            // Gravar histórico de auditoria (price_history)
            const adminUserRes = await httpReq({
              url: SUPABASE_URL + '/rest/v1/users?role=in.(ADMIN,STORE_ADMIN,SUPER_ADMIN,MANAGER)&limit=1&select=id',
              method: 'GET',
              headers: supaHeaders,
              json: true
            });
            const adminId = (Array.isArray(adminUserRes) && adminUserRes.length > 0) ? adminUserRes[0].id : null;

            if (adminId) {
              await httpReq({
                url: SUPABASE_URL + '/rest/v1/price_history',
                method: 'POST',
                headers: supaHeaders,
                body: {
                  productId: targetProd.id,
                  oldPrice: Number(pData.old_price || targetProd.price || 0),
                  newPrice: newPrice,
                  reason: 'Alteração solicitada via WhatsApp Lia por ' + (customerName || 'Treinador Master') + ' (' + (initialData.phone || '') + ')',
                  userId: adminId,
                  createdAt: new Date().toISOString()
                }
              });
            }
            console.log('🎉 Preço atualizado no Supabase com sucesso:', targetProd.name, '➔ R$', newPrice);
          }
        }
      } catch(pErr) {
        console.warn('Erro ao processar UPDATE_PRICE:', pErr.message);
      }
    }
  }

  // 2. Extração de Foto (caso o cliente tenha pedido foto)
  const userAskedPhoto = /(?:foto|fotos|imagem|imagens|como\\s+ele\\s+(é|parece)|como\\s+ela\\s+(é|parece)|quero\\s+ver|manda\\s+ver)/i.test(userMessage);
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  const mdImgMatch = rawText.match(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/i);
  const rawImgMatch = rawText.match(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/i);

  if (userAskedPhoto || fotoTagMatch) {
    if (fotoTagMatch && fotoTagMatch[1]) imageUrl = fotoTagMatch[1].trim();
    else if (mdImgMatch && mdImgMatch[1]) imageUrl = mdImgMatch[1].trim();
    else if (rawImgMatch && rawImgMatch[1]) imageUrl = rawImgMatch[1].trim();
  }

  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http') && (userAskedPhoto || fotoTagMatch));

  // 3. Extração da Fala de Áudio [FALA: ...]
  let speechText = '';
  let textBody = rawText;

  const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
  if (falaMatch && falaMatch[1]) {
    const rawFala = falaMatch[1].trim();
    if (rawFala.length > 280) {
      speechText = 'Oi ' + customerName + '! Já levantei todos os detalhes e deixei por escrito aqui para você conferir!';
    } else {
      speechText = rawFala;
    }
  } else {
    const firstSentence = rawText.split('\\n')[0].replace(/[*_~#\\x60\\[\\]!]/g, '').trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 160) {
      speechText = firstSentence;
    } else {
      speechText = 'Oi ' + customerName + '! Já separei todas as informações da Hub, Obra para você!';
    }
  }

  // 4. Limpeza do Texto Escrito
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/\\[GERAR_PDF\\]/gi, '')
    .replace(/!\\[.*?\\]\\((https?:\\/\\/[^\\)]+)\\)/gi, '')
    .replace(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<UPDATE_PRICE:[\\s\\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 5) {
    respostaFormatada = rawText
      .replace(/\\[FALA:\\s*/gi, '')
      .replace(/\\]/gi, '')
      .replace(/<<<UPDATE_PRICE:[\\s\\S]*?>>>/gi, '')
      .trim();
  }

  // 5. Normalização Fonética da Fala de Áudio
  speechText = speechText
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<UPDATE_PRICE:[\\s\\S]*?>>>/gi, '')
    .replace(/https?:\\/\\/\\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\\s*Obra/gi, 'Hub, Obra')
    .replace(/\\bPIX\\b/g, 'Pícs')
    .replace(/\\bPix\\b/g, 'Pícs')
    .replace(/\\bWhatsApp\\b/gi, 'Uatizap')
    .replace(/[*_~#\\x60\\[\\]!]/g, '')
    .replace(/R\\$\\s*([0-9]+)[,\\.]00\\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/R\\$\\s*([0-9]+)[,\\.]([0-9]{1,2})\\b/gi, (m, reais, cents) => {
      const c = parseInt(cents, 10);
      if (c === 0) return reais === '1' ? '1 real' : reais + ' reais';
      if (reais === '0') return c + ' centavos';
      const unit = reais === '1' ? 'real' : 'reais';
      return reais + ' ' + unit + ' e ' + cents + ' centavos';
    })
    .replace(/R\\$\\s*([0-9]+)/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/\\b([0-9]+)[,\\.]00\\s*reais\\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/\\b([0-9]+)[,\\.]00\\b/g, '$1')
    .replace(/\\s+e\\s+(?:00|zero|0)\\s+centavos\\b/gi, '')
    .replace(/\\s+(?:00|zero|0)\\s+centavos\\b/gi, '')
    .replace(/\\s+vírgula\\s+zero\\s+zero\\b/gi, '')
    .replace(/\\s+virgula\\s+zero\\s+zero\\b/gi, '')
    .replace(/m²/g, 'metros quadrados')
    .replace(/m³/g, 'metros cúbicos')
    .replace(/kg/g, 'quilos')
    .replace(/\\s+/g, ' ')
    .trim();

  const isZe = rawText.includes('Zé da Obra') || rawText.includes('👷‍♂️');

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
      hasPdf: false,
      hasMedia: hasImage,
      mediaUrl: imageUrl,
      mediaType: hasImage ? 'image' : null,
      docName: null,
      isAudioInput: Boolean(initialData.isAudio),
      hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
    }
  }];
})();
`;

async function deploy() {
  console.log('🔄 Obtendo workflow atual do n8n...');
  const currentWfRes = await requestN8N('/workflows/' + WORKFLOW_ID);
  if (!currentWfRes.data || !currentWfRes.data.nodes) {
    console.error('❌ Falha ao obter workflow:', currentWfRes);
    return;
  }

  const wf = currentWfRes.data;

  // 1. Atualizar nó "🔄 Montar Catálogo Dinâmico & Memória"
  const catalogNode = wf.nodes.find(n => n.name === '🔄 Montar Catálogo Dinâmico & Memória');
  if (catalogNode) {
    catalogNode.parameters.jsCode = newCatalogJsCode;
    console.log('✅ Nó "🔄 Montar Catálogo Dinâmico & Memória" atualizado com verificação de Treinador!');
  }

  // 2. Atualizar nó "🤖 Agente IA (Lia + Zé da Obra)"
  const agentNode = wf.nodes.find(n => n.name === '🤖 Agente IA (Lia + Zé da Obra)');
  if (agentNode) {
    if (!agentNode.parameters.options) agentNode.parameters.options = {};
    agentNode.parameters.options.systemMessage = newAgentSystemPrompt;
    console.log('✅ Nó "🤖 Agente IA (Lia + Zé da Obra)" atualizado com instrução de alteração de preço!');
  }

  // 3. Atualizar nó "📝 Formatar Resposta WhatsApp"
  const formatNode = wf.nodes.find(n => n.name === '📝 Formatar Resposta WhatsApp');
  if (formatNode) {
    formatNode.parameters.jsCode = newFormatJsCode;
    console.log('✅ Nó "📝 Formatar Resposta WhatsApp" atualizado com processador UPDATE_PRICE!');
  }

  console.log('\n🚀 Salvando workflow no n8n...');
  const updateRes = await requestN8N('/workflows/' + WORKFLOW_ID, 'PUT', {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings
  });

  if (updateRes.status === 200) {
    console.log('🎉 WORKFLOW DO N8N ATUALIZADO E PUBLICADO COM SUCESSO!');
  } else {
    console.error('❌ Falha ao salvar no n8n:', updateRes);
  }
}

deploy().catch(console.error);
