function createQuotePdfBase64(quote) {
  const qNum = quote.quoteNumber || 'ORC-2026-0001';
  const cName = quote.customerName || 'Cliente';
  const cPhone = quote.customerPhone || '';
  const totalStr = 'R$ ' + (Number(quote.total) || 0).toFixed(2).replace('.', ',');
  const subtotalStr = 'R$ ' + (Number(quote.subtotal) || 0).toFixed(2).replace('.', ',');
  const discountStr = (Number(quote.discount) || 0) > 0 ? ('- R$ ' + Number(quote.discount).toFixed(2).replace('.', ',')) : '';
  const emitDate = new Date().toLocaleDateString('pt-BR');
  const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  // Escape text for PDF string literals
  const esc = (t) => String(t || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos para compatibilidade ASCII Type1
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  const streamOps = [];

  // 1. Barra Laranja Superior HubObra
  streamOps.push('0.92 0.35 0.05 rg'); // RGB Orange HubObra (#ea580c)
  streamOps.push('0 834 595 8 re f');

  // 2. Cabeçalho HubObra
  streamOps.push('BT');
  streamOps.push('/F2 22 Tf');
  streamOps.push('0.92 0.35 0.05 rg');
  streamOps.push('40 795 Td (HubObra) Tj');
  streamOps.push('ET');

  streamOps.push('BT');
  streamOps.push('/F1 9 Tf');
  streamOps.push('0.06 0.09 0.16 rg'); // Slate 900
  streamOps.push('40 780 Td (O Marketplace da Construcao de Fortaleza e Regiao) Tj');
  streamOps.push('0.39 0.45 0.55 rg'); // Slate 500
  streamOps.push('0 -12 Td (CNPJ: 00.000.000/0001-00 - Fortaleza - CE) Tj');
  streamOps.push('0 -12 Td (WhatsApp Oficial: \\(85\\) 98921-9126 - https://hubobra.com.br) Tj');
  streamOps.push('ET');

  // 3. Box do Orçamento (Direita)
  streamOps.push('0.97 0.98 0.99 rg'); // Light gray fill
  streamOps.push('0.88 0.91 0.94 RG'); // Border
  streamOps.push('380 755 175 68 re b');

  streamOps.push('BT');
  streamOps.push('/F2 11 Tf');
  streamOps.push('0.92 0.35 0.05 rg');
  streamOps.push('395 805 Td (ORCAMENTO OFICIAL) Tj');
  streamOps.push('/F2 14 Tf');
  streamOps.push('0.06 0.09 0.16 rg');
  streamOps.push('-5 -18 Td (#' + esc(qNum) + ') Tj');
  streamOps.push('/F2 8 Tf');
  streamOps.push('0.09 0.64 0.29 rg'); // Green
  streamOps.push('0 -18 Td (Status: VALIDO \\(7 DIAS\\)) Tj');
  streamOps.push('ET');

  // Linha divisória
  streamOps.push('0.88 0.91 0.94 RG 1 w');
  streamOps.push('40 735 m 555 735 l S');

  // 4. Box de Dados do Cliente e Datas
  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG');
  streamOps.push('40 665 515 60 re b');

  streamOps.push('BT');
  streamOps.push('/F2 9 Tf 0.06 0.09 0.16 rg');
  streamOps.push('52 710 Td (DADOS DO CLIENTE:) Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg');
  streamOps.push('0 -14 Td (Nome: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(cName) + ') Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg');
  streamOps.push('0 -14 Td (WhatsApp: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(cPhone) + ') Tj');
  streamOps.push('ET');

  streamOps.push('BT');
  streamOps.push('/F2 9 Tf 0.06 0.09 0.16 rg');
  streamOps.push('320 710 Td (DATAS & CONDICOES:) Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg');
  streamOps.push('0 -14 Td (Emissao: ) Tj /F2 9 Tf 0.06 0.09 0.16 rg (' + esc(emitDate) + ') Tj');
  streamOps.push('/F1 9 Tf 0.39 0.45 0.55 rg');
  streamOps.push('0 -14 Td (Validade: ) Tj /F2 9 Tf 0.86 0.15 0.15 rg (' + esc(validDate) + ' - 7 dias) Tj');
  streamOps.push('ET');

  // 5. Tabela de Materiais
  streamOps.push('BT /F2 11 Tf 0.06 0.09 0.16 rg 40 645 Td (ITENS DO ORCAMENTO) Tj ET');

  let tableY = 618;
  // Header da Tabela
  streamOps.push('0.92 0.35 0.05 rg 40 ' + tableY + ' 515 22 re f');
  streamOps.push('BT /F2 8.5 Tf 1 1 1 rg');
  streamOps.push('45 ' + (tableY + 7) + ' Td (#) Tj');
  streamOps.push('30 0 Td (DESCRICAO DO MATERIAL) Tj');
  streamOps.push('235 0 Td (UN) Tj');
  streamOps.push('50 0 Td (QTD) Tj');
  streamOps.push('60 0 Td (VL. UNIT) Tj');
  streamOps.push('65 0 Td (TOTAL) Tj');
  streamOps.push('ET');

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
    streamOps.push('BT /F1 8.5 Tf 0.06 0.09 0.16 rg 420 ' + (tableY + 8) + ' Td (' + esc(itPrice) + ') Tj ET');
    streamOps.push('BT /F2 8.5 Tf 0.06 0.09 0.16 rg 485 ' + (tableY + 8) + ' Td (' + esc(itTotal) + ') Tj ET');
  });

  // 6. Quadro de Totais e Observações
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

  // Quadro de Totais (Direita)
  streamOps.push('0.97 0.98 0.99 rg 0.88 0.91 0.94 RG 355 ' + tableY + ' 200 110 re b');
  streamOps.push('BT /F1 9 Tf 0.39 0.45 0.55 rg 370 ' + (tableY + 90) + ' Td (Subtotal dos Itens:) Tj /F2 9 Tf 0.06 0.09 0.16 rg 95 0 Td (' + esc(subtotalStr) + ') Tj ET');
  if (discountStr) {
    streamOps.push('BT /F1 9 Tf 0.09 0.64 0.29 rg 370 ' + (tableY + 72) + ' Td (Desconto PIX:) Tj /F2 9 Tf 105 0 Td (' + esc(discountStr) + ') Tj ET');
  }
  streamOps.push('0.92 0.35 0.05 rg 365 ' + (tableY + 12) + ' 180 30 re f');
  streamOps.push('BT /F2 10 Tf 1 1 1 rg 375 ' + (tableY + 23) + ' Td (TOTAL GERAL:) Tj /F2 12 Tf 80 0 Td (' + esc(totalStr) + ') Tj ET');

  // Rodapé
  streamOps.push('0.88 0.91 0.94 RG 0.5 w 40 45 m 555 45 l S');
  streamOps.push('BT /F1 7.5 Tf 0.39 0.45 0.55 rg 110 32 Td (HubObra - Marketplace de Materiais de Construcao - www.hubobra.com.br) Tj ET');
  streamOps.push('BT /F1 7 Tf 0.39 0.45 0.55 rg 135 20 Td (Documento gerado automaticamente pela Consultora Virtual Lia) Tj ET');

  const contentStream = streamOps.join('\n');

  // Montagem binária do PDF com xref e trailer
  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf-8')} >>\nstream\n${contentStream}\nendstream\nendobj`);
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

const testQuote = {
  quoteNumber: 'ORC-2026-0755',
  customerName: 'Claudio Sousa',
  customerPhone: '558589219126',
  subtotal: 390.84,
  discount: 0,
  shipping: 0,
  total: 390.84,
  notes: 'Entrega na obra em Messejana',
  items: [
    { name: "Caixa D'Agua Polietileno 500L", brand: "Fortlev", unit: "UN", quantity: 1, unitPrice: 379.00, total: 379.00 },
    { name: "Joelho 90 Soldavel 25mm", brand: "Tigre", unit: "UN", quantity: 4, unitPrice: 1.46, total: 5.84 },
    { name: "Cola PVC Polytubes 17G", brand: "Polytubes", unit: "UN", quantity: 2, unitPrice: 3.00, total: 6.00 }
  ]
};

const pdfDataUri = createQuotePdfBase64(testQuote);
console.log('✅ PDF Data URI gerado com sucesso!');
console.log('Tamanho base64:', pdfDataUri.length);

const fs = require('fs');
fs.writeFileSync('test_generated_pure.pdf', Buffer.from(pdfDataUri.split(',')[1], 'base64'));
console.log('📁 Arquivo test_generated_pure.pdf salvo para conferência!');
