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

// 1. SYSTEM PROMPT NATURAL CEARENSE COM REGRA EXPLÍCITA DE PREÇOS NO ÁUDIO
const SYSTEM_PROMPT_NATURAL_CEARENSE = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o marketplace de materiais de construção de Fortaleza e Ceará.

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
   - Fale o preço unitário direto. Não fique repetindo "no PIX com desconto" a cada frase. Guarde condições de pagamento para o fechamento ou quando o cliente perguntar.

5. 🎙️ REGRA DE ÁUDIO (Tag [FALA: ...]):
   - Áudio curto (5-8s) para respostas simples ou saudações.
   - O texto do áudio deve ser limpo, natural e sem gírias empilhadas.
   - 💰 PREÇOS NO ÁUDIO: Fale valores de forma humana e direta (ex: "está 379 reais" ou "sai por 32 reais e 90 centavos"). NUNCA diga "zero centavos" ou "vírgula zero zero"! Para números inteiros, fale apenas os reais (ex: "379 reais").
   - Listas e orçamentos múltiplos SEMPRE por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

// 2. CÓDIGO DO NÓ DE FORMATAÇÃO COM HIGIENIZAÇÃO FONÉTICA DE PREÇOS
const FORMAT_AI_RESPONSE_CODE = `// 🎯 PROCESSAR RESPOSTA DA IA (EXTRATOR MULTIMODAL + HIGIENIZADOR FONÉTICO DE ÁUDIO)
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const aiResult = $input.first().json;

const rawText = aiResult.output || aiResult.text || '';
const customerName = initialData.name || 'Cliente';
const userMessage = initialData.messageText || '';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

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

  // 2. Extração e Validação de Imagem: SÓ ENVIA SE O CLIENTE PEDIU
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

    // Se o cliente pediu foto explicitamente e a URL não veio no texto da IA, busca no estoque
    if (!imageUrl && userAskedPhoto) {
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
    .replace(/(https?:\\/\\/[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]+\\.(?:jpg|jpeg|png|webp)(?:\\?[^\\s\\(\\)\\[\\]\\"\\'\\<\\>]*)?)/gi, '')
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

  // 6. Normalização Fonética da Fala de Áudio (PREÇOS HUMANIZADOS SEM "ZERO CENTAVOS")
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
    // 6.1. R$ com ,00 redondo -> X reais (nunca zero centavos)
    .replace(/R\\$\\s*([0-9]+)[,\\.]00\\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    // 6.2. R$ com centavos -> X reais e Y centavos (se centavos forem 00, só reais)
    .replace(/R\\$\\s*([0-9]+)[,\\.]([0-9]{1,2})\\b/gi, (m, reais, cents) => {
      const c = parseInt(cents, 10);
      if (c === 0) return reais === '1' ? '1 real' : reais + ' reais';
      if (reais === '0') return c + ' centavos';
      const unit = reais === '1' ? 'real' : 'reais';
      return reais + ' ' + unit + ' e ' + cents + ' centavos';
    })
    // 6.3. R$ sem centavos -> X reais
    .replace(/R\\$\\s*([0-9]+)/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    // 6.4. Valores avulsos com ,00 reais
    .replace(/\\b([0-9]+)[,\\.]00\\s*reais\\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/\\b([0-9]+)[,\\.]00\\b/g, '$1')
    // 6.5. Eliminação de resíduos como "e zero centavos", "e 00 centavos", "vírgula zero zero"
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

// 3. CÓDIGO DO NÓ TTS COM DUPLA CHECAGEM DE HIGIENIZAÇÃO
const OPENAI_TTS_CODE = `// 🗣️ GERAR ÁUDIO GEMINI 2.5 PRO TTS VIA KIE.AI (COM FALLBACK RESILIENTE E HIGIENIZAÇÃO DE PREÇOS)
const item = $input.first().json;
let text = item.speechText || '';
const isZe = Boolean(item.isZePersona);
const voiceName = isZe ? 'Charon' : 'Aoede';
const apiKey = 'b30b1489000ba908bd72cc04e0d6cc16';

