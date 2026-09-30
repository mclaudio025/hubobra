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

// 1. SYSTEM PROMPT HUMANIZADO COM GESTÃO COMPLETA DE ORÇAMENTOS, PDF E CONVERSÃO
const SYSTEM_PROMPT_LIA_QUOTES = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o marketplace de materiais de construção de Fortaleza e Ceará.

Você atua com duas personalidades altamente profissionais e humanizadas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e conhecedora profunda do catálogo e dos termos práticos de materiais de construção. Fala de preços de forma direta, clara e prestativa, com o ritmo acolhedor e simpático do comércio de Fortaleza.
👷‍♂️ ZÉ DA OBRA: Mestre de obras veterano. Entra na conversa apenas para tirar dúvidas técnicas, cálculos de quantitativos (cimento por milheiro de tijolo, rendimento de telha, dimensionamento de fiação e encanamento) e dicas práticas de canteiro de obras.

══════════════════════════════════════════════════════════════
⭐ REGRA DE DOSAGEM NATURAL DO SOTAQUE CEARENSE (JEITO LIA):
══════════════════════════════════════════════════════════════
1. 🌵 REALISMO & ZERO EXAGERO (NÃO SEJA UMA CARICATURA):
   - O atendente cearense da vida real fala português correto, educado, ágil e acolhedor.
   - 🚫 PROIBIDO EMPILHAR GÍRIAS: NUNCA use mais de 1 expressão ou gíria por mensagem. Na dúvida, use nenhuma!
   - 🚫 NUNCA coloque 2 ou 3 expressões juntas na mesma frase (ex: NUNCA diga "Oxi macho cuida tá na mão só o filé").
   - 💡 O sotaque e o jeito cearense devem ser SUTIS e ESPORÁDICOS:
     * Um cumprimento simples e caloroso: "Opa, tudo bem? Tem sim!" ou "Boa tarde! Temos sim, qual tamanho você prefere?"
     * Uma expressão de fechamento leve e ocasional: "Cuida que já separo pra você." ou "Tá na mão o orçamento."
     * Seja direta, prestativa e objetiva com preços e prazos.

2. 🏗️ COMPREENSÃO PERFEITA DO DICIONÁRIO DE OBRA:
   - O dicionário de termos de obra serve para você ENTENDER o que o cliente quer quando ele usar apelidos regionais (como "rabicho", "fita de isolar", "boca de lobo", "pescoço de ganso", "esquadro", "quarentena").
   - Ao responder, confirme com o nome comercial claro e passe o valor exato, sem precisar forçar gírias na resposta.

3. 📸 REGRA RIGOROSA DE FOTOS NO WHATSAPP:
   - ⚠️ SÓ ENVIE FOTO SE O CLIENTE PEDIR EXPLICITAMENTE ("tem foto?", "manda a foto", "como ele é?").
   - 🚫 NUNCA envie foto se o cliente apenas perguntou o preço, pediu orçamento ou perguntou se tem em estoque.
   - Quando pedirem foto, inclua a tag [FOTO: url_da_imagem].

4. 🎯 PREÇO DIRETO & ZERO SPAM DE PIX:
   - Fale o preço unitário direto. Guarde condições de pagamento para o fechamento ou quando o cliente perguntar.

5. 🎙️ REGRA DE ÁUDIO (Tag [FALA: ...]):
   - Áudio curto (5-8s) para respostas simples ou saudações.
   - O texto do áudio deve ser limpo, natural e sem gírias empilhadas.
   - 💰 PREÇOS NO ÁUDIO: Fale valores de forma humana e direta (ex: "está 379 reais" ou "sai por 32 reais e 90 centavos"). NUNCA diga "zero centavos" ou "vírgula zero zero"!
   - Listas e orçamentos múltiplos SEMPRE por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
📋 GESTÃO DE ORÇAMENTOS & PDF (SOB DEMANDA):
══════════════════════════════════════════════════════════════
1. 📝 EMISSÃO DE ORÇAMENTO (PADRÃO: TEXTO NO WHATSAPP):
   - Quando o cliente pedir preço de vários itens ou um orçamento completo da obra, calcule e liste todos os itens com valores unitários e total por escrito na mensagem.
   - Emita no final a tag de registro no sistema:
   <<<ORCAMENTO: {"customerName":"Nome","items":[{"name":"Cimento Poty 50kg","brand":"Votoran","unit":"SC","quantity":10,"unitPrice":32.90},{"name":"Caixa d'Água 500L","brand":"Fortlev","unit":"UN","quantity":2,"unitPrice":379.00}],"discount":0,"shipping":0,"notes":"Orçamento para obra"} >>>

