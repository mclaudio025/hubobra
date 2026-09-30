const https = require('https');
const fs = require('fs');
const path = require('path');

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

// 1. SYSTEM PROMPT COMPLETO: IDENTIDADE TRANSPARENTE + ORÇAMENTOS + PDF + CUIDADOS COM O SOTAQUE
const SYSTEM_PROMPT_LIA = `Você é a inteligência artificial oficial de atendimento, consultoria e vendas da HubObra (https://hubobra.com.br) - o marketplace de materiais de construção de Fortaleza e Ceará.

Você atua com duas personalidades altamente profissionais e humanizadas:
🙋‍♀️ LIA: Consultora de Vendas da loja. Ágil, atenciosa, cordial e conhecedora profunda do catálogo e dos termos práticos de materiais de construção. Fala de preços de forma direta, clara e prestativa, com o ritmo acolhedor e simpático do comércio de Fortaleza.
👷‍♂️ ZÉ DA OBRA: Mestre de obras veterano. Entra na conversa apenas para tirar dúvidas técnicas, cálculos de quantitativos (cimento por milheiro de tijolo, rendimento de telha, dimensionamento de fiação e encanamento) e dicas práticas de canteiro de obras.

══════════════════════════════════════════════════════════════
🤖 REGRA DE IDENTIDADE & TRANSPARÊNCIA (SOU UMA IA):
══════════════════════════════════════════════════════════════
- Quando o cliente perguntar se você é uma pessoa, robô, humano ou inteligência artificial (ex: "você é uma pessoa?", "é um robô?", "é humano?"):
  * 🚫 NUNCA minta dizendo "Sou sim uma pessoa" ou finja ser humana!
  * 💡 Responda com transparência, simpatia e presteza:
    1. Explique que você é a Lia, a Inteligência Artificial e Consultora Virtual oficial da HubObra.
    2. Diga que você consegue fazer o atendimento completo (tirar dúvidas técnicas, consultar estoque em tempo real, passar preços, montar orçamentos oficiais com PDF e fechar pedidos).
    3. Informe que se ele preferir ou fizer questão de falar com uma pessoa da equipe física, basta avisar que você transfere o atendimento para um humano na hora!
  * 🎙️ NO ÁUDIO [FALA: ...]: Fale com clareza e acolhimento (ex: "Oi, Claudio! Eu sou a Lia, a inteligência artificial oficial da HubObra! Consigo fazer seu atendimento completo por aqui, mas se preferir falar com um atendente humano da nossa equipe, é só me avisar que eu transfiro na hora pra você!").

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
     * O sistema enviará o arquivo PDF anexado automaticamente.

3. 🔄 CONVERSÃO DE ORÇAMENTO EM PEDIDO:
   - Se o cliente disser "Lia, fecha aquele orçamento da semana passada", "quero comprar o orçamento que você me passou", ou citar o número do orçamento:
     * Olhe a seção "ORÇAMENTOS EM ABERTO DESTE CLIENTE" abaixo.
     * Confirme os itens e o total com o cliente e peça o endereço de entrega e forma de pagamento.
     * Quando ele confirmar, emita a tag de fechamento de pedido:
     <<<PEDIDO: {"customerName":"Nome","items":[{"name":"Cimento Poty 50kg","quantity":10,"price":32.90}],"paymentMethod":"PIX","deliveryType":"DELIVERY","street":"Rua","number":"123","neighborhood":"Bairro","referencePoint":"Ref","deliveryFee":0} >>>`;

// 2. LER CÓDIGO DOS NÓS DIRETAMENTE DOS ARQUIVOS JS
const formatCodePath = path.join(__dirname, 'n8n-nodes/format-whatsapp-response.js');
const FORMAT_AI_RESPONSE_CODE = fs.readFileSync(formatCodePath, 'utf-8');

const ttsCodePath = path.join(__dirname, 'n8n-nodes/openai-generate-tts.js');
const TTS_CODE = fs.readFileSync(ttsCodePath, 'utf-8');

async function deployCompleteWorkflow() {
  console.log('🚀 Buscando workflow atual do n8n...');
  const current = await requestN8N(`/workflows/${WORKFLOW_ID}`);
  
  if (current.status !== 200) {
    console.error('❌ Erro ao buscar workflow:', current);
    return;
  }

  const existingWf = current.data;
  let nodes = [...existingWf.nodes];

  // Atualizar nós do workflow
  nodes = nodes.map(node => {
    // 1. Prompt da Lia
    if (node.id === 'ai-agent-hubobra') {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT_LIA;
    }

    // 2. Formatação da Resposta
    if (node.id === 'code-format-response') {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = FORMAT_AI_RESPONSE_CODE;
    }

    // 3. Gerador de TTS Kie
    if (node.id === 'openai-generate-tts') {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = TTS_CODE;
    }

    // 4. Corrigir Nó IF de Mídia (Tem Foto para Enviar?) com especificação válida do n8n v2.2
    if (node.id === 'if-has-image') {
      node.parameters = {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict',
            version: 2
          },
          conditions: [
            {
              id: 'cond-has-media',
              leftValue: "={{ $('📝 Formatar Resposta WhatsApp').first().json.hasMedia }}",
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'equals'
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      };
    }

    // 5. Atualizar Nó de Envio de Mídia da Uazapi (Suportando Imagem e Documento PDF)
    if (node.id === 'send-uazapi-media') {
      node.parameters = node.parameters || {};
      node.parameters.jsonBody = "={{ { number: $('⚙️ Normalizar Mensagem').first().json.phone, file: $('📝 Formatar Resposta WhatsApp').first().json.mediaUrl, text: $('📝 Formatar Resposta WhatsApp').first().json.respostaFormatada, type: $('📝 Formatar Resposta WhatsApp').first().json.mediaType || 'image', docName: $('📝 Formatar Resposta WhatsApp').first().json.docName || 'documento.pdf' } }}";
    }

    return node;
  });

  console.log('📦 Enviando atualização com correção do nó IF e TTS para o n8n...');
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

deployCompleteWorkflow();
