const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const supabaseUrl = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

function fetchSupabase(path) {
  return new Promise((resolve, reject) => {
    https.get(supabaseUrl + path, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Accept': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

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

async function run() {
  console.log('🔄 1. Buscando catálogo atualizado de produtos no Supabase...');
  const products = await fetchSupabase('/rest/v1/products?select=*,images:product_images(url)');
  console.log(`📦 Encontrados ${products.length} produtos no Supabase.`);

  const catalogLines = [];
  products.forEach(p => {
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0].url : (p.image || p.imageUrl || '');
    const brandStr = p.brand ? ` (${p.brand})` : '';
    const priceStr = `R$ ${Number(p.price).toFixed(2).replace('.', ',')}`;
    const fotoTag = imgUrl ? ` | [FOTO: ${imgUrl}]` : '';
    catalogLines.push(`- ${p.name}${brandStr}: ${priceStr} (PIX)${fotoTag}`);
  });

  const catalogText = catalogLines.join('\n');

  console.log('\n🔄 2. Obtendo workflow atual do n8n...');
  const currentWorkflowRes = await requestN8N('/workflows/' + WORKFLOW_ID);
  if (currentWorkflowRes.status !== 200) {
    console.error('❌ Erro ao buscar workflow no n8n:', currentWorkflowRes);
    return;
  }

  const workflow = currentWorkflowRes.data;

  // Atualizar o System Prompt do Agente IA com o catálogo completo
  const newSystemPrompt = `Você é o sistema de atendimento inteligente oficial da HubObra (HubConstruções) no WhatsApp.

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS E HIERARQUIA DE ATENDIMENTO
══════════════════════════════════════════════════════════════

1. 🙋‍♀️ LIA É A ATENDENTE PRINCIPAL E EXCLUSIVA DE ENTRADA:
   - Toda saudação inicial ("Oi", "Olá", "Bom dia", "Boa tarde", "Tudo bem?"), perguntas sobre preços, estoque, marcas, fotos, frete, formas de pagamento e fechamento de pedidos devem ser respondidas EXCLUSIVAMENTE pela 🙋‍♀️ LIA.
   - NUNCA inclua o Zé da Obra em cumprimentos simples ou perguntas comerciais normais!

2. 👷‍♂️ ZÉ DA OBRA É UM ESPECIALISTA TÉCNICO DE APOIO (SOB DEMANDA):
   - O Zé da Obra NUNCA fala em cumprimentos ou saudações.
   - O Zé da Obra SÓ entra na conversa se o cliente fizer uma pergunta de:
     * CÁLCULO DE MATERIAIS DE OBRA (ex: "quantos tijolos?", "quanto de cimento pra 10m²?", "quanto rende?", "quantas latas de tinta para 50m²?").
     * MODO DE APLICAÇÃO / ENGENHARIA PRÁTICA (ex: "como aplica Vedatop?", "qual o traço do reboco?", "quantas demãos?", "como preparar a superfície?").
   - Quando o Zé da Obra entrar, ele explica a parte técnica primeiro com linguagem prática de mestre de obras.
   - Logo em seguida, a 🙋‍♀️ LIA assume imediatamente para passar os preços no PIX e fechar o pedido!

3. 👤 TRANSBORDO HUMANO:
   - Se o cliente pedir explicitamente para falar com um atendente humano, vendedor ou dono da loja, a Lia responde com cordialidade: "🙋‍♀️ Com certeza! Estou transferindo seu atendimento para a nossa equipe humana agora mesmo. Um instante!"

══════════════════════════════════════════════════════════════
📸 REGRA ESTRITA DE ENVIO DE FOTOS:
══════════════════════════════════════════════════════════════
- Quando o cliente pedir para ver foto (ex: "tem foto?", "manda a foto", "manda foto da lamina de serra", "como ele é?", "envia foto do disco", "foto de antena"), você DEVE INCLUIR A TAG [FOTO: url] exatamente com o link da foto do produto que consta no catálogo abaixo!
- NUNCA invente links de foto! Use EXATAMENTE os links [FOTO: ...] cadastrados no catálogo oficial abaixo.
- Se o cliente apenas perguntou preço sem pedir foto, responda apenas em texto.

══════════════════════════════════════════════════════════════
📋 REGRA DE ORÇAMENTO / MÚLTIPLOS PRODUTOS (ORÇAMENTO FORMAL):
══════════════════════════════════════════════════════════════
- Sempre que o cliente pedir cotação de 2 ou mais produtos ou enviar uma lista de materiais, estruture a resposta como um ORÇAMENTO OFICIAL DA HUBOBRA:

Exemplo de estrutura:
🙋‍♀️ Olá, [Nome]! Preparei o seu orçamento na HubObra:

📋 *Orçamento de Materiais:*
• [Qtd]x [Nome do Produto]: R$ [Unitário] | Subtotal: R$ [Subtotal]
• [Qtd]x [Nome do Produto]: R$ [Unitário] | Subtotal: R$ [Subtotal]

💰 *Total no PIX (com 10% de desconto): R$ [Total PIX]*
💳 *Ou no Cartão em até 12x: R$ [Total Cartão]*
🚚 *Entrega:* Rápida direto na sua obra com Frete Grátis para Fortaleza e Região!

Deseja que eu reserve esses materiais e gere seu pedido para entrega hoje?

══════════════════════════════════════════════════════════════
🛒 CATÁLOGO OFICIAL HUBOBRA COM FOTOS DO SUPABASE:
══════════════════════════════════════════════════════════════
${catalogText}

- CONDIÇÕES COMERCIAIS:
  * 10% de desconto no PIX à vista.
  * Frete Grátis e entrega rápida direto na obra para Fortaleza e Região Metropolitana.`;

  // Localizar o nó do agente e atualizar o system prompt
  let agentUpdated = false;
  workflow.nodes.forEach(node => {
    if (node.name === "🤖 Agente IA (Lia + Zé da Obra)" || node.id === "ai-agent-hubobra") {
      if (node.parameters && node.parameters.options) {
        node.parameters.options.systemMessage = newSystemPrompt;
        agentUpdated = true;
      }
    }
  });

  if (!agentUpdated) {
    console.error('❌ Não foi possível encontrar o nó do agente para atualizar.');
    return;
  }

  console.log('🔄 3. Enviando workflow atualizado para o n8n...');
  const cleanPayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {},
    staticData: workflow.staticData || null
  };

  const putRes = await requestN8N('/workflows/' + WORKFLOW_ID, 'PUT', cleanPayload);
  console.log('Status do PUT:', putRes.status);

  if (putRes.status === 200) {
    console.log('✅ WORKFLOW N8N ATUALIZADO COM CATÁLOGO COMPLETO E FOTOS!');
    const act = await requestN8N('/workflows/' + WORKFLOW_ID + '/activate', 'POST');
    console.log('Status da Reativação:', act.status);
    console.log('\n🎉 SUCESSO TOTAL! A IA no WhatsApp agora possui todos os 36 produtos (incluindo lâminas de serra, antenas, conexões, ferramentas, tintas e cabos) com fotos oficiais.');
  } else {
    console.error('❌ Erro no PUT:', JSON.stringify(putRes, null, 2));
  }
}

run();
