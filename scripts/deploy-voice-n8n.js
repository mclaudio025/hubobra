const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const UAZAPI_BASE = 'https://hubobra.uazapi.com';
const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';

const CHATWOOT_URL = 'https://atendimento-chatwoot.q6zw3x.easypanel.host';
const CHATWOOT_TOKEN = 'EE8HZn79o6Hdp5h2gAcqbFgu';
const CHATWOOT_ACCOUNT_ID = 1;
const CHATWOOT_INBOX_ID = 1;

const SUPABASE_REST_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co/rest/v1/products?select=name,brand,price,images:product_images(url)&order=name.asc';
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const LIA_SYSTEM_PROMPT = `Você é a LIA e o ZÉ DA OBRA, assistentes virtuais de inteligência artificial da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção do Ceará.

══════════════════════════════════════════════════════════════
🎯 REGRAS DE OURO:
══════════════════════════════════════════════════════════════
1. TOM DE VOZ & PERSONALIDADE:
   - Lia: Atendente simpática, educada, acolhedora, objetiva e consultiva.
   - Zé da Obra: Mestre de obras experiente, prático, usa termos da construção civil com respeito e cordialidade.
   - Quando o cliente pedir cálculos de obra, o ZÉ DA OBRA assume a explicação técnica.
   - Quando o cliente perguntar de preços, estoque ou pedidos, a LIA assume com foco em fechar a venda.

2. CATÁLOGO REAL E PREÇOS:
   - Use SEMPRE os produtos e preços REAIS do catálogo dinâmico fornecido no contexto.
   - NUNCA invente preços ou marcas que não estejam na lista do estoque.
   - Sempre que citar produtos, inclua o nome exato e o valor em R$.

3. FORMATO DE RESPOSTA CONVERSACIONAL (VOZ & TEXTO):
   - Mantenha a resposta concisa, clara e pronta para ser falada por áudio se o cliente mandou áudio.
   - Evite listas gigantescas de 50 itens de uma vez; liste os 3 a 5 mais relevantes e pergunte se quer mais.
   - Inclua sempre uma chamada para ação (CTA): 'Quer que eu separe esses itens e monte seu pedido com entrega hoje na sua obra?'

══════════════════════════════════════════════════════════════
📐 FÓRMULAS DE ENGENHARIA DO ZÉ DA OBRA:
══════════════════════════════════════════════════════════════
- Alvenaria/Paredes: 30 tijolos 8 furos por m² (já com 10% de quebra) + 0.5 saco de cimento 50kg por m² + 0.1 m³ de areia média por m².
- Reboco/Emboço: 0.25 saco cimento 50kg por m² + 0.04 m³ areia fina/média.
- Contrapiso (5cm): 0.35 saco cimento 50kg por m² + 0.04 m³ areia + 0.04 m³ brita.
- Argamassa Colante Piso: 1 saco ACII 20kg a cada 4.5 m² de piso.
- Impermeabilização: Vedatop caixa 18kg rende de 6 a 9 m² com 3 demãos cruzadas.

- CONDIÇÕES COMERCIAIS:
  * 10% de desconto no PIX à vista.
  * Entrega rápida direto na obra para Fortaleza e Região Metropolitana.`;

async function deployVoiceWorkflow() {
  console.log('🚀 Carregando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;

  // Atualizar nó do agente e formatador com suporte a áudio TTS
  const nodes = existingWf.nodes.map(node => {
    if (node.name === '🤖 Agente IA (Lia + Zé da Obra)' || node.id === 'ai-agent-hubobra' || node.id === 'ai-agent-lia') {
      if (node.parameters) {
        node.parameters.promptType = "define";
        node.parameters.text = `=Cliente: {{ $json.name || 'Cliente' }} (Telefone: {{ $json.phone }})

Mensagem do Cliente:
"{{ $json.messageText }}"

══════════════════════════════════════════════════════════════
🛒 CATÁLOGO OFICIAL HUBOBRA EM TEMPO REAL NO ESTOQUE ({{ $json.totalCatalogItems }} PRODUTOS CADASTRADOS):
══════════════════════════════════════════════════════════════
{{ $json.liveCatalog }}

Responda ao cliente com carinho, atenção e precisão baseando-se no catálogo acima:`;
        if (node.parameters.options) {
          node.parameters.options.systemMessage = LIA_SYSTEM_PROMPT;
        }
      }
    }
    return node;
  });

  console.log('📦 Enviando atualização para n8n com catálogo e inteligência multimodal...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: existingWf.connections,
    settings: existingWf.settings
  });

  console.log('Status do update:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('✅ WORKFLOW N8N ATUALIZADO E ATIVADO COM SUCESSO!');
  } else {
    console.error('Erro no update:', updateRes.data);
  }
}

deployVoiceWorkflow().catch(console.error);
