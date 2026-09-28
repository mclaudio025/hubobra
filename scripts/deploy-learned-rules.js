const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const KIE_API_KEY = 'b30b1489000ba908bd72cc04e0d6cc16';
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

// 🧠 SYSTEM PROMPT COM A REGRA DE APRENDIZADO 1: ÁUDIO SÓ PARA RESPOSTAS CURTAS / ORÇAMENTOS E RELATÓRIOS 100% EM TEXTO
const SYSTEM_PROMPT_WITH_LEARNINGS = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção em Fortaleza e Região.

Você atua com duas personalidades:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e focada em apresentar materiais, orçamentos claros e conduzir o fechamento.
👷‍♂️ ZÉ DA OBRA: Mestre de obras experiente. Entra na conversa APENAS para dúvidas técnicas e cálculos de quantitativos de obra.

══════════════════════════════════════════════════════════════
⭐ REGRA DE APRENDIZADO #1 (ÁUDIO vs TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. 🎙️ QUANDO USAR ÁUDIO (Tag [FALA: ...]):
   - O áudio serve APENAS para saudações calorosas e respostas rápidas e curtas (1 a 2 frases, 5 a 10 segundos).
   - Exemplo em dúvida rápida: "[FALA: Oi Claudio! A telha ecológica vermelha tá saindo a R$ 119,90 no PIX. Quantas unidades você vai precisar?]"
   - ⚠️ QUANDO FOR ORÇAMENTO, COTAÇÃO, CÁLCULO OU LISTA DE ITENS:
     O áudio NUNCA deve falar os preços ou listar itens! O áudio deve ser APENAS:
     "[FALA: Oi Claudio! Já levantei todos os itens do seu orçamento com os valores certinhos e o desconto no PIX. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!]"

2. 📝 QUANDO USAR TEXTO ESCRITO (Corpo da Mensagem):
   - TODOS os orçamentos, cotações com múltiplos itens, listas de materiais, relatórios de engenharia e recibos DEVEM VIR OBRIGATORIAMENTE POR ESCRITO NO CORPO DO TEXTO, FORA DA TAG [FALA].
   - 🚫 NUNCA coloque o orçamento ou listas dentro da tag [FALA]. A tag [FALA] é apenas a voz de introdução!

══════════════════════════════════════════════════════════════
📊 FORMATO DE ORÇAMENTO EM TEXTO:
══════════════════════════════════════════════════════════════
Quando o cliente pedir um orçamento, organize SEMPRE no corpo do texto por escrito:
[FALA: Oi Claudio! Já montei seu orçamento completo com os valores e o desconto no PIX. Dá uma olhada aqui embaixo!]

📋 *Orçamento HubObra:*
• 3x Telha Ecológica (200x95cm): R$ 359,70
• 5x Lâmina de Serra Starrett: R$ 65,00
• 5x Caixa de Luz 4x2: R$ 8,55

💰 *Total no PIX (com 10% de DESCONTO): R$ 389,93*
🚚💳 *Ou no Cartão na Entrega: R$ 433,25*

Você gostaria da entrega direta na sua obra em Messejana ou prefere retirada express no balcão?

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

// 📝 NOVO FORMATADOR DE RESPOSTA COM BLINDAGEM ANTI-ENGOLIMENTO DE TEXTO
const JS_FORMAT_RESPONSE_BLINDADO = `// 📝 FORMATADOR MULTIMODAL INTELIGENTE (COM BLINDAGEM DE ORÇAMENTOS)
return await (async () => {
  const item = $input.first().json;
  const initialData = $('⚙️ Normalizar Mensagem').first().json;
  const customerName = initialData.name || 'amigo';

  let rawText = '';
  if (item.output) {
    rawText = item.output;
  } else if (item.text) {
    rawText = item.text;
  } else if (typeof item === 'string') {
    rawText = item;
  }

  // 1. Extração de Imagens
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  if (fotoTagMatch && fotoTagMatch[1]) imageUrl = fotoTagMatch[1].trim();

  // 2. Extração Inteligente de Fala [FALA: ...]
  let speechText = '';
  let textBody = rawText;

  const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
  if (falaMatch && falaMatch[1]) {
    const rawFala = falaMatch[1].trim();
    
    // Se a IA colocou um texto gigantesco com orçamento dentro do [FALA], recupera para o texto escrito!
    if (rawFala.length > 180 || rawFala.includes('R$') || rawFala.includes('Total') || rawFala.includes('Orçamento') || rawFala.includes('unitário')) {
      speechText = \`Oi \${customerName}! Já calculei todos os itens do seu orçamento com o desconto no Pícs. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!\`;
      
      // Se não havia texto fora do [FALA], o próprio conteúdo do [FALA] vira o texto escrito do WhatsApp!
      const outsideText = rawText.replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '').trim();
      if (!outsideText || outsideText.length < 20) {
        textBody = rawFala;
      }
    } else {
      speechText = rawFala;
    }
  } else {
    // Se não teve [FALA], cria fala curta padrão
    speechText = \`Oi \${customerName}! Já separei as informações dos materiais da Hub, Obra para você!\`;
  }

  // 3. Limpeza do Texto Escrito para o WhatsApp
  let respostaFormatada = textBody
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 10) {
    respostaFormatada = rawText.replace(/\\[FALA:\\s*/gi, '').replace(/\\]/gi, '').trim();
  }

  // 4. Normalização Fonética da Fala de Áudio
  speechText = speechText
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

  if (speechText.length > 250) {
    speechText = speechText.substring(0, 250) + '...';
  }

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
      hasImage: Boolean(imageUrl && imageUrl.startsWith('http')),
      isAudioInput: Boolean(initialData.isAudio),
      hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
    }
  }];
})();`;

async function deployLearnings() {
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
    // 1. Atualizar System Prompt
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_WITH_LEARNINGS;
    }

    // 2. Atualizar Formatador com Blindagem
    if (node.id === 'code-format-response' || node.name.includes('Formatar Resposta')) {
      node.parameters = {
        jsCode: JS_FORMAT_RESPONSE_BLINDADO
      };
    }

    return node;
  });

  console.log('📦 Enviando atualização da Regra #1 (Áudio curto vs Texto detalhado) para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! REGRA DE APRENDIZADO #1 IMPLANTADA E ATIVADA NO WHATSAPP!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployLearnings().catch(console.error);
