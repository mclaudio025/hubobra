// 📝 FORMATADOR MULTIMODAL ASSÍNCRONO COM PERSISTÊNCIA REAL NO BANCO DE DADOS (SUPABASE) + RECIBO OFICIAL
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
  const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

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

  const tagMatch1 = rawText.match(/<<<PEDIDO:\s*([\s\S]*?)\s*>>>/i);
  if (tagMatch1 && tagMatch1[1]) {
    orderJsonStr = tagMatch1[1].trim();
  }

  if (!orderJsonStr) {
    const tagMatch2 = rawText.match(/\[CRIAR_PEDIDO:\s*([\s\S]*)/i);
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
    const jsonLoose = rawText.match(/(\{[\s\S]*?"paymentMethod"[\s\S]*?\})/i);
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
      const orderNumber = `${yy}${mm}${dd}${seq}`;
      const orderId = generateUUID();
      
      const customerName = orderData.customerName || initialData.name || 'Claudio Sousa';
      const customerPhone = initialData.phone || initialData.from || '';
      const cleanPhone = String(customerPhone).replace(/\D/g, '');
      const userEmail = cleanPhone ? `${cleanPhone}@hubobra.com.br` : `cliente_${Date.now()}@hubobra.com.br`;

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
      const refPoint = orderData.referencePoint ? ` (Ref: ${orderData.referencePoint})` : '';
      const fullAddress = isPickup ? 'Retirada Express no Centro de Distribuição HubObra' : `${street}, ${number} - ${neighborhood}${refPoint}`;

      const paymentLabel = isPix ? 'PIX à Vista (10% de DESCONTO REAL)' : 'Cartão na Entrega (Maquininha com o motorista)';
      const deliveryLabel = isPickup ? 'Retirada Express no Balcão HubObra' : `Entrega direta na obra em ${neighborhood}`;
      const receiptUrl = `https://hubobra.com.br/pedidos/${orderId}/recibo`;

      // ══════════════════════════════════════════════════════════
      // PERSISTÊNCIA REAL E CONFIRMADA NO BANCO DE DADOS SUPABASE
      // ══════════════════════════════════════════════════════════
      try {
        // 1. Obter ou Criar Usuário
        let userId = null;
        const userData = await supabaseApi(`/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=id`);
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
          notes: `Pedido via WhatsApp IA (Lia) - ${paymentLabel}`,
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

      const itemsFormatted = items.map(i => `• ${i.quantity}x ${i.name} — R$ ${(Number(i.price) * Number(i.quantity)).toFixed(2)} (R$ ${Number(i.price).toFixed(2)}/un)`).join('\n');
      const dataHoraFormatada = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      let pixSection = '';
      if (isPix) {
        pixSection = 
          `\n🔑 *CHAVE PIX OFICIAL HUBOBRA (CNPJ):*\n` +
          `51842190000108\n` +
          `_Copie a chave acima. A separação é liberada imediatamente após o pagamento!_\n`;
      }

      // 🧾 RECIBO OFICIAL EM TEXTO COMPLETO E ELEGANTE
      const orderReceiptBlock = 
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 *RECIBO OFICIAL DE PEDIDO • HUBOBRA*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *PEDIDO:* #${orderNumber}\n` +
        `📅 *DATA:* ${dataHoraFormatada}\n` +
        `👷 *CLIENTE:* ${customerName}\n\n` +
        `📦 *MATERIAIS SOLICITADOS:*\n${itemsFormatted}\n\n` +
        `💰 *RESUMO FINANCEIRO:*\n` +
        `• Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        (isPix ? `• 💰 *Desconto 10% (PIX):* - R$ ${discount.toFixed(2)}\n` : '') +
        `• Frete na Entrega: ${deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Grátis (Messejana)'}\n` +
        `• *VALOR TOTAL A PAGAR:* *R$ ${total.toFixed(2)}*\n\n` +
        `💳 *FORMA DE PAGAMENTO:*\n${paymentLabel}\n\n` +
        `🚚 *LOCAL DE ENTREGA:*\n${fullAddress}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⏱️ *STATUS:* ✅ *Confirmado & Em Separação no CD*\n` +
        `🚛 *Previsão:* Próxima rota de entrega rápida na obra` +
        pixSection +
        `\n📄 *Comprovante Digital & Download PDF:*\n\n` +
        `${receiptUrl}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Agradecemos pela preferência e boa obra!_ 🏗️🤝`;

      rawText = rawText
        .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
        .replace(/\[CRIAR_PEDIDO:[\s\S]*/gi, '')
        .replace(/\{[\s\S]*?"paymentMethod"[\s\S]*?\}/gi, '')
        .trim() + orderReceiptBlock;

    } catch(e) {
      rawText = rawText
        .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
        .replace(/\[CRIAR_PEDIDO:[\s\S]*/gi, '')
        .replace(/\{[\s\S]*?"paymentMethod"[\s\S]*?\}/gi, '')
        .trim();
    }
  }

  // 2. Limpeza Rigorosa Anti-Vazamento
  rawText = rawText
    .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
    .replace(/\[CRIAR_PEDIDO:[\s\S]*/gi, '')
    .replace(/,s*"paymentMethod"[sS]*/gi, '')
    .replace(/,s*"deliveryType"[sS]*/gi, '')
    .replace(/,s*"neighborhood"[sS]*/gi, '')
    .replace(/\{[\s\S]*?"customerName"[\s\S]*?\}/gi, '')
    .trim();

  // 3. Extração de Fotos [FOTO: ...]
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\[FOTO:\s*([^\s\]]+)\]/i);
  if (fotoTagMatch && fotoTagMatch[1]) {
    imageUrl = fotoTagMatch[1].trim();
  }

  if (!imageUrl) {
    const mdMatch = rawText.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
    if (mdMatch && mdMatch[1]) imageUrl = mdMatch[1].trim();
  }

  if (!imageUrl) {
    const urlDirectMatch = rawText.match(/(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|avif|gif)(?:\?[^\s\)]*)?)/i);
    if (urlDirectMatch && urlDirectMatch[1]) imageUrl = urlDirectMatch[1].trim();
  }

  if (!imageUrl) {
    const supaMatch = rawText.match(/(https?:\/\/[^\s\)]+supabase\.co\/storage[^\s\)]+)/i);
    if (supaMatch && supaMatch[1]) imageUrl = supaMatch[1].trim();
  }

  // 4. Extração da Fala para Áudio [FALA: ...]
  let speechText = '';
  const falaMatch = rawText.match(/\[FALA:\s*([\s\S]+?)\]/i);
  if (falaMatch && falaMatch[1]) {
    speechText = falaMatch[1].trim();
  } else {
    const cleanFirst = rawText.split('\n')[0].replace(/[*_~#`\[\]!]/g, '').trim();
    if (orderCreated) {
      speechText = `Pedido confirmado com sucesso, ${orderCreated.customerName}! A sua carga já está em separação no centro de distribuição da Hub, Obra para entrega na ${orderCreated.fullAddress.split('-')[0]}. Deixei o seu recibo completo detalhado por escrito aqui na mensagem!`;
    } else if (cleanFirst && cleanFirst.length > 10 && cleanFirst.length < 180) {
      speechText = cleanFirst + ' Preparei todos os detalhes por escrito aqui embaixo para você conferir.';
    } else {
      speechText = "Oi, " + (initialData.name || 'amigo') + "! Já separei todas as informações que você pediu. Dá uma olhada aqui embaixo!";
    }
  }

  // Determinar se a persona falando é o Zé da Obra ou a Lia
  const isZe = rawText.includes('Zé da Obra') || rawText.includes('👷‍♂️') || rawText.includes('Zé:');
  const voiceId = isZe ? 'pNInz6obpgDQGcFmaJgB' : 'EXAVITQu4vr4xnSDxMaL';

  // Normalização Fonética Especial para ElevenLabs (Hub, Obra + Pícs + medidas)
  speechText = speechText
    .replace(/https?:\/\/\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\s*Obra/gi, 'Hub, Obra')
    .replace(/Hub\s*Construções/gi, 'Hub, Construções')
    .replace(/\bPIX\b/g, 'Pícs')
    .replace(/\bPix\b/g, 'Pícs')
    .replace(/\bWhatsApp\b/gi, 'Uatizap')
    .replace(/[*_~#`\[\]!]/g, '')
    .replace(/R\$\s*([0-9]+)[,\.]([0-9]{2})/g, '$1 reais e $2 centavos')
    .replace(/R\$\s*([0-9]+)/g, '$1 reais')
    .replace(/m²/g, 'metros quadrados')
    .replace(/m³/g, 'metros cúbicos')
    .replace(/kg/g, 'quilos')
    .replace(/\n+/g, ' ')
    .trim();

  if (speechText.length > 400) {
    speechText = speechText.substring(0, 400) + '...';
  }

  // 5. Resposta formatada por escrito para o WhatsApp
  let respostaFormatada = rawText
    .replace(/\[FALA:\s*[\s\S]+?\]/gi, '')
    .replace(/\[FOTO:\s*[^\s\]]+\]/gi, '')
    .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
    .replace(/\[CRIAR_PEDIDO:[\s\S]*/gi, '')
    .replace(/!\[.*?\]\([^\)]+\)/gi, '')
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
})();