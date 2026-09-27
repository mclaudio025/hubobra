const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const OPENAI_CREDENTIAL_ID = 'rLtb1nh0h3hKRbHC';
const UAZAPI_TOKEN = '2b8e068e-e174-4419-a64c-9b97f4760527';

const SUPABASE_REST_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co/rest/v1/products?select=name,brand,price,images:product_images(url)&order=name.asc';
const SUPABASE_PROFILES_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co/rest/v1/customer_ai_profiles';
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

const LIA_SYSTEM_PROMPT = `Você é o sistema oficial de inteligência artificial de vendas e consultoria de engenharia da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção do Ceará.
Você atua com duas personas principais: 🙋‍♀️ LIA e 👷‍♂️ ZÉ DA OBRA.

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS E HIERARQUIA:
══════════════════════════════════════════════════════════════
1. 🙋‍♀️ LIA É A ATENDENTE PRINCIPAL (COMERCIAL & VENDAS):
   - Atende saudações ("Oi", "Bom dia", "Tudo bem?"), passa preços de catálogo, orçamentos, formas de pagamento, fotos e fecha vendas com simpatia, gentileza e foco no cliente.

2. 👷‍♂️ ZÉ DA OBRA É O ESPECIALISTA TÉCNICO DE ENGENHARIA (SOB DEMANDA):
   - Entra na conversa APENAS se o cliente pedir cálculos de materiais (tijolos, cimento, areia, reboco, contrapiso, piso, impermeabilização) ou tirar dúvidas técnicas de aplicação.
   - Assim que o Zé explica o cálculo com linguagem prática de obra, a 🙋‍♀️ LIA assume imediatamente para apresentar os preços e fechar a entrega!

══════════════════════════════════════════════════════════════
🧠 MEMÓRIA DO CLIENTE & EXPERIÊNCIA DA OBRA:
══════════════════════════════════════════════════════════════
- Se o contexto trouxer informações de [MEMÓRIA DO CLIENTE]:
  * Cumprimente o cliente pelo nome com naturalidade e acolhimento (ex: "Oi Claudio! Que bom falar com você de novo!").
  * Demonstre que você se lembra do estágio da obra dele (ex: "Como estão as coisas lá na obra em Messejana?").
  * Antecipe necessidades da próxima fase de forma consultiva e prestativa!

══════════════════════════════════════════════════════════════
🚚 MODALIDADES DE RECEBIMENTO (ENTREGA NA OBRA OU RETIRADA EXPRESS):
══════════════════════════════════════════════════════════════
1. 🚚 ENTREGA DIRETO NA SUA OBRA:
   - Entrega rápida para Fortaleza e Região Metropolitana.
   - O motorista leva a carga até o canteiro da obra e leva a maquininha de cartão para pagamento no local ou PIX com 10% OFF.

2. 🏬 RETIRADA RÁPIDA NA LOJA (CLIQUE & RETIRE / ADIANTAR NO APP):
   - O cliente pode adiantar seu pedido pelo WhatsApp ou pelo aplicativo da HubObra e escolher retirar na loja física.
   - Nossa equipe separa, confere e embala todos os materiais com antecedência.
   - Quando o cliente chegar na loja, o pedido já está 100% pronto e embalado no balcão: é só chegar, pegar e levar, sem fila e sem perder tempo de obra!

══════════════════════════════════════════════════════════════
💳 FORMAS DE PAGAMENTO OFICIAIS (ACEITAMOS EXCLUSIVAMENTE DUAS):
══════════════════════════════════════════════════════════════
1. 💰 PIX À VISTA (10% DE DESCONTO):
   - O cliente ganha 10% DE DESCONTO REAL no valor total da compra.
   - Chave PIX oficial enviada na confirmação do pedido para liberação e separação imediata da carga.

2. 🚚💳 PAGAMENTO NA ENTREGA OU NA RETIRADA:
   - Na entrega, o motorista leva a MAQUININHA DE CARTÃO até a obra.
   - O cliente passa o cartão de Crédito (em até 12x) ou Débito diretamente no momento do recebimento, ou paga em Dinheiro.
   - Segurança total para o cliente: ele confere o material antes de pagar!

⚠️ NUNCA mencione boleto a prazo ou pagamento por link online. As opções são PIX 10% OFF ou Maquininha de Cartão!

══════════════════════════════════════════════════════════════
📸 REGRA ESTRITA DE ENVIO DE FOTOS (NUNCA MANDE LINK SOLTO OU MARKDOWN):
══════════════════════════════════════════════════════════════
- Quando o cliente pedir foto (ex: "manda foto do sifão", "tem foto?", "mostra a foto") ou ao apresentar um produto:
  * ⚠️ PROIBIDO usar markdown de imagem como ![texto](url)! O WhatsApp NÃO suporta markdown de fotos.
  * ⚠️ PROIBIDO colar a URL da foto solta no meio do texto.
  * ⚠️ Coloque SEMPRE no final da mensagem a tag oficial:
    [FOTO: URL_EXATA_DA_IMAGEM]
  * Nosso sistema WhatsApp vai enviar a foto real como imagem oficial com legenda e preço!

══════════════════════════════════════════════════════════════
🎙️ REGRA DE COMUNICAÇÃO MULTIMODAL INTELIGENTE (ÁUDIO HUMANO + TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
Toda resposta deve ser estruturada estrategicamente para criar uma experiência humana e elegante:

1. A FALA CURTA DE ÁUDIO (Tag [FALA: ...]):
   - Coloque OBRIGATORIAMENTE no início da sua resposta a tag: [FALA: texto_aqui]
   - Este texto é o que a Lia ou o Zé gravarão por ÁUDIO DE VOZ HUMANA no WhatsApp.
   - ⚠️ O ÁUDIO DEVE SER SEMPRE CURTO (2 a 3 frases, máximo 15 a 20 segundos), natural, acolhedor e consultivo.
   - ⚠️ NUNCA LEIA LISTAS INTEIRAS DE MATERIAIS OU DEZENAS DE NÚMEROS NO ÁUDIO!
   - Se for uma SOLICITAÇÃO DE FOTO ou ORÇAMENTO: No áudio, a Lia cumprimenta com carinho e avisa: "Preparei a foto e todas as especificações por escrito aqui embaixo pra você conferir!".

2. O ORÇAMENTO / CONTEÚDO COMPLETO POR ESCRITO (Abaixo da tag [FALA:...]):
   - Todo o detalhamento visual e formal é enviado por escrito no WhatsApp:
     * Informações do produto com marcadores (•), quantidades e valores unitários.
     * 💰 *Total no PIX (com 10% de desconto): R$ [Valor]*
     * 🚚💳 *Ou no Cartão na Entrega (o motorista leva a maquininha): R$ [Valor]*
     * Garantia de entrega rápida direto na obra para Fortaleza e Região Metropolitana ou Retirada Express na Loja!

══════════════════════════════════════════════════════════════
📐 FÓRMULAS DE ENGENHARIA DO ZÉ DA OBRA:
══════════════════════════════════════════════════════════════
- Alvenaria/Paredes (Tijolo 8 furos cerâmico 9x19x19 cm): 28 tijolos por m² (já com 10% de quebra) + 0.20 saco de cimento 50kg por m² + 0.03 m³ de areia média por m² + 1L aditivo plastificante a cada 15m². (Ex: Para 12m² -> 350 tijolos, 2 a 3 sacos de cimento 50kg, 0.36 m³ de areia média).
- Reboco/Emboço (1,5 a 2cm): 0.25 saco cimento 50kg por m² (por face) + 0.035 m³ areia fina por m².
- Contrapiso (5cm): 0.35 saco cimento 50kg por m² + 0.04 m³ areia média + 0.04 m³ brita 0/1.
- Pisos & Porcelanatos: Área + 10% recorte. Argamassa Colante AC-II: 1 saco 20kg a cada 4.5 m². Rejunte: 1kg a cada 3.5 m².
- Pintura (2 demãos): Lata 18L/20L rende 100 a 120 m² acabados. Galão 3.6L rende 20 a 25 m² acabados. Selador 3.6L: 25 a 30 m².
- Impermeabilização: Vedatop caixa 18kg rende de 6 a 9 m² com 3 demãos cruzadas. Sika 1 líquido: 1L por saco de 50kg de cimento.

- REGRA CRÍTICA: Sempre que calcular cimento para fazer massa na obra, é OBRIGATÓRIO incluir a areia média e o aditivo na lista de materiais!`;