2. 📄 ENVIO DE PDF (SOMENTE QUANDO O CLIENTE SOLICITAR):
   - Se o cliente pedir em PDF ("tem como mandar em PDF?", "manda o arquivo", "gera o PDF desse orçamento"):
     * Avise com simpatia que está emitindo o documento oficial com validade de 7 dias.
     * Inclua a tag [GERAR_PDF] no texto. O sistema disparará o PDF anexado automaticamente.

3. 🔄 CONVERSÃO DE ORÇAMENTO EM PEDIDO:
   - Se o cliente disser "Lia, fecha aquele orçamento da semana passada", "quero comprar o orçamento que você me passou", ou citar o número do orçamento:
     * Olhe a seção "ORÇAMENTOS EM ABERTO DESTE CLIENTE" abaixo.
     * Confirme os itens e o total com o cliente e peça o endereço de entrega e forma de pagamento.
     * Quando ele confirmar, emita a tag de fechamento de pedido:
     <<<PEDIDO: {"customerName":"Nome","items":[{"name":"Cimento Poty 50kg","quantity":10,"price":32.90}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

// 2. INPUT PROMPT COM INJEÇÃO DE ORÇAMENTOS EM ABERTO
const AGENT_INPUT_PROMPT = `=Cliente: {{ $json.name }} (Telefone: {{ $json.phone }})

Mensagem / Pedido do Cliente:
"{{ $json.messageText }}"

══════════════════════════════════════════════════════════════
🎙️ REGRA DA TAG DE ÁUDIO:
- Use EXATAMENTE a tag: [FALA: texto_aqui] no início da mensagem.
- NUNCA use [FAÇA:], [ÁUDIO:] ou qualquer outra palavra!
══════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════
📋 ORÇAMENTOS RECENTES EM ABERTO DESTE CLIENTE (VALIDADE 7 DIAS):
══════════════════════════════════════════════════════════════
{{ $json.openQuotesText }}

══════════════════════════════════════════════════════════════
💬 DIÁLOGOS MODELO & EXEMPLOS DE ATENDIMENTO HUBOBRA:
══════════════════════════════════════════════════════════════
{{ $json.regionalCearesText }}

══════════════════════════════════════════════════════════════
🌵 DICIONÁRIO DE GÍRIAS & APELIDOS DE OBRA:
══════════════════════════════════════════════════════════════
{{ $json.slangDictionaryText }}

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

Responda ao cliente de forma natural, profissional e acolhedora, com dosagem leve e equilibrada de expressões (no máximo 1 expressão esporádica por mensagem), priorizando a clareza e o catálogo acima:`;

// 3. CODE FORMAT CATALOG & MEMORY (ADICIONANDO BUSCA DE ORÇAMENTOS ABERTOS)
const FORMAT_CATALOG_CODE = `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + DICIONÁRIO CEARÊS + DIÁLOGOS + MEMÓRIA + ORÇAMENTOS EM ABERTO
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
  catalogLines.push('- Fita Isolante Imperial 5m (3M): R$ 5,50');
  catalogLines.push('- Fita Isolante Imperial 10m (3M): R$ 8,00');
}

const liveCatalog = catalogLines.join('\\n');

// 2. Buscar Dicionário de Gírias, Diálogos Modelo Cearenses e Sabedoria do Supabase
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

try {
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

  // 2.2. Expressões Regionais & Diálogos Modelo Cearenses
  const exprRes = await this.helpers.httpRequest({
    url: SUPABASE_URL + '/rest/v1/ai_regional_expressions?select=expression,usage_context,tone_impact,example_phrase&is_active=eq.true&order=created_at.desc&limit=30',
    method: 'GET',
    headers: supaHeaders,
    timeout: 3000
  });

  if (Array.isArray(exprRes) && exprRes.length > 0) {
    regionalCearesText = exprRes.map((e, idx) => {
      let block = '【EXEMPLO ' + (idx + 1) + ' - ' + e.expression + ' (' + e.usage_context + ')】\\n';
      if (e.example_phrase) {
        block += e.example_phrase + '\\n';
      }
      if (e.tone_impact) {
        block += '➔ Dica de Atendimento: ' + e.tone_impact;
      }
      return block;
    }).join('\\n\\n');
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

  // 2.4. Buscar Orçamentos em Aberto deste cliente
  const rawPhone = (initialData.phone || initialData.from || '').replace(/\\D/g, '');
  const last8 = rawPhone.slice(-8);
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
    openQuotesText: openQuotesText,
    customerMemoryText: customerMemoryText,
    hasProfile: Boolean(customerProfile)
  }
}];`;

// 4. CODE FORMAT AI RESPONSE (COM SUPORTE A ORÇAMENTOS, PDF E PEDIDOS)
const FORMAT_AI_RESPONSE_CODE = `// 🎯 PROCESSAR RESPOSTA DA IA (EXTRATOR MULTIMODAL + ORÇAMENTOS + PDF + PEDIDOS)
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const aiResult = $input.first().json;

const rawText = aiResult.output || aiResult.text || '';
const customerName = initialData.name || 'Cliente';
const userMessage = initialData.messageText || '';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

return (async () => {
  const senderPhone = (initialData.phone || initialData.from || '').replace(/\\D/g, '');
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  // 1. Processar Tag de Orçamento <<<ORCAMENTO: ... >>>
  let createdQuote = null;
  const quoteTagMatch = rawText.match(/<<<ORCAMENTO:\\s*([\\s\\S]*?)>>>/i);
  if (quoteTagMatch && quoteTagMatch[1]) {
    try {
      const quoteData = JSON.parse(quoteTagMatch[1].trim());
      const quoteNumber = 'ORC-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-4);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      let subtotal = 0;
      const itemsFormatted = (quoteData.items || []).map(i => {
        const qty = Number(i.quantity) || 1;
        const price = Number(i.unitPrice || i.price) || 0;
        const total = qty * price;
        subtotal += total;
        return {
          name: i.name,
          brand: i.brand || null,
          unit: i.unit || 'UN',
          quantity: qty,
          unitPrice: price,
          total: total
        };
      });

      const total = Math.max(0, subtotal - (Number(quoteData.discount) || 0) + (Number(quoteData.shipping) || 0));

      const quoteInsert = await this.helpers.httpRequest({
        url: SUPABASE_URL + '/rest/v1/quotes',
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'return=representation' },
        body: {
          quoteNumber: quoteNumber,
          status: 'OPEN',
          customerName: quoteData.customerName || customerName,
          customerPhone: senderPhone,
          customerEmail: quoteData.customerEmail || null,
          subtotal: subtotal,
          discount: Number(quoteData.discount) || 0,
          shipping: Number(quoteData.shipping) || 0,
          total: total,
          validUntil: validUntil.toISOString(),
          notes: quoteData.notes || 'Orçamento gerado via WhatsApp pela Lia'
        },
        json: true
      });

      if (Array.isArray(quoteInsert) && quoteInsert[0]) {
        createdQuote = quoteInsert[0];
        // Inserir itens
        if (itemsFormatted.length > 0) {
          const itemsPayload = itemsFormatted.map(item => ({
            quoteId: createdQuote.id,
            name: item.name,
            brand: item.brand,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }));

          await this.helpers.httpRequest({
            url: SUPABASE_URL + '/rest/v1/quote_items',
            method: 'POST',
            headers: supaHeaders,
            body: itemsPayload,
            json: true
          });
        }
        console.log('🎉 Orçamento registrado com sucesso:', createdQuote.quoteNumber, 'Total:', total);
      }
    } catch(err) {
      console.warn('Erro ao registrar orçamento:', err.message);
    }
  }

  // 2. Extração e Validação de Imagem
  const userAskedPhoto = /(?:foto|fotos|imagem|imagens|como\\s+ele\\s+(é|parece)|como\\s+ela\\s+(é|parece)|quero\\s+ver|manda\\s+ver)/i.test(userMessage);

  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  const mdImgMatch = rawText.match(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/i);
  const rawImgMatch = rawText.match(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/i);

  if (userAskedPhoto || fotoTagMatch) {
    if (fotoTagMatch && fotoTagMatch[1]) {
      imageUrl = fotoTagMatch[1].trim();
    } else if (mdImgMatch && mdImgMatch[1]) {
      imageUrl = mdImgMatch[1].trim();
    } else if (rawImgMatch && rawImgMatch[1]) {
      imageUrl = rawImgMatch[1].trim();
    }
  }

  // 3. Detectar se é Orçamento / Relatório
  const hasMultipleBullets = (rawText.match(/[•\\-\\+]\\s+/g) || []).length >= 2;
  const hasBudgetKeywords = rawText.includes('Orçamento') || rawText.includes('Total:') || rawText.includes('subtotal') || rawText.includes('<<<PEDIDO:') || rawText.includes('<<<ORCAMENTO:');
  const isBudgetOrList = hasMultipleBullets || hasBudgetKeywords;

  // 4. Extração da Fala de Áudio [FALA: ...]
  let speechText = '';
  let textBody = rawText;

  const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
  if (falaMatch && falaMatch[1]) {
    const rawFala = falaMatch[1].trim();
    if (rawFala.length > 280 || (isBudgetOrList && rawFala.length > 160)) {
      speechText = 'Oi ' + customerName + '! Já levantei todos os itens do seu orçamento. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!';
      const outsideText = rawText.replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '').trim();
      if (!outsideText || outsideText.length < 20) {
        textBody = rawFala;
      }
    } else {
      speechText = rawFala;
    }
  } else {
    const firstSentence = rawText.split('\\n')[0].replace(/[*_~#\`\\[\\]!]/g, '').trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 160) {
      speechText = firstSentence;
    } else {
      speechText = 'Oi ' + customerName + '! Já separei as informações dos materiais da Hub, Obra para você!';
    }
  }

  // 5. Limpeza do Texto Escrito
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/\\[GERAR_PDF\\]/gi, '')
    .replace(/!\[.*?\]\((https?:\\/\\/[^\\s\\)]+)\)/gi, '')
    .replace(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 5) {
    respostaFormatada = rawText
      .replace(/\\[FALA:\\s*/gi, '')
      .replace(/\\]/gi, '')
      .replace(/\\[GERAR_PDF\\]/gi, '')
      .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
      .replace(/<<<ORCAMENTO:[\\s\\S]*?>>>/gi, '')
      .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
      .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
      .trim();
  }

  // 6. Normalização Fonética da Fala de Áudio
  speechText = speechText
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/https?:\\/\\/\\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\\s*Obra/gi, 'Hub, Obra')
    .replace(/\\bPIX\\b/g, 'Pícs')
    .replace(/\\bPix\\b/g, 'Pícs')
    .replace(/\\bWhatsApp\\b/gi, 'Uatizap')
    .replace(/[*_~#\`\\[\\]!]/g, '')
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
  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http') && (userAskedPhoto || fotoTagMatch));

  return [{
    json: {
      ...initialData,
      rawAiOutput: rawText,
      respostaFormatada: respostaFormatada,
      speechText: speechText,
      voiceId: isZe ? 'Charon' : 'Aoede',
      isZePersona: isZe,
      imageUrl: hasImage ? imageUrl : null,
      hasImage: hasImage,
      isBudgetOrList: isBudgetOrList,
      isAudioInput: Boolean(initialData.isAudio),
      hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
    }
  }];
})();`;

async function deployLiaQuotesPdf() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];

  let updatedAgent = false;
  let updatedCatalog = false;
  let updatedFormatter = false;

  nodes = nodes.map(node => {
    // 1. Atualizar Prompt do AI Agent
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_LIA_QUOTES;
      node.parameters.text = AGENT_INPUT_PROMPT;
      updatedAgent = true;
    }
    // 2. Atualizar Nó de Catálogo e Memória
    if (node.id === 'code-format-realtime-catalog' || node.name.includes('Montar Catálogo')) {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = FORMAT_CATALOG_CODE;
      updatedCatalog = true;
    }
    // 3. Atualizar Nó de Formatação da Resposta
    if (node.id === 'code-format-ai-response' || node.name.includes('Formatar Resposta') || node.name.includes('Extrair Tags')) {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = FORMAT_AI_RESPONSE_CODE;
      updatedFormatter = true;
    }
    return node;
  });

  console.log(`Status de Atualização: Agent=${updatedAgent}, Catalog=${updatedCatalog}, Formatter=${updatedFormatter}`);

  console.log('📦 Enviando atualização para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: existingWf.connections,
    settings: existingWf.settings
  });

  if (updateRes.status === 200) {
    console.log('✅ Workflow atualizado com sucesso!');
    console.log('🔄 Reativando workflow...');
    await requestN8N(`/workflows/${WORKFLOW_ID}/deactivate`, 'POST');
    const actRes = await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🚀 Ativação:', actRes.status === 200 ? 'ONLINE 🟢' : 'Falha na ativação 🔴');
  } else {
    console.error('❌ Erro no deploy:', updateRes);
  }
}

deployLiaQuotesPdf();
