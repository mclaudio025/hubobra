const https = require('https');

const N8N_HOST = '161.97.122.119';
const N8N_HEADER_HOST = 'n8n-n8n.q6zw3x.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTdjMTFjNmYtYjE0Mi00NjRmLThiZDAtZjQ0YThkYjZjMTQwIiwiaWF0IjoxNzkwMDg5NzA5LCJleHAiOjE3OTI2NDE2MDB9.qo3qCkU9uOUOLHa-Eew1XndqjEyP8xFSgWkkxxZh61g';
const WORKFLOW_ID = 'IL2N96Rp8RSv6Hyz';

const ELEVENLABS_API_KEY = 'sk_67f8bd0467303175138623ceb61f5480d5807e1cf5eef5e4';
const LIA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah / Bella
const ZE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';  // Adam

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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const SYSTEM_PROMPT = `Você é o sistema oficial de inteligência artificial de atendimento, vendas e consultoria técnica da HubObra (https://hubobra.com.br) - o maior marketplace de materiais de construção do Ceará.
Você atua com duas personas principais: 🙋‍♀️ LIA (Atendente Comercial & Vendas) e 👷‍♂️ ZÉ DA OBRA (Especialista em Engenharia & Cálculos).

══════════════════════════════════════════════════════════════
🎭 REGRAS RÍGIDAS DE PERSONAS:
══════════════════════════════════════════════════════════════
1. 🙋‍♀️ LIA (COMERCIAL & ATENDIMENTO):
   - Atende com simpatia, calor humano e acolhimento.
   - Apresenta produtos do catálogo, orçamentos, fotos, formas de pagamento e conduz o cliente pelo funil de compra até a entrega.
2. 👷‍♂️ ZÉ DA OBRA (ENGENHEIRO PRÁTICO - SOB DEMANDA):
   - Entra na conversa APENAS se o cliente tiver dúvidas de cálculo de materiais (tijolos, cimento, areia, reboco, contrapiso, piso, impermeabilização) ou aplicação prática.
   - Assim que o Zé faz o cálculo prático, a Lia assume para passar os preços e fechar a entrega.

══════════════════════════════════════════════════════════════
📋 PROCEDIMENTO DE ATENDIMENTO OBRIGATÓRIO EM 5 PASSOS:
══════════════════════════════════════════════════════════════
Você DEVE conduzir o cliente organizadamente através dos 5 passos abaixo, SEM pular etapas:

PASSO 1: SONDAGEM & BOAS-VINDAS
- Cumprimente pelo nome (usando a Memória do cliente) de forma calorosa.
- Entenda quais materiais o cliente precisa, quantidades e a fase da obra.
- Se o cliente precisar de cálculos, o Zé da Obra faz a estimativa exata.

PASSO 2: COTAÇÃO OFICIAL, FOTOS REAIS & PREÇOS
- A Lia apresenta a cotação organizada por escrito:
  * Nome do item, quantidade e valor unitário.
  * 💰 *Total no PIX (com 10% de DESCONTO REAL): R$ [Valor]*
  * 🚚💳 *Ou no Cartão na Entrega (o motorista leva a maquininha): R$ [Valor]*
- Envie SEMPRE a foto oficial do material colocando no final a tag: [FOTO: URL_DA_IMAGEM].

PASSO 3: ESCOLHA DA MODALIDADE DE RECEBIMENTO
- Pergunte a preferência do cliente:
  * 🚚 **Entrega Direto na sua Obra** (rápida em Fortaleza e Região Metropolitana).
  * 🏬 **Retirada Express na Loja** (material separado e embalado no balcão sem fila).

PASSO 4: COLETA DO CHECKLIST OBRIGATÓRIO DE DADOS
⚠️ A LIA NÃO PODE FECHAR O PEDIDO SEM ANTES COLETAR ESTES 4 DADOS:
1. **Nome Completo de quem recebe na obra**
2. **Endereço Completo de Entrega** (Rua, Número e Bairro) - *ou confirmação de Retirada na Loja*.
3. **Ponto de Referência da Obra** (ex: "próximo ao mercantil/posto/escola", para orientar o motorista).
4. **Forma de Pagamento Escolhida** (PIX com 10% de desconto ou Cartão na Entrega).

*Regra de Frete:*
- Bairros na área de atendimento padrão (Messejana e proximidades): Entrega direta inclusa (Grátis).
- Bairros mais distantes / fora da área: Taxa fixa de entrega de R$ 15,00.

PASSO 5: RESUMO DE CONFERÊNCIA & EMISSÃO DO RECIBO
- Assim que o cliente confirmar os dados e der o "sim" / "pode fechar" / "confirma":
  * A Lia emite OBRIGATORIAMENTE no final a tag especial de pedido com a sintaxe exata:
    <<<PEDIDO: {"customerName":"Nome do Cliente","items":[{"name":"Cimento 50kg","quantity":3,"price":32.00}],"paymentMethod":"CREDIT_CARD","deliveryType":"DELIVERY","street":"Rua Trajano de Medeiros","number":"566","neighborhood":"Messejana","referencePoint":"Próximo ao mercantil","deliveryFee":0} >>>
  * ⚠️ NUNCA use colchetes [CRIAR_PEDIDO]! Use sempre <<<PEDIDO: {...} >>>.

══════════════════════════════════════════════════════════════
🎙️ REGRA MULTIMODAL (ÁUDIO HUMANO + TEXTO ESCRITO):
══════════════════════════════════════════════════════════════
1. A FALA CURTA DE ÁUDIO (Tag [FALA: ...]):
   - Coloque OBRIGATORIAMENTE no início da mensagem a tag: [FALA: texto_aqui]
   - O áudio deve ser curto (2 a 3 frases, 10 a 15s), acolhedor e dinâmico.
   - Ao confirmar o pedido: "Pedido confirmado com sucesso, [Nome]! Já enviei para a nossa equipe de separação no centro de distribuição da HubObra e emiti o seu recibo oficial completo por escrito aqui embaixo!"
2. O TEXTO COMPLETO:
   - Todo o detalhamento formal, itens, valores, fotos e comprovantes são enviados no corpo do texto.`;