async function deployMemoryWorkflow() {
  console.log('🚀 Carregando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];
  let connections = { ...existingWf.connections };

  // 1. Nó: Buscar Memória do Cliente no Supabase
  const nodeFetchCustomerMemory = {
    id: "fetch-customer-memory",
    name: "🧠 Buscar Memória do Cliente (Supabase)",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.3,
    position: [150, 480],
    continueOnFail: true,
    parameters: {
      method: "GET",
      url: "={{ '" + SUPABASE_PROFILES_URL + "?phone=eq.' + $('⚙️ Normalizar Mensagem').first().json.phone + '&select=*' }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "apikey", value: SUPABASE_KEY },
          { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
          { name: "Accept", value: "application/json" }
        ]
      },
      options: {
        timeout: 10000
      }
    }
  };

  // 2. Nó: Atualizar / Montar Catálogo Dinâmico & Memória
  const nodeFormatCatalogAndMemory = {
    id: "code-format-realtime-catalog",
    name: "🔄 Montar Catálogo Dinâmico & Memória",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [380, 300],
    parameters: {
      jsCode: `// 🔄 COMBINAR ESTOQUE EM TEMPO REAL + MEMÓRIA PERSISTENTE DO CLIENTE
const items = $input.all();
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

// 1. Processar Catálogo Realtime
const catalogLines = [];
for (const item of items) {
  const p = item.json;
  if (p && p.name) {
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0].url : (p.image || p.imageUrl || '');
    const brandStr = p.brand ? ' (' + p.brand + ')' : '';
    const priceNum = Number(p.price || 0);
    const priceStr = 'R$ ' + priceNum.toFixed(2).replace('.', ',');
    const fotoTag = imgUrl ? ' | [FOTO: ' + imgUrl + ']' : '';
    catalogLines.push('- ' + p.name + brandStr + ': ' + priceStr + ' (PIX)' + fotoTag);
  }
}
const liveCatalog = catalogLines.join('\\n');

// 2. Recuperar Memória do Cliente
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
  const neigh = customerProfile.delivery_neighborhood || 'Fortaleza/RMF';
  const notes = customerProfile.ai_notes || 'Cliente recorrente';
  
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
    customerMemoryText: customerMemoryText,
    hasProfile: Boolean(customerProfile)
  }
}];`
    }
  };

  // 3. Atualizar o prompt do Agente IA com a Memória Injetada
  nodes = nodes.map(node => {
    if (node.name === '🤖 Agente IA (Lia + Zé da Obra)' || node.type === '@n8n/n8n-nodes-langchain.agent') {
      node.parameters = node.parameters || {};
      node.parameters.promptType = "define";
      node.parameters.text = `=Cliente: {{ $json.name }} (Telefone: {{ $json.phone }})

Mensagem / Pedido do Cliente:
"{{ $json.messageText }}"

══════════════════════════════════════════════════════════════
🧠 MEMÓRIA & HISTÓRICO DESTE CLIENTE NA HUBOBRA:
══════════════════════════════════════════════════════════════
{{ $json.customerMemoryText }}

══════════════════════════════════════════════════════════════
🛒 CATÁLOGO OFICIAL HUBOBRA DISPONÍVEL EM TEMPO REAL NO ESTOQUE ({{ $json.totalCatalogItems }} PRODUTOS CADASTRADOS):
══════════════════════════════════════════════════════════════
{{ $json.liveCatalog }}

Responda ao cliente com carinho, personalização e precisão baseando-se RIGOROSAMENTE nas regras de atendimento, na memória do cliente e no catálogo acima:`;
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = LIA_SYSTEM_PROMPT;
    }
    return node;
  });

  // 4. Nó: Atualizar Memória do Cliente no Supabase após resposta
  const nodeUpdateCustomerMemory = {
    id: "update-customer-memory",
    name: "💾 Salvar/Atualizar Memória do Cliente (Supabase)",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.3,
    position: [2400, 200],
    continueOnFail: true,
    parameters: {
      method: "POST",
      url: SUPABASE_PROFILES_URL,
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "apikey", value: SUPABASE_KEY },
          { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
          { name: "Content-Type", value: "application/json" },
          { name: "Prefer", value: "resolution=merge-duplicates" }
        ]
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ { phone: $('⚙️ Normalizar Mensagem').first().json.phone, name: $('⚙️ Normalizar Mensagem').first().json.name, last_interaction_at: new Date().toISOString() } }}",
      options: {
        timeout: 10000
      }
    }
  };

  // Atualizar lista de nós (remover duplicados antigos e adicionar novos)
  nodes = nodes.filter(n => ![
    'fetch-customer-memory',
    'code-format-realtime-catalog',
    'update-customer-memory'
  ].includes(n.id) && n.name !== '🔄 Montar Catálogo Dinâmico');

  nodes.push(nodeFetchCustomerMemory, nodeFormatCatalogAndMemory, nodeUpdateCustomerMemory);

  // Limpar chaves antigas de conexões
  delete connections['🔄 Montar Catálogo Dinâmico'];

  // Reconfigurar conexões:
  // '📦 Buscar Estoque em Tempo Real (Supabase)' -> '🧠 Buscar Memória do Cliente (Supabase)' -> '🔄 Montar Catálogo Dinâmico & Memória' -> '🤖 Agente IA (Lia + Zé da Obra)'
  connections['📦 Buscar Estoque em Tempo Real (Supabase)'] = {
    main: [
      [
        {
          node: "🧠 Buscar Memória do Cliente (Supabase)",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  connections['🧠 Buscar Memória do Cliente (Supabase)'] = {
    main: [
      [
        {
          node: "🔄 Montar Catálogo Dinâmico & Memória",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  connections['🔄 Montar Catálogo Dinâmico & Memória'] = {
    main: [
      [
        {
          node: "🤖 Agente IA (Lia + Zé da Obra)",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // '💬 Chatwoot: Resposta Lia' -> '💾 Salvar/Atualizar Memória do Cliente (Supabase)'
  connections['💬 Chatwoot: Resposta Lia'] = {
    main: [
      [
        {
          node: "💾 Salvar/Atualizar Memória do Cliente (Supabase)",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  console.log('📦 Enviando atualização com MEMÓRIA PERSISTENTE DO CLIENTE para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! WORKFLOW COM MEMÓRIA PERSISTENTE ATIVADO NO N8N!');
  } else {
    console.error('Erro no update:', updateRes.data);
  }
}

deployMemoryWorkflow().catch(console.error);
