// 🎯 PROCESSAR RESPOSTA DA IA (EXTRATOR MULTIMODAL + GERADOR DE PDF NATIVO + SUPABASE + UAZAPI)
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const aiResult = $input.first().json;

const rawText = aiResult.output || aiResult.text || '';
const customerName = initialData.name || 'Cliente';
const userMessage = initialData.messageText || '';

const SUPABASE_URL = 'https://zeywqzkmevytzkdbzwni.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleXdxemttZXZ5dHprZGJ6d25pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0ODA3MywiZXhwIjoyMTA1MjI0MDczfQ.H_DTlgqQ4_2pcOUujrh6-7d0vEy4D6CgduUi1rqdpy0';

// Helper HTTP robusto (compatível com n8n this.helpers e fetch nativo)
async function httpReq(options) {
  try {
    if (typeof this !== 'undefined' && this && this.helpers && this.helpers.httpRequest) {
      return await this.helpers.httpRequest(options);
    }
  } catch(_) {}
  try {
    const res = await fetch(options.url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (options.json !== false) {
      return await res.json();
    }
    return await res.text();
  } catch(e) {
    console.warn('httpReq error:', e.message);
    return null;
  }
}

// Função de Geração de PDF Nativa em Pure JavaScript (Zero dependências externas)
function createQuotePdfBase64(quote) {
  const qNum = quote.quoteNumber || 'ORC-2026-0001';
  const cName = quote.customerName || customerName;
  const cPhone = quote.customerPhone || initialData.phone || '';
  const totalStr = 'R$ ' + (Number(quote.total) || 0).toFixed(2).replace('.', ',');
  const subtotalStr = 'R$ ' + (Number(quote.subtotal) || 0).toFixed(2).replace('.', ',');
  const discountStr = (Number(quote.discount) || 0) > 0 ? ('- R$ ' + Number(quote.discount).toFixed(2).replace('.', ',')) : '';
  const emitDate = new Date().toLocaleDateString('pt-BR');
  const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  const esc = (t) => String(t || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  const streamOps = [];

  // Barra Superior Laranja HubObra
  streamOps.push('0.92 0.35 0.05 rg 0 834 595 8 re f');

  // Cabeçalho
  streamOps.push('BT /F2 22 Tf 0.92 0.35 0.05 rg 40 795 Td (HubObra) Tj ET');
  streamOps.push('BT /F1 9 Tf 0.06 0.09 0.16 rg 40 780 Td (O Marketplace da Construcao de Fortaleza e Regiao) Tj');
  streamOps.push('0.39 0.45 0.55 rg 0 -12 Td (CNPJ: 00.000.000/0001-00 - Fortaleza - CE) Tj');
  streamOps.push('0 -12 Td (WhatsApp Oficial: \\(85\\) 98921-9126 - https://hubobra.com.br) Tj ET');

  // Box do Orçamento
  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG 380 755 175 68 re b');
  streamOps.push('BT /F2 11 Tf 0.92 0.35 0.05 rg 395 805 Td (ORCAMENTO OFICIAL) Tj');
  streamOps.push('/F2 14 Tf 0.06 0.09 0.16 rg -5 -18 Td (#' + esc(qNum) + ') Tj');
  streamOps.push('/F2 8 Tf 0.09 0.64 0.29 rg 0 -18 Td (Status: VALIDO \\(7 DIAS\\)) Tj ET');

  // Linha
  streamOps.push('0.88 0.91 0.94 RG 1 w 40 735 m 555 735 l S');

  // Box do Cliente
  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG 40 665 515 60 re b');
  streamOps.push('BT /F2 9 Tf 0.06 0.09 0.16 rg 52 710 Td (DADOS DO CLIENTE:) Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg 0 -14 Td (Nome: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(cName) + ') Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg 0 -14 Td (WhatsApp: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(cPhone) + ') Tj ET');

  streamOps.push('BT /F2 9 Tf 0.06 0.09 0.16 rg 320 710 Td (DATAS & CONDICOES:) Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg 0 -14 Td (Emissao: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(emitDate) + ') Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg 0 -14 Td (Validade: ) Tj /F2 9 Tf 0.86 0.15 0.15 rg (' + esc(validDate) + ' - 7 dias) Tj ET');

  // Tabela
  streamOps.push('BT /F2 11 Tf 0.06 0.09 0.16 rg 40 645 Td (ITENS DO ORCAMENTO) Tj ET');

  let tableY = 618;
  streamOps.push('0.92 0.35 0.05 rg 40 ' + tableY + ' 515 22 re f');
  streamOps.push('BT /F2 8.5 Tf 1 1 1 rg 45 ' + (tableY + 7) + ' Td (#) Tj 30 0 Td (DESCRICAO DO MATERIAL) Tj 235 0 Td (UN) Tj 50 0 Td (QTD) Tj 60 0 Td (VL. UNIT) Tj 65 0 Td (TOTAL) Tj ET');

  const items = quote.items || [];
  items.forEach((it, idx) => {
    tableY -= 24;
    const bg = idx % 2 === 0 ? '1 1 1 rg' : '0.97 0.98 0.99 rg';
    streamOps.push(bg + ' 0.88 0.91 0.94 RG 40 ' + tableY + ' 515 24 re b');

    const itNum = (idx + 1).toString().padStart(2, '0');
    const itName = it.name + (it.brand ? ' (' + it.brand + ')' : '');
    const itUnit = (it.unit || 'UN').toUpperCase();
    const itQty = it.quantity || 1;
    const itPrice = 'R$ ' + (Number(it.unitPrice || it.price) || 0).toFixed(2).replace('.', ',');
    const itTotal = 'R$ ' + (Number(it.total) || (Number(it.unitPrice || it.price) * itQty)).toFixed(2).replace('.', ',');

    streamOps.push('BT /F1 8.5 Tf 0.39 0.45 0.55 rg 45 ' + (tableY + 8) + ' Td (' + esc(itNum) + ') Tj ET');
    streamOps.push('BT /F2 8.5 Tf 0.06 0.09 0.16 rg 75 ' + (tableY + 8) + ' Td (' + esc(itName.substring(0, 40)) + ') Tj ET');
    streamOps.push('BT /F1 8.5 Tf 0.39 0.45 0.55 rg 310 ' + (tableY + 8) + ' Td (' + esc(itUnit) + ') Tj ET');
    streamOps.push('BT /F2 8.5 Tf 0.06 0.09 0.16 rg 360 ' + (tableY + 8) + ' Td (' + esc(itQty) + ') Tj ET');
    streamOps.push('BT /F1 8.5 Tf 0.39 0.45 0.55 rg 420 ' + (tableY + 8) + ' Td (' + esc(itPrice) + ') Tj ET');
    streamOps.push('BT /F2 8.5 Tf 0.06 0.09 0.16 rg 485 ' + (tableY + 8) + ' Td (' + esc(itTotal) + ') Tj ET');
  });

  tableY -= 125;
  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG 40 ' + tableY + ' 300 110 re b');
  streamOps.push('BT /F2 9 Tf 0.06 0.09 0.16 rg 52 ' + (tableY + 92) + ' Td (CONDICOES COMERCIAIS & OBSERVACOES:) Tj ET');
  streamOps.push('BT /F1 8 Tf 0.39 0.45 0.55 rg');
  streamOps.push('52 ' + (tableY + 76) + ' Td (- Precos especiais com desconto a vista via PIX.) Tj');
  streamOps.push('0 -12 Td (- Aceitamos Cartoes de Credito em ate 12x.) Tj');
  streamOps.push('0 -12 Td (- Entrega rapida e programada para Fortaleza e regiao.) Tj');
  streamOps.push('0 -12 Td (- Para fechar este pedido, responda a Lia no WhatsApp.) Tj');
  if (quote.notes) {
    streamOps.push('0 -14 Td /F2 8 Tf 0.92 0.35 0.05 rg (Obs: ' + esc(quote.notes.substring(0, 50)) + ') Tj');
  }
  streamOps.push('ET');

  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG 355 ' + tableY + ' 200 110 re b');
  streamOps.push('BT /F1 9 Tf 0.39 0.45 0.55 rg 370 ' + (tableY + 90) + ' Td (Subtotal dos Itens:) Tj /F2 9 Tf 0.06 0.09 0.16 rg 95 0 Td (' + esc(subtotalStr) + ') Tj ET');
  if (discountStr) {
    streamOps.push('BT /F1 9 Tf 0.09 0.64 0.29 rg 370 ' + (tableY + 72) + ' Td (Desconto PIX:) Tj /F2 9 Tf 105 0 Td (' + esc(discountStr) + ') Tj ET');
  }
  streamOps.push('0.92 0.35 0.05 rg 365 ' + (tableY + 12) + ' 180 30 re f');
  streamOps.push('BT /F2 10 Tf 1 1 1 rg 375 ' + (tableY + 23) + ' Td (TOTAL GERAL:) Tj /F2 12 Tf 80 0 Td (' + esc(totalStr) + ') Tj ET');

  streamOps.push('0.88 0.91 0.94 RG 0.5 w 40 45 m 555 45 l S');
  streamOps.push('BT /F1 7.5 Tf 0.39 0.45 0.55 rg 110 32 Td (HubObra - Marketplace de Materiais de Construcao - www.hubobra.com.br) Tj ET');
  streamOps.push('BT /F1 7 Tf 0.39 0.45 0.55 rg 135 20 Td (Documento gerado automaticamente pela Consultora Virtual Lia) Tj ET');

  const contentStream = streamOps.join('\n');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  objects.push('4 0 obj\n<< /Length ' + Buffer.byteLength(contentStream, 'utf-8') + ' >>\nstream\n' + contentStream + '\nendstream\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  let header = '%PDF-1.4\n';
  let offsets = [];
  let body = '';
  let currentOffset = header.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset + body.length);
    body += objects[i] + '\n';
  }

  let xrefOffset = header.length + body.length;
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n';
  xref += '0000000000 65535 f \n';
  for (let i = 0; i < offsets.length; i++) {
    xref += (offsets[i] + '').padStart(10, '0') + ' 00000 n \n';
  }

  let trailer = 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';

  const fullPdfStr = header + body + xref + trailer;
  return 'data:application/pdf;base64,' + Buffer.from(fullPdfStr, 'utf-8').toString('base64');
}

return (async () => {
  const senderPhone = (initialData.phone || initialData.from || '').replace(/\D/g, '');
  const last8 = senderPhone.slice(-8);
  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  // 1. Processar Tag de Orçamento <<<ORCAMENTO: ... >>>
  let activeQuote = null;
  const quoteTagMatch = rawText.match(/<<<ORCAMENTO:\s*([\s\S]*?)>>>/i);
  if (quoteTagMatch && quoteTagMatch[1]) {
    try {
      const quoteData = JSON.parse(quoteTagMatch[1].trim());
      const quoteNumber = 'ORC-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-4);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      let subtotal = 0;
      const itemsFormatted = (quoteData.items || []).map(i => {
        const qty = Number(i.quantity) || 1;
        const price = Number(i.unitPrice || i.price) || 0;
        const total = qty * price;
        subtotal += total;
        return {
          name: i.name,
          brand: i.brand || null,
          unit: i.unit || 'UN',
          quantity: qty,
          unitPrice: price,
          total: total
        };
      });

      const total = Math.max(0, subtotal - (Number(quoteData.discount) || 0) + (Number(quoteData.shipping) || 0));

      const quoteInsert = await httpReq({
        url: SUPABASE_URL + '/rest/v1/quotes',
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'return=representation' },
        body: {
          quoteNumber: quoteNumber,
          status: 'OPEN',
          customerName: quoteData.customerName || customerName,
          customerPhone: senderPhone,
          customerEmail: quoteData.customerEmail || null,
          subtotal: subtotal,
          discount: Number(quoteData.discount) || 0,
          shipping: Number(quoteData.shipping) || 0,
          total: total,
          validUntil: validUntil.toISOString(),
          notes: quoteData.notes || 'Orçamento gerado via WhatsApp pela Lia'
        },
        json: true
      });

      if (Array.isArray(quoteInsert) && quoteInsert[0]) {
        activeQuote = quoteInsert[0];
        activeQuote.items = itemsFormatted;

        if (itemsFormatted.length > 0) {
          const itemsPayload = itemsFormatted.map(item => ({
            quoteId: activeQuote.id,
            name: item.name,
            brand: item.brand,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }));

          await httpReq({
            url: SUPABASE_URL + '/rest/v1/quote_items',
            method: 'POST',
            headers: supaHeaders,
            body: itemsPayload,
            json: true
          });
        }
        console.log('🎉 Novo orçamento salvo:', activeQuote.quoteNumber, 'Total:', total);
      }
    } catch(err) {
      console.warn('Erro ao salvar orçamento:', err.message);
    }
  }

  // 2. Verificar se o cliente solicitou PDF (ou se a tag [GERAR_PDF] veio da IA)
  const userAskedPdf = /(?:pdf|arquivo|documento|gerar\s+pdf|mandar\s+pdf|manda\s+em\s+pdf|tem\s+pdf|envia\s+o\s+pdf|manda\s+o\s+pdf)/i.test(userMessage) || rawText.includes('[GERAR_PDF]');

  let pdfDataUri = null;
  let pdfDocName = null;

  if (userAskedPdf) {
    try {
      // Se não temos activeQuote deste turno, busca o mais recente em aberto no Supabase
      if (!activeQuote && last8) {
        const recentQuotes = await httpReq({
          url: SUPABASE_URL + '/rest/v1/quotes?customerPhone=like.*' + last8 + '*&status=eq.OPEN&order=createdAt.desc&limit=1&select=id,quoteNumber,customerName,customerPhone,subtotal,discount,shipping,total,notes',
          method: 'GET',
          headers: supaHeaders,
          json: true
        });

        if (Array.isArray(recentQuotes) && recentQuotes.length > 0) {
          activeQuote = recentQuotes[0];
          // Buscar itens
          const qItems = await httpReq({
            url: SUPABASE_URL + '/rest/v1/quote_items?quoteId=eq.' + activeQuote.id + '&select=name,brand,unit,quantity,unitPrice,total',
            method: 'GET',
            headers: supaHeaders,
            json: true
          });
          activeQuote.items = Array.isArray(qItems) ? qItems : [];
        }
      }

      if (activeQuote && activeQuote.items && activeQuote.items.length > 0) {
        pdfDataUri = createQuotePdfBase64(activeQuote);
        pdfDocName = 'Orcamento_HubObra_' + activeQuote.quoteNumber + '.pdf';
        console.log('📄 PDF gerado com sucesso para envio:', pdfDocName);
      }
    } catch(pdfErr) {
      console.warn('Erro na geração de PDF:', pdfErr.message);
    }
  }

  // 3. Extração de Foto (caso o cliente tenha pedido foto)
  const userAskedPhoto = /(?:foto|fotos|imagem|imagens|como\s+ele\s+(é|parece)|como\s+ela\s+(é|parece)|quero\s+ver|manda\s+ver)/i.test(userMessage);
  let imageUrl = null;
  const fotoTagMatch = rawText.match(/\[FOTO:\s*([^\s\]]+)\]/i);
  const mdImgMatch = rawText.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
  const rawImgMatch = rawText.match(/(https?:\/\/[^\s\(\)\[\]\"\'\<\>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\(\)\[\]\"\'\<\>]*)?)/i);

  if (userAskedPhoto || fotoTagMatch) {
    if (fotoTagMatch && fotoTagMatch[1]) imageUrl = fotoTagMatch[1].trim();
    else if (mdImgMatch && mdImgMatch[1]) imageUrl = mdImgMatch[1].trim();
    else if (rawImgMatch && rawImgMatch[1]) imageUrl = rawImgMatch[1].trim();

    // Se o cliente pediu foto explicitamente e a URL não veio no texto da IA, busca no estoque
    if (!imageUrl && userAskedPhoto) {
      try {
        const stockNode = $('📦 Buscar Estoque em Tempo Real (Supabase)').all();
        if (stockNode && stockNode.length > 0) {
          for (const item of stockNode) {
            const p = item.json;
            if (p && p.name) {
              const pNameLower = p.name.toLowerCase();
              const words = pNameLower.split(/\s+/).filter(w => w.length > 3 && !['para', 'com', 'todos', 'todas', 'obras', 'metro', 'metros'].includes(w));
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

  // 4. Roteamento de Mídia Unificado
  const hasPdf = Boolean(pdfDataUri);
  const hasImage = Boolean(imageUrl && imageUrl.startsWith('http') && (userAskedPhoto || fotoTagMatch));
  const hasMedia = hasPdf || hasImage;

  const mediaUrl = hasPdf ? pdfDataUri : (hasImage ? imageUrl : null);
  const mediaType = hasPdf ? 'document' : (hasImage ? 'image' : null);
  const docName = hasPdf ? pdfDocName : null;

  // 5. Detectar se é Orçamento / Relatório
  const hasMultipleBullets = (rawText.match(/[•\-\+]\s+/g) || []).length >= 2;
  const hasBudgetKeywords = rawText.includes('Orçamento') || rawText.includes('Total:') || rawText.includes('subtotal') || rawText.includes('<<<PEDIDO:') || rawText.includes('<<<ORCAMENTO:');
  const isBudgetOrList = hasMultipleBullets || hasBudgetKeywords;

  // 6. Extração da Fala de Áudio [FALA: ...]
  let speechText = '';
  let textBody = rawText;

  const falaMatch = rawText.match(/\[FALA:\s*([\s\S]+?)\]/i);
  if (falaMatch && falaMatch[1]) {
    const rawFala = falaMatch[1].trim();
    if (rawFala.length > 280 || (isBudgetOrList && rawFala.length > 160)) {
      speechText = 'Oi ' + customerName + '! Já levantei todos os itens do seu orçamento. Deixei a lista detalhada por escrito aqui na mensagem para você conferir!';
      const outsideText = rawText.replace(/\[FALA:\s*[\s\S]+?\]/gi, '').trim();
      if (!outsideText || outsideText.length < 20) {
        textBody = rawFala;
      }
    } else {
      speechText = rawFala;
    }
  } else {
    const firstSentence = rawText.split('\n')[0].replace(/[*_~#\x60\[\]!]/g, '').trim();
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 160) {
      speechText = firstSentence;
    } else {
      speechText = 'Oi ' + customerName + '! Já separei as informações dos materiais da Hub, Obra para você!';
    }
  }

  // 7. Limpeza do Texto Escrito
  let respostaFormatada = textBody
    .replace(/\[FALA:\s*[\s\S]+?\]/gi, '')
    .replace(/\[FOTO:\s*[^\]]+\]/gi, '')
    .replace(/\[GERAR_PDF\]/gi, '')
    .replace(/!\[.*?\]\((https?:\/\/[^\)]+)\)/gi, '')
    .replace(/(https?:\/\/[^\s\(\)\[\]\"\'\<\>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\(\)\[\]\"\'\<\>]*)?)/gi, '')
    .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\s\S]*?>>>/gi, '')
    .replace(/<<<LEARN_TERM:[\s\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\s\S]*?>>>/gi, '')
    .trim();

  if (!respostaFormatada || respostaFormatada.length < 5) {
    respostaFormatada = rawText
      .replace(/\[FALA:\s*/gi, '')
      .replace(/\]/gi, '')
      .replace(/\[GERAR_PDF\]/gi, '')
      .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
      .replace(/<<<ORCAMENTO:[\s\S]*?>>>/gi, '')
      .replace(/<<<LEARN_TERM:[\s\S]*?>>>/gi, '')
      .replace(/<<<LEARN_RULE:[\s\S]*?>>>/gi, '')
      .trim();
  }

  // 8. Normalização Fonética da Fala de Áudio
  speechText = speechText
    .replace(/<<<LEARN_TERM:[\s\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\s\S]*?>>>/gi, '')
    .replace(/<<<ORCAMENTO:[\s\S]*?>>>/gi, '')
    .replace(/<<<PEDIDO:[\s\S]*?>>>/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\s*Obra/gi, 'Hub, Obra')
    .replace(/\bPIX\b/g, 'Pícs')
    .replace(/\bPix\b/g, 'Pícs')
    .replace(/\bWhatsApp\b/gi, 'Uatizap')
    .replace(/[*_~#\x60\[\]!]/g, '')
    .replace(/R\$\s*([0-9]+)[,\.]00\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/R\$\s*([0-9]+)[,\.]([0-9]{1,2})\b/gi, (m, reais, cents) => {
      const c = parseInt(cents, 10);
      if (c === 0) return reais === '1' ? '1 real' : reais + ' reais';
      if (reais === '0') return c + ' centavos';
      const unit = reais === '1' ? 'real' : 'reais';
      return reais + ' ' + unit + ' e ' + cents + ' centavos';
    })
    .replace(/R\$\s*([0-9]+)/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/\b([0-9]+)[,\.]00\s*reais\b/gi, (m, reais) => (reais === '1' ? '1 real' : reais + ' reais'))
    .replace(/\b([0-9]+)[,\.]00\b/g, '$1')
    .replace(/\s+e\s+(?:00|zero|0)\s+centavos\b/gi, '')
    .replace(/\s+(?:00|zero|0)\s+centavos\b/gi, '')
    .replace(/\s+vírgula\s+zero\s+zero\b/gi, '')
    .replace(/\s+virgula\s+zero\s+zero\b/gi, '')
    .replace(/m²/g, 'metros quadrados')
    .replace(/m³/g, 'metros cúbicos')
    .replace(/kg/g, 'quilos')
    .replace(/\s+/g, ' ')
    .trim();

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
      hasImage: hasImage,
      hasPdf: hasPdf,
      hasMedia: hasMedia,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      docName: docName,
      isBudgetOrList: isBudgetOrList,
      isAudioInput: Boolean(initialData.isAudio),
      hasText: Boolean(respostaFormatada && respostaFormatada.length > 0)
    }
  }];
})();