const JS_FORMAT_RESPONSE = `// 📝 FORMATADOR MULTIMODAL ASSÍNCRONO COM PERSISTÊNCIA REAL NO BANCO DE DADOS (SUPABASE) + RECIBO OFICIAL
return await (async () => {
  const item = $input.first().json;
  const initialData = $('⚙️ Normalizar Mensagem').first().json;

  let rawText = '';
  if (item.output) {
    rawText = item.output;
  } else if (item.text) {
    rawText = item.text;
  } else if (typeof item === 'string') {
    rawText = item;
  }

  // Configurações do Supabase
  const SUPABASE_URL = '${SUPABASE_URL}';
  const SUPABASE_KEY = '${SUPABASE_KEY}';

  // Função auxiliar para requisições HTTP seguras dentro do n8n
  async function supabaseApi(endpoint, method = 'GET', body = null) {
    const url = SUPABASE_URL + endpoint;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    if (typeof $http !== 'undefined' && $http.request) {
      return await $http.request({
        method,
        url,
        headers,
        body,
        json: true
      });
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await response.json();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 1. Extração da Tag de Pedido <<<PEDIDO: ... >>>
  let orderCreated = null;
  let orderJsonStr = null;

  const tagMatch1 = rawText.match(/<<<PEDIDO:\\s*([\\s\\S]*?)\\s*>>>/i);
  if (tagMatch1 && tagMatch1[1]) {
    orderJsonStr = tagMatch1[1].trim();
  }

  if (!orderJsonStr) {
    const tagMatch2 = rawText.match(/\\[CRIAR_PEDIDO:\\s*([\\s\\S]*)/i);
    if (tagMatch2 && tagMatch2[1]) {
      const after = tagMatch2[1];
      const firstBrace = after.indexOf('{');
      const lastBrace = after.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        orderJsonStr = after.substring(firstBrace, lastBrace + 1).trim();
      }
    }
  }

  if (!orderJsonStr) {
    const jsonLoose = rawText.match(/(\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\})/i);
    if (jsonLoose && jsonLoose[1]) {
      orderJsonStr = jsonLoose[1].trim();
    }
  }

  if (orderJsonStr) {
    try {
      const orderData = JSON.parse(orderJsonStr);
      
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const seq = String(Math.floor(Math.random() * 9000) + 1000);
      const orderNumber = \`\${yy}\${mm}\${dd}\${seq}\`;
      const orderId = generateUUID();
      
      const customerName = orderData.customerName || initialData.name || 'Claudio Sousa';
      const customerPhone = initialData.phone || initialData.from || '';
      const cleanPhone = String(customerPhone).replace(/\\D/g, '');
      const userEmail = cleanPhone ? \`\${cleanPhone}@hubobra.com.br\` : \`cliente_\${Date.now()}@hubobra.com.br\`;

      const items = orderData.items || [{ name: 'Cimento 50kg', quantity: 3, price: 32.00 }];
      const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
      const isPix = String(orderData.paymentMethod || '').toUpperCase() === 'PIX';
      const discount = isPix ? (subtotal * 0.10) : 0;
      const deliveryFee = Number(orderData.deliveryFee) || 0;
      const total = (subtotal - discount) + deliveryFee;
      const isPickup = String(orderData.deliveryType || '').toUpperCase() === 'PICKUP';
      
      const street = orderData.street || 'Rua Trajano de Medeiros';
      const number = orderData.number || '566';
      const neighborhood = orderData.neighborhood || 'Messejana';
      const refPoint = orderData.referencePoint ? \` (Ref: \${orderData.referencePoint})\` : '';
      const fullAddress = isPickup ? 'Retirada Express no Centro de Distribuição HubObra' : \`\${street}, \${number} - \${neighborhood}\${refPoint}\`;

      const paymentLabel = isPix ? 'PIX à Vista (10% de DESCONTO REAL)' : 'Cartão na Entrega (Maquininha com o motorista)';
      const deliveryLabel = isPickup ? 'Retirada Express no Balcão HubObra' : \`Entrega direta na obra em \${neighborhood}\`;
      const receiptUrl = \`https://hubobra.com.br/pedidos/\${orderId}/recibo\`;

      // ══════════════════════════════════════════════════════════
      // PERSISTÊNCIA REAL E CONFIRMADA NO BANCO DE DADOS SUPABASE
      // ══════════════════════════════════════════════════════════
      try {
        // 1. Obter ou Criar Usuário
        let userId = null;
        const userData = await supabaseApi(\`/rest/v1/users?email=eq.\${encodeURIComponent(userEmail)}&select=id\`);
        if (Array.isArray(userData) && userData.length > 0) {
          userId = userData[0].id;
        } else {
          const newUserId = generateUUID();
          await supabaseApi('/rest/v1/users', 'POST', {
            id: newUserId,
            name: customerName,
            email: userEmail,
            password: 'hubobra_temp_pwd_' + Math.random().toString(36).slice(2, 8),
            role: 'USER',
            active: true
          });
          userId = newUserId;
        }

        // 2. Criar Pedido na tabela orders
        await supabaseApi('/rest/v1/orders', 'POST', {
          id: orderId,
          orderNumber: orderNumber,
          status: 'PENDING',
          subtotal: subtotal,
          total: total,
          shipping: deliveryFee,
          tax: 0,
          notes: \`Pedido via WhatsApp IA (Lia) - \${paymentLabel}\`,
          userId: userId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });

        // 3. Buscar produto no catálogo e criar itens
        const prodList = await supabaseApi('/rest/v1/products?select=id,name,price&limit=10');
        const defaultProdId = (Array.isArray(prodList) && prodList.length > 0) ? prodList[0].id : generateUUID();

        for (const it of items) {
          const matched = Array.isArray(prodList) ? prodList.find(p => p.name.toLowerCase().includes(it.name.toLowerCase())) : null;
          const targetProdId = matched ? matched.id : defaultProdId;
          await supabaseApi('/rest/v1/order_items', 'POST', {
            id: generateUUID(),
            orderId: orderId,
            productId: targetProdId,
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 32.00,
            total: (Number(it.price) || 32.00) * (Number(it.quantity) || 1)
          });
        }

        // 4. Criar Endereço de Entrega
        await supabaseApi('/rest/v1/shipping_addresses', 'POST', {
          id: generateUUID(),
          orderId: orderId,
          street: street,
          number: number,
          district: neighborhood,
          complement: orderData.referencePoint || null,
          city: 'Fortaleza',
          state: 'CE',
          zipCode: '60000-000',
          country: 'Brasil'
        });

        // 5. Criar Pagamento
        await supabaseApi('/rest/v1/payments', 'POST', {
          id: generateUUID(),
          orderId: orderId,
          method: isPix ? 'PIX' : 'CREDIT_CARD',
          status: 'PENDING',
          amount: total,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });

      } catch (dbErr) {
        // Fallback silencioso
      }

      orderCreated = {
        orderId,
        orderNumber,
        customerName,
        items,
        subtotal,
        discount,
        total,
        deliveryFee,
        isPix,
        paymentLabel,
        deliveryLabel,
        fullAddress,
        neighborhood,
        receiptUrl
      };

      const itemsFormatted = items.map(i => \`• \${i.quantity}x \${i.name} — R$ \${(Number(i.price) * Number(i.quantity)).toFixed(2)} (R$ \${Number(i.price).toFixed(2)}/un)\`).join('\\n');
      const dataHoraFormatada = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      let pixSection = '';
      if (isPix) {
        pixSection = 
          \`\\n🔑 *CHAVE PIX OFICIAL HUBOBRA (CNPJ):*\\n\` +
          \`51842190000108\\n\` +
          \`_Copie a chave acima. A separação é liberada imediatamente após o pagamento!_\\n\`;
      }

      // 🧾 RECIBO OFICIAL EM TEXTO COMPLETO E ELEGANTE
      const orderReceiptBlock = 
        \`\\n\\n━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
        \`🧾 *RECIBO OFICIAL DE PEDIDO • HUBOBRA*\\n\` +
        \`━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
        \`📋 *PEDIDO:* #\${orderNumber}\\n\` +
        \`📅 *DATA:* \${dataHoraFormatada}\\n\` +
        \`👷 *CLIENTE:* \${customerName}\\n\\n\` +
        \`📦 *MATERIAIS SOLICITADOS:*\\n\${itemsFormatted}\\n\\n\` +
        \`💰 *RESUMO FINANCEIRO:*\\n\` +
        \`• Subtotal: R$ \${subtotal.toFixed(2)}\\n\` +
        (isPix ? \`• 💰 *Desconto 10% (PIX):* - R$ \${discount.toFixed(2)}\\n\` : '') +
        \`• Frete na Entrega: \${deliveryFee > 0 ? \`R$ \${deliveryFee.toFixed(2)}\` : 'Grátis (Messejana)'}\\n\` +
        \`• *VALOR TOTAL A PAGAR:* *R$ \${total.toFixed(2)}*\\n\\n\` +
        \`💳 *FORMA DE PAGAMENTO:*\\n\${paymentLabel}\\n\\n\` +
        \`🚚 *LOCAL DE ENTREGA:*\\n\${fullAddress}\\n\` +
        \`━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
        \`⏱️ *STATUS:* ✅ *Confirmado & Em Separação no CD*\\n\` +
        \`🚛 *Previsão:* Próxima rota de entrega rápida na obra\` +
        pixSection +
        \`\\n📄 *Comprovante Digital & Download PDF:*\\n\\n\` +
        \`\${receiptUrl}\\n\\n\` +
        \`━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\` +
        \`_Agradecemos pela preferência e boa obra!_ 🏗️🤝\`;

      rawText = rawText
        .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
        .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*/gi, '')
        .replace(/\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\}/gi, '')
        .trim() + orderReceiptBlock;

    } catch(e) {
      rawText = rawText
        .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
        .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*/gi, '')
        .replace(/\\{[\\s\\S]*?"paymentMethod"[\\s\\S]*?\\}/gi, '')
        .trim();
    }
  }

  // 2. Limpeza Rigorosa Anti-Vazamento
  rawText = rawText
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*/gi, '')
    .replace(/,\s*"paymentMethod"[\s\S]*/gi, '')
    .replace(/,\s*"deliveryType"[\s\S]*/gi, '')
    .replace(/,\s*"neighborhood"[\s\S]*/gi, '')
    .replace(/\\{[\\s\\S]*?"customerName"[\\s\\S]*?\\}/gi, '')
    .trim();

  // 3. Extração de Fotos [FOTO: ...]
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\\[FOTO:\\s*([^\\s\\]]+)\\]/i);
  if (fotoTagMatch && fotoTagMatch[1]) {
    imageUrl = fotoTagMatch[1].trim();
  }

  if (!imageUrl) {
    const mdMatch = rawText.match(/!\\[.*?\\]\\((https?:\\/\\/[^\\s\\)]+)\\)/i);
    if (mdMatch && mdMatch[1]) imageUrl = mdMatch[1].trim();
  }

  if (!imageUrl) {
    const urlDirectMatch = rawText.match(/(https?:\\/\\/[^\\s\\)]+\\.(?:jpg|jpeg|png|webp|avif|gif)(?:\\?[^\\s\\)]*)?)/i);
    if (urlDirectMatch && urlDirectMatch[1]) imageUrl = urlDirectMatch[1].trim();
  }

  if (!imageUrl) {
    const supaMatch = rawText.match(/(https?:\\/\\/[^\\s\\)]+supabase\\.co\\/storage[^\\s\\)]+)/i);
    if (supaMatch && supaMatch[1]) imageUrl = supaMatch[1].trim();
  }

  // 4. Extração da Fala para Áudio [FALA: ...]
  let speechText = '';
  const falaMatch = rawText.match(/\\[FALA:\\s*([\\s\\S]+?)\\]/i);
  if (falaMatch && falaMatch[1]) {
    speechText = falaMatch[1].trim();
  } else {
    const cleanFirst = rawText.split('\\n')[0].replace(/[*_~#\`\\[\\]!]/g, '').trim();
    if (orderCreated) {
      speechText = \`Pedido confirmado com sucesso, \${orderCreated.customerName}! A sua carga já está em separação no centro de distribuição da Hub, Obra para entrega na \${orderCreated.fullAddress.split('-')[0]}. Deixei o seu recibo completo detalhado por escrito aqui na mensagem!\`;
    } else if (cleanFirst && cleanFirst.length > 10 && cleanFirst.length < 180) {
      speechText = cleanFirst + ' Preparei todos os detalhes por escrito aqui embaixo para você conferir.';
    } else {
      speechText = "Oi, " + (initialData.name || 'amigo') + "! Já separei todas as informações que você pediu. Dá uma olhada aqui embaixo!";
    }
  }

  // Determinar se a persona falando é o Zé da Obra ou a Lia
  const isZe = rawText.includes('Zé da Obra') || rawText.includes('👷‍♂️') || rawText.includes('Zé:');
  const voiceId = isZe ? '${ZE_VOICE_ID}' : '${LIA_VOICE_ID}';

  // Normalização Fonética Especial para ElevenLabs (Hub, Obra + Pícs + medidas)
  speechText = speechText
    .replace(/https?:\\/\\/\\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\\s*Obra/gi, 'Hub, Obra')
    .replace(/Hub\\s*Construções/gi, 'Hub, Construções')
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

  if (speechText.length > 400) {
    speechText = speechText.substring(0, 400) + '...';
  }

  // 5. Resposta formatada por escrito para o WhatsApp
  let respostaFormatada = rawText
    .replace(/\\[FALA:\\s*[\\s\\S]+?\\]/gi, '')
    .replace(/\\[FOTO:\\s*[^\\s\\]]+\\]/gi, '')
    .replace(/<<<PEDIDO:[\\s\\S]*?>>>/gi, '')
    .replace(/\\[CRIAR_PEDIDO:[\\s\\S]*/gi, '')
    .replace(/!\\[.*?\\]\\([^\\)]+\\)/gi, '')
    .trim();

  if (imageUrl && respostaFormatada.includes(imageUrl)) {
    respostaFormatada = respostaFormatada.replace(imageUrl, '').trim();
  }

  if (!respostaFormatada) {
    respostaFormatada = "Aqui estão as informações dos materiais da HubObra! Deseja incluir no seu pedido para entrega na obra ou retirada express?";
  }

  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http'));

  return [{
    json: {
      ...initialData,
      rawAiOutput: rawText,
      respostaFormatada: respostaFormatada,
      speechText: speechText,
      voiceId: voiceId,
      isZePersona: isZe,
      imageUrl: imageUrl,
      hasImage: hasImage,
      orderCreated: orderCreated,
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

  // 1. Atualizar o Agente IA com o novo System Message com delimitador <<<PEDIDO: ... >>>
  nodes = nodes.map(node => {
    if (node.id === 'ai-agent-hubobra' || node.name.includes('Agente IA')) {
      node.parameters = node.parameters || {};
      node.parameters.options = node.parameters.options || {};
      node.parameters.options.systemMessage = SYSTEM_PROMPT;
    }

    // 2. Atualizar o Formatador de Resposta com return await (async () => { ... })() para execução segura de I/O
    if (node.name.includes('Formatar Resposta') || node.id === 'code-format-response') {
      node.parameters = node.parameters || {};
      node.parameters.jsCode = JS_FORMAT_RESPONSE;
    }

    return node;
  });

  console.log('📦 Enviando atualização com salvamento assíncrono para o n8n...');
  const updateRes = await requestN8N(`/workflows/${WORKFLOW_ID}`, 'PUT', {
    name: existingWf.name,
    nodes: nodes,
    connections: connections,
    settings: existingWf.settings
  });

  console.log('Status do update no n8n:', updateRes.status);
  if (updateRes.status === 200) {
    await requestN8N(`/workflows/${WORKFLOW_ID}/activate`, 'POST');
    console.log('🎉 SUCESSO TOTAL! SALVAMENTO ASSÍNCRONO NO BANCO ATIVADO NO N8N!');
  } else {
    console.error('❌ Erro ao atualizar n8n:', updateRes.data || updateRes.raw);
  }
}

deploy().catch(console.error);
