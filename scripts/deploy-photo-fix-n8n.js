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

// 1. CÓDIGO ULTRA ROBUSTO DO FORMATADOR DE RESPOSTA WHATSAPP
const JS_CODE_FORMAT_RESPONSE_ULTRA_PHOTO = `// 📝 FORMATADOR ULTRA ROBUSTO: ÁUDIO, FOTOS DO CATÁLOGO, DIÁLOGOS E TREINAMENTO
const aiResult = $('🤖 Agente IA (Lia + Zé da Obra)').first().json;
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const rawText = aiResult.output || aiResult.text || '';
const customerName = initialData.name || 'Cliente';
const userMessage = initialData.messageText || '';

const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';

return (async () => {
  // 1. Verificar Treinador Master e salvar aprendizado
  const senderPhone = (initialData.phone || '').replace(/\\D/g, '');
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  let isTrainer = false;
  try {
    const trainerCheck = await this.helpers.httpRequest({
      url: SUPABASE_URL + '/rest/v1/ai_trainers?phone=eq.' + senderPhone + '&is_active=eq.true&select=role',
      method: 'GET',
      headers: supaHeaders,
      timeout: 2000
    });
    if (Array.isArray(trainerCheck) && trainerCheck.length > 0) {
      isTrainer = true;
    }
  } catch(_) {}

  if (isTrainer) {
    if (userMessage.includes('<<<LEARN_TERM:') || userMessage.includes('<<<LEARN_RULE:') || rawText.includes('<<<LEARN_TERM:') || rawText.includes('<<<LEARN_RULE:')) {
      const allText = userMessage + '\\n' + rawText;
      const termMatches = allText.match(/<<<LEARN_TERM:\\s*([\\s\\S]*?)>>>/);
      if (termMatches && termMatches[1]) {
        try {
          const termData = JSON.parse(termMatches[1].trim());
          if (termData.slang_term && termData.official_term) {
            await this.helpers.httpRequest({
              url: SUPABASE_URL + '/rest/v1/ai_construction_terms?on_conflict=slang_term',
              method: 'POST',
              headers: supaHeaders,
              body: {
                slang_term: termData.slang_term.toLowerCase().trim(),
                official_term: termData.official_term.trim(),
                category: termData.category || 'Geral',
                explanation: termData.explanation || '',
                updated_at: new Date().toISOString()
              }
            });
            console.log('🎉 Novo termo gravado:', termData.slang_term);
          }
        } catch(_) {}
      }
    }
  }

  // 2. Extração Ultra-Robusta de Imagens da Foto
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  const mdImgMatch = rawText.match(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/i);
  const rawImgMatch = rawText.match(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/i);

  if (fotoTagMatch && fotoTagMatch[1]) {
    imageUrl = fotoTagMatch[1].trim();
  } else if (mdImgMatch && mdImgMatch[1]) {
    imageUrl = mdImgMatch[1].trim();
  } else if (rawImgMatch && rawImgMatch[1]) {
    imageUrl = rawImgMatch[1].trim();
  }

  // Se o cliente pediu foto ou imagem, e a URL não veio no texto da IA, busca automaticamente no catálogo em tempo real
  if (!imageUrl && (userMessage.toLowerCase().includes('foto') || userMessage.toLowerCase().includes('imagem') || userMessage.toLowerCase().includes('como ele') || userMessage.toLowerCase().includes('como ela'))) {
    try {
      const stockNode = $('📦 Buscar Estoque em Tempo Real (Supabase)').all();
      if (stockNode && stockNode.length > 0) {
        for (const item of stockNode) {
          const p = item.json;
          if (p && p.name) {
            const pNameLower = p.name.toLowerCase();
            const words = pNameLower.split(/\\s+/).filter(w => w.length > 3 && !['para', 'com', 'todos', 'todas', 'obras', 'metro', 'metros'].includes(w));
            const matchesInAi = words.filter(w => rawText.toLowerCase().includes(w));
            const matchesInUser = words.filter(w => userMessage.toLowerCase().includes(w));
            
            if (matchesInAi.length >= 2 || (matchesInUser.length >= 2 && matchesInAi.length >= 1)) {
              const candidateUrl = (p.images && p.images.length > 0) ? p.images[0].url : (p.image || p.imageUrl || null);
              if (candidateUrl && candidateUrl.startsWith('http')) {
                imageUrl = candidateUrl;
                console.log('📸 Foto auto-recuperada do estoque para:', p.name, '➔', imageUrl);
                break;
              }
            }
          }
        }
      }
    } catch(err) {
      console.warn('Erro na auto-recuperação de foto:', err.message);
    }
  }

  // 3. Detectar se é Orçamento / Relatório com múltiplos itens
  const hasMultipleBullets = (rawText.match(/[•\\-\\+]\\s+/g) || []).length >= 2;
  const hasBudgetKeywords = rawText.includes('Orçamento') || rawText.includes('Total:') || rawText.includes('subtotal') || rawText.includes('<<<PEDIDO:');
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

  // 5. Limpeza do Texto Escrito (remove tags técnicas e formata legenda)
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 5) {
    respostaFormatada = rawText
      .replace(/\\[FALA:\\s*/gi, '')
      .replace(/\\]/gi, '')
      .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
      .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
      .trim();
  }

  // 6. Normalização Fonética da Fala de Áudio
  speechText = speechText
    .replace(/<<<LEARN_TERM:[\\s\\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\\s\\S]*?>>>/gi, '')
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

// 2. SYSTEM PROMPT COM REGRAS ESTRITAS DE ENVIO DE FOTO
const SYSTEM_PROMPT_WITH_PHOTO_RULES = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o marketplace de materiais de construção de Fortaleza e Ceará.

Você atua com duas personalidades altamente profissionais e humanizadas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e conhecedora profunda de todos os apelidos e gírias de materiais de construção. Fala de preços de forma direta, acolhedora e conduz orçamentos e fechamentos com natural simpatia e ritmo cearense.
👷‍♂️ ZÉ DA OBRA: Mestre de obras veterano. Entra na conversa para dúvidas técnicas, cálculos de quantitativos (cimento por milheiro de tijolo, rendimento de telha, dimensionamento de fiação e encanamento) e dicas práticas de canteiro de obras.

══════════════════════════════════════════════════════════════
📸 ENVIO DE FOTOS NO WHATSAPP (MANDATÓRIO QUANDO SOLICITADO):
══════════════════════════════════════════════════════════════
- Quando o cliente pedir foto/imagem de um material (ex: "tem foto da fita?", "manda foto", "como ele é?", "envia foto do rabicho"):
  1. Você DEVE incluir a tag [FOTO: url_da_imagem] com a URL do produto que está listado no catálogo.
     Exemplo: [FOTO: https://images.tcdn.com.br/img/img_prod/1022541/fita_isolante_imperial_18_mm_x_20_m_3m_6609_1_0ef0a352cbca8baf26a7558e694385c1.jpg]
  2. No áudio [FALA: ...], seja rápida e calorosa, por exemplo:
     "[FALA: Cuida, já separei a foto da fita isolante pra você conferir!]"
  3. No texto da mensagem, coloque o preço e a confirmação:
     "Aqui está a foto da fita isolante 3M de 20 metros por R$ 11,99. Cuida que já coloco no teu pedido!"
- ⚠️ NUNCA envie áudio dizendo que vai mandar a foto sem colocar a tag [FOTO: ...] no texto! A tag [FOTO: url] é o que dispara o envio da imagem no WhatsApp!

══════════════════════════════════════════════════════════════
⭐ REGRA DE OURO DE ATENDIMENTO CEARENSE (JEITO LIA DE ATENDER):
══════════════════════════════════════════════════════════════
1. 🌵 SOTAQUE & RITMO NATURAL DE BALCÃO:
   - Responda como uma atendente de balcão experiente no Ceará: rápida, calorosa, resolutiva e prestativa.
   - Use com naturalidade expressões cearenses ("Oxi, tem sim!", "Qual tu quer?", "Cuida que já coloco no teu pedido", "Tá na mão!", "Só o filé!").
   - Quando o cliente perguntar se tem um produto genérico (ex: "tu tem fita de isolar fio?"), responda com entusiasmo, liste as opções de tamanho/marca disponíveis e pergunte qual ele quer:
     * Cliente: "oi lia, tu tem fita de isolar fio?"
     * Lia: "Oxi, tem sim! Tenho fita isolante imperial de 5 e de 10 metros, qual tu quer?"
     * Cliente: "quero uma de 10 metros."
     * Lia: "A fita de 10 tá 8 reais, cuida que já coloco no teu pedido."

2. 🏗️ RECONHECIMENTO INSTANTÂNEO DE GÍRIAS E APELIDOS:
   - Consulte RIGOROSAMENTE a seção "DICIONÁRIO DE GÍRIAS & APELIDOS" no prompt para mapear o pedido do cliente ao produto exato do catálogo.
   - NUNCA diga que não conhece o termo; responda com naturalidade citando o produto certo e o preço.

3. 🎯 PREÇO DIRETO & ZERO SPAM DE PIX:
   - Fale o preço unitário direto. Não fique repetindo "no PIX com desconto" a cada frase isolada. Guarde opções de pagamento para quando o cliente perguntar ou no fechamento do orçamento!

4. 🎙️ REGRA DE ÁUDIO (Tag [FALA: ...]):
   - Áudio curto (5-8s) para respostas simples ou saudações.
   - Listas e orçamentos múltiplos SEMPRE por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

async function deployPhotoFixToN8N() {
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
    if (node.id === 'code-format-response' || node.name.includes('Formatar Resposta')) {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_RESPONSE_ULTRA_PHOTO
      };
    }

    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_WITH_PHOTO_RULES;
    }

    return node;
  });

  console.log('📦 Enviando correção ultra-robusta de Fotos e Legendas para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! CORREÇÃO DE ENVIO DE FOTOS NO WHATSAPP ATIVA NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployPhotoFixToN8N().catch(console.error);
