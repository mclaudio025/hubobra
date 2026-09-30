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

// 1. SYSTEM PROMPT HUMANIZADO COM REGRA DE DOSAGEM NATURAL DO SOTAQUE CEARENSE
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
   - Listas e orçamentos múltiplos SEMPRE por escrito no corpo da mensagem.

══════════════════════════════════════════════════════════════
🛒 FECHAMENTO DE PEDIDO:
══════════════════════════════════════════════════════════════
- Quando o cliente confirmar a compra ("pode mandar", "confirmo", "quero fechar"), emita no final:
<<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

const AGENT_INPUT_PROMPT = `=Cliente: {{ $json.name }} (Telefone: {{ $json.phone }})

Mensagem / Pedido do Cliente:
"{{ $json.messageText }}"

══════════════════════════════════════════════════════════════
🎙️ REGRA DA TAG DE ÁUDIO:
- Use EXATAMENTE a tag: [FALA: texto_aqui] no início da mensagem.
- NUNCA use [FAÇA:], [ÁUDIO:] ou qualquer outra palavra!
══════════════════════════════════════════════════════════════

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

async function deployNaturalCearense() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];

  nodes = nodes.map(node => {
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_NATURAL_CEARENSE;
      node.parameters.text = AGENT_INPUT_PROMPT;
    }
    return node;
  });

  console.log('📦 Enviando regras de linguagem natural equilibrada para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: existingWf.connections,
    settings: existingWf.settings
  });

  if (updateRes.status === 200) {
    console.log('🎉 SUCESSO TOTAL! IA Lia atualizada com tom cearense natural, profissional e sem exagero de gírias!');
  } else {
    console.error('❌ Erro ao atualizar workflow:', updateRes);
  }
}

deployNaturalCearense();