if (!text || text.trim().length === 0) {
  return [{ json: { ...item, audioGeneratedUrl: null } }];
}

// Sanitização final de segurança contra "zero centavos" e números formatados
text = text
  .replace(/R\\$\\s*([0-9]+)[,\\.]00\\b/gi, '$1 reais')
  .replace(/R\\$\\s*([0-9]+)[,\\.]([0-9]{1,2})\\b/gi, (m, r, c) => parseInt(c, 10) === 0 ? r + ' reais' : r + ' reais e ' + c + ' centavos')
  .replace(/R\\$\\s*([0-9]+)/gi, '$1 reais')
  .replace(/\\b([0-9]+)[,\\.]00\\s*reais\\b/gi, '$1 reais')
  .replace(/\\b([0-9]+)[,\\.]00\\b/g, '$1')
  .replace(/\\s+e\\s+(?:00|zero|0)\\s+centavos\\b/gi, '')
  .replace(/\\s+(?:00|zero|0)\\s+centavos\\b/gi, '')
  .replace(/\\s+vírgula\\s+zero\\s+zero\\b/gi, '')
  .replace(/\\s+virgula\\s+zero\\s+zero\\b/gi, '')
  .trim();

let audioUrl = null;

try {
  // 1. Criar tarefa na Kie
  const createRes = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://api.kie.ai/api/v1/jobs/createTask',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: {
      model: 'google/gemini-2-5-pro-tts',
      input: {
        speakers: [
          {
            speaker_id: 'Speaker 1',
            voice_name: voiceName
          }
        ],
        dialogue_turns: [
          {
            speaker_id: 'Speaker 1',
            text: text
          }
        ]
      }
    },
    json: true,
    timeout: 15000
  });

  const taskId = createRes.data?.taskId || createRes.data?.recordId;
  
  if (taskId) {
    // 2. Polling com até 35 tentativas de 1.2s (42 segundos)
    for (let i = 0; i < 35; i++) {
      await new Promise(r => setTimeout(r, 1200));
      try {
        const pollRes = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
          headers: { 'Authorization': 'Bearer ' + apiKey },
          json: true,
          timeout: 10000
        });
        if (pollRes && pollRes.data?.state === 'success' && pollRes.data?.response?.resultUrls?.[0]) {
          audioUrl = pollRes.data.response.resultUrls[0];
          break;
        }
        if (pollRes && pollRes.data?.state === 'failed') {
          console.error('Falha na Kie:', pollRes.data?.failMsg);
          break;
        }
      } catch(pollErr) {
        console.error('Erro no polling Kie:', pollErr.message);
      }
    }
  }
} catch(err) {
  console.error('Erro na criação de TTS Kie:', err.message);
}

// Retorna sempre com sucesso, garantindo que o fluxo prossiga mesmo se o áudio falhar
return [{
  json: {
    ...item,
    speechText: text,
    audioGeneratedUrl: audioUrl,
    hasAudioUrl: Boolean(audioUrl),
    voiceUsed: voiceName,
    engine: 'Gemini-2.5-Pro-TTS'
  }
}];`;

async function deployCleanAudioPrices() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];

  let updatedAgent = false;
  let updatedFormatter = false;
  let updatedTts = false;

  nodes = nodes.map(node => {
    // 1. Atualizar Prompt do AI Agent
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_NATURAL_CEARENSE;
      updatedAgent = true;
    }
    // 2. Atualizar Nó de Formatação
    if (node.id === 'code-format-ai-response' || node.name.includes('Formatar Resposta') || node.name.includes('Extrair Tags')) {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = FORMAT_AI_RESPONSE_CODE;
      updatedFormatter = true;
    }
    // 3. Atualizar Nó de TTS
    if (node.id === 'openai-generate-tts' || node.name.includes('Gerar Áudio')) {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = OPENAI_TTS_CODE;
      updatedTts = true;
    }
    return node;
  });

  console.log(`Status de Atualização: Agent=${updatedAgent}, Formatter=${updatedFormatter}, TTS=${updatedTts}`);

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

deployCleanAudioPrices();
