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

// FORMATADOR MULTIMODAL COM PERSISTÊNCIA DE GÍRIAS, REGRAS E AUTORIZAÇÃO DE TREINADORES
const JS_CODE_FORMAT_RESPONSE_COMPLETE = `// 📝 FORMATADOR MULTIMODAL COM PERSISTÊNCIA DE GÍRIAS, REGRAS E AUTORIZAÇÃO DE TREINADORES
return await (async () => {
  const item = $input.first().json;
  const initialData = $('⚙️ Normalizar Mensagem').first().json;
  const contextData = $('🔄 Montar Catálogo Dinâmico & Memória').first().json;
  const customerName = initialData.name || 'amigo';
  const isTrainer = Boolean(contextData.isTrainer);
  const isTeachingIntent = Boolean(contextData.isTeachingIntent);
  const userMessage = initialData.messageText || '';

  let rawText = '';
  if (item.output) {
    rawText = item.output;
  } else if (item.text) {
    rawText = item.text;
  } else if (typeof item === 'string') {
    rawText = item;
  }

  // 1. Persistência Automática de Aprendizado (Exclusivo para Treinador Master)
  const SUPABASE_URL = '${SUPABASE_URL}';
  const SUPABASE_KEY = '${SUPABASE_KEY}';
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  if (isTrainer) {
    // 1.1. Autorização de Novo Treinador via WhatsApp pelo Master
    if (/(autoriza|cadastra|novo treinador|autorizar)/i.test(userMessage)) {
      const phoneMatch = userMessage.match(/(?:(?:55)?\\s*\\(?\\d{2}\\)?\\s*9?\\d{4}[-\\s]?\\d{4}|\\d{10,13})/);
      if (phoneMatch) {
        let cleanNewPhone = phoneMatch[0].replace(/[^0-9]/g, '');
        if (!cleanNewPhone.startsWith('55')) cleanNewPhone = '55' + cleanNewPhone;
        
        let trainerName = 'Treinador Autorizado';
        const nameMatch = userMessage.match(/(?:do|da|de|nome:?)\\s+([A-Za-zÀ-ÖØ-öø-ÿ\\s]+?)(?:como|\\.|\\,|$)/i);
        if (nameMatch && nameMatch[1]) trainerName = nameMatch[1].trim();

        try {
          await this.helpers.httpRequest({
            url: SUPABASE_URL + '/rest/v1/ai_trainers?on_conflict=phone',
            method: 'POST',
            headers: supaHeaders,
            body: {
              phone: cleanNewPhone,
              name: trainerName,
              role: 'trainer',
              is_active: true,
              notes: 'Autorizado via WhatsApp pelo Master Trainer',
              updated_at: new Date().toISOString()
            }
          });
          console.log('🎉 Novo treinador autorizado no Supabase:', cleanNewPhone, trainerName);
        } catch(err) {
          console.error('Erro ao autorizar treinador:', err.message);
        }
      }
    }

    // 1.2. Gravação de Novo Termo / Gíria
    if (isTeachingIntent) {
      let savedTerm = false;

      // Método A: Tag da IA
      const learnTermMatch = rawText.match(/<<<LEARN_TERM:\\s*([\\s\\S]+?)\\s*>>>/i);
      if (learnTermMatch && learnTermMatch[1]) {
        try {
          const termData = JSON.parse(learnTermMatch[1].trim());
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
            savedTerm = true;
            console.log('🎉 [Método A] Novo termo gravado:', termData.slang_term);
          }
        } catch(_) {}
      }

      // Método B: Extrator semântico
      if (!savedTerm) {
        const quoteMatches = userMessage.match(/['"“]([^'"“”]+)['"”]/g);
        if (quoteMatches && quoteMatches.length >= 2) {
          const slang = quoteMatches[0].replace(/['"“”]/g, '').toLowerCase().trim();
          const official = quoteMatches[1].replace(/['"“”]/g, '').trim();

          let category = 'Geral';
          const catMatch = userMessage.match(/categoria\\s+([a-zA-Záàâãéèêíïóôõöúçñ\\s]+?)(?:,|\\.|$)/i);
          if (catMatch && catMatch[1]) category = catMatch[1].trim();

          try {
            await this.helpers.httpRequest({
              url: SUPABASE_URL + '/rest/v1/ai_construction_terms?on_conflict=slang_term',
              method: 'POST',
              headers: supaHeaders,
              body: {
                slang_term: slang,
                official_term: official,
                category: category,
                explanation: 'Ensinado via WhatsApp pelo Treinador Master',
                updated_at: new Date().toISOString()
              }
            });
            savedTerm = true;
            console.log('🎉 [Método B] Novo termo gravado:', slang, '➔', official);
          } catch(err) {
            console.error('Erro ao salvar termo pelo Método B:', err.message);
          }
        } else if (userMessage.toLowerCase().includes('regra')) {
          const cleanRule = userMessage.replace(/^(lia,?\\s*)?(anota\\s*(aí|essa)?|grava\\s*(aí|essa)?|aprende\\s*(aí)?):?\\s*(regra:?)?\\s*/i, '').trim();
          try {
            await this.helpers.httpRequest({
              url: SUPABASE_URL + '/rest/v1/ai_sales_learnings',
              method: 'POST',
              headers: supaHeaders,
              body: {
                topic: 'Regra Ensinada pelo Master',
                rule_content: cleanRule,
                source: 'whatsapp_master_trainer',
                is_active: true,
                updated_at: new Date().toISOString()
              }
            });
            console.log('🎉 [Método B] Nova regra gravada:', cleanRule);
          } catch(err) {
            console.error('Erro ao salvar regra:', err.message);
          }
        }
      }
    }
  }

  // 2. Extração de Imagens
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  if (fotoTagMatch && fotoTagMatch[1]) imageUrl = fotoTagMatch[1].trim();

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

  // 5. Limpeza do Texto Escrito (remove tags de controle)
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
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

  // 6. Normalização Fonética da Fala
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
    if (node.id === 'code-format-response' || node.name.includes('Formatar Resposta')) {
      node.parameters = {
        jsCode: JS_CODE_FORMAT_RESPONSE_COMPLETE
      };
    }
    return node;
  });

  console.log('📦 Enviando atualização com suporte a cadastro via WhatsApp para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! N8N COM SUPORTE TOTAL A AUTORIZAÇÃO DE TREINADORES!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploy().catch(console.error);
