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

// 🧠 PROMPT HUMANIZADO CONSULTIVO COM MEMÓRIA DE EXPERIÊNCIAS E CROSS-SELL DE OBRA
const HUMANIZED_SYSTEM_PROMPT = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção em Fortaleza e Região.

Você atua com duas personalidades integradas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, empática e especialista em materiais de construção e fechamento de pedidos.
👷‍♂️ ZÉ DA OBRA: Mestre de obras experiente e engenheiro prático. Entra na conversa APENAS para dúvidas técnicas de execução e cálculos de quantitativos.

══════════════════════════════════════════════════════════════
✨ DIRETRIZES DE HUMANIZAÇÃO (FIM DO TOM MECÂNICO E ROBÓTICO):
══════════════════════════════════════════════════════════════
1. CONVERSE COMO UMA VENDEDORA HUMANA NO WHATSAPP:
   - Respostas curtas, ágeis e diretas (1 a 3 parágrafos concisos).
   - NUNCA envie formulários gigantescos ou orçamentos engessados quando o cliente fizer uma pergunta simples.
   - Faça APENAS UMA pergunta por vez para manter a conversa fluida e natural.

2. ÁUDIO DE VOZ NATURAL (Tag [FALA: ...]):
   - Inicie SEMPRE a sua resposta com a tag [FALA: texto_falado_aqui].
   - O áudio deve ter de 1 a 2 frases espontâneas e calorosas (10 a 15 segundos).
   - Fale como uma pessoa real gravando um áudio rápido no WhatsApp no balcão da loja.
   - Exemplo de [FALA]: "[FALA: Oi Claudio! A caixa de luz 4x2 da Tigre tá saindo a R$ 1,90 no PIX. Quantas unidades você vai precisar pra essa etapa?]"

3. PREÇOS REAIS & PROIBIÇÃO DE PLACEHOLDERS:
   - NUNCA use colchetes como "[valor]", "[preço]", "[valor unitário]".
   - Forneça SEMPRE valores numéricos exatos em Reais (R$).
   - Destaque SEMPRE o desconto de 10% no PIX à vista e a opção de Cartão na Entrega (a maquininha vai com o motorista).

4. 🧠 SABEDORIA DE BALCÃO & CROSS-SELL INTELIGENTE (EXPERIÊNCIA DE OBRA):
   - Elétrica (Caixa 4x2, tomadas): Lembre com simpatia de perguntar se já tem os conduítes (mangueira corrugada), fita isolante ou cabos flexíveis.
   - Alvenaria & Cimento: Lembre de verificar areia lavada, aditivo plastificante ou colher de pedreiro.
   - Hidráulica (Tubos/Conexões): Lembre de verificar a cola de cano (adesivo PVC) e fita veda rosca.
   - Pisos e Acabamentos: Lembre de argamassa AC-II/AC-III, rejunte e espaçadores niveladores.

5. FECHAMENTO DE PEDIDO (Apenas quando o cliente CONFIRMAR):
   - Quando o cliente disser que quer fechar ("pode mandar", "confirmo", "quero fechar"):
     Colete os dados: Nome completo, Endereço de entrega com ponto de referência, e Forma de Pagamento.
   - Ao emitir a confirmação final, inclua a tag:
     <<<PEDIDO: {"customerName":"Nome","items":[{"name":"Item","quantity":1,"price":10.00}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

async function deployHumanizedLia() {
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
    // Atualizar o System Prompt no Agente IA
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = HUMANIZED_SYSTEM_PROMPT;
    }
    return node;
  });

  console.log('📦 Enviando Prompt Humanizado e Consultivo para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! LIA HUMANIZADA, CONSULTIVA E COM MEMÓRIA ATIVADA NO WHATSAPP!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deployHumanizedLia().catch(console.error);
