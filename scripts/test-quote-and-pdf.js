const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend-nestjs/node_modules/@prisma/client'));
const PDFDocument = require(path.join(__dirname, '../backend-nestjs/node_modules/pdfkit/js/pdfkit.js'));
const fs = require('fs');

const prisma = new PrismaClient();

async function testQuoteAndPdf() {
  console.log('🧪 Iniciando teste do Sistema de Orçamentos com PDF da Lia...');

  // 1. Criar Orçamento de Teste
  const year = new Date().getFullYear();
  const quoteNumber = `ORC-${year}-${Date.now().toString().slice(-4)}`;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      status: 'OPEN',
      customerName: 'Claudio Sousa (Cliente Obra)',
      customerPhone: '558589219126',
      customerEmail: 'claudio@hubobra.com.br',
      subtotal: 1148.00,
      discount: 50.00,
      shipping: 0.00,
      total: 1098.00,
      validUntil,
      notes: 'Entregar na obra de Messejana (Rua Trajano de Medeiros, 566). Desconto aplicado à vista no PIX.',
      items: {
        create: [
          {
            name: 'Caixa d\'Água 500 Litros Fácil Instalação',
            brand: 'Fortlev',
            unit: 'UN',
            quantity: 2,
            unitPrice: 379.00,
            total: 758.00,
          },
          {
            name: 'Cimento Poty Todas as Obras 50kg',
            brand: 'Votoran',
            unit: 'SC',
            quantity: 10,
            unitPrice: 32.90,
            total: 329.00,
          },
          {
            name: 'Tubo de Esgoto 100mm 6 Metros',
            brand: 'Krona',
            unit: 'BARRA',
            quantity: 1,
            unitPrice: 42.00,
            total: 42.00,
          },
          {
            name: 'Fita Isolante Imperial 10m',
            brand: '3M',
            unit: 'UN',
            quantity: 2,
            unitPrice: 9.50,
            total: 19.00,
          }
        ]
      }
    },
    include: {
      items: true
    }
  });

  console.log(`✅ Orçamento criado no PostgreSQL: #${quote.quoteNumber} (ID: ${quote.id})`);
  console.log(`📊 Itens: ${quote.items.length}, Total: R$ ${quote.total.toFixed(2)}`);

  // 2. Gerar PDF
  console.log('📄 Gerando arquivo PDF com layout corporativo HubObra...');
  const pdfBuffer = await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Orçamento ${quote.quoteNumber} - HubObra`,
          Author: 'HubObra Materiais de Construção',
          Subject: `Orçamento para ${quote.customerName}`,
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#ea580c';
      const darkColor = '#0f172a';
      const grayColor = '#64748b';
      const lightBg = '#f8fafc';
      const borderGray = '#e2e8f0';

      // Barra Superior
      doc.rect(0, 0, 595.28, 8).fill(primaryColor);

      // Logo & Nome da Empresa
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('HubObra', 40, 30);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica').text('O Marketplace da Construção de Fortaleza e Região', 40, 56);
      doc.fillColor(grayColor).fontSize(8).text('CNPJ: 00.000.000/0001-00 • Fortaleza - CE', 40, 69);
      doc.text('WhatsApp Oficial: (85) 98921-9126 • https://hubobra.com.br', 40, 80);

      // Box de Identificação do Orçamento
      doc.roundedRect(380, 25, 175, 68, 6).fillAndStroke(lightBg, borderGray);
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('ORÇAMENTO COMERCIAL', 390, 34, { width: 155, align: 'center' });
      doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text(quote.quoteNumber, 390, 49, { width: 155, align: 'center' });
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('Status: VÁLIDO', 390, 68, { width: 155, align: 'center' });

      doc.moveTo(40, 105).lineTo(555, 105).strokeColor(borderGray).lineWidth(1).stroke();

      // Dados do Cliente
      let currentY = 115;
      doc.roundedRect(40, currentY, 515, 60, 4).fillAndStroke(lightBg, borderGray);

      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('DADOS DO CLIENTE:', 52, currentY + 10);
      doc.fillColor(grayColor).font('Helvetica').fontSize(9);
      doc.text(`Nome: `, 52, currentY + 24, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(quote.customerName);
      doc.font('Helvetica').fillColor(grayColor).text(`Telefone / WhatsApp: `, 52, currentY + 38, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(quote.customerPhone);

      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('DATAS & CONDIÇÕES:', 320, currentY + 10);
      doc.fillColor(grayColor).font('Helvetica').fontSize(9);
      doc.text(`Data de Emissão: `, 320, currentY + 24, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(formatDate(quote.createdAt));
      doc.font('Helvetica').fillColor(grayColor).text(`Válido Até: `, 320, currentY + 38, { continued: true }).font('Helvetica-Bold').fillColor('#dc2626').text(`${formatDate(quote.validUntil)} (7 dias)`);

      currentY += 75;

      // Tabela de Produtos
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO', 40, currentY);
      currentY += 16;

      const colX = {
        item: 42,
        desc: 75,
        unit: 310,
        qty: 360,
        unitPrice: 420,
        total: 485,
      };

      doc.rect(40, currentY, 515, 22).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('#', colX.item, currentY + 6);
      doc.text('DESCRIÇÃO DO MATERIAL', colX.desc, currentY + 6);
      doc.text('UN', colX.unit, currentY + 6);
      doc.text('QTD', colX.qty, currentY + 6);
      doc.text('VL. UNIT (R$)', colX.unitPrice, currentY + 6);
      doc.text('TOTAL (R$)', colX.total, currentY + 6);

      currentY += 22;

      quote.items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515, 24).fillAndStroke(rowBg, borderGray);

        doc.fillColor(grayColor).fontSize(8.5).font('Helvetica').text((index + 1).toString().padStart(2, '0'), colX.item, currentY + 7);
        
        const itemName = item.name + (item.brand ? ` (${item.brand})` : '');
        doc.fillColor(darkColor).font('Helvetica-Bold').text(itemName.substring(0, 42), colX.desc, currentY + 7);
        
        doc.fillColor(grayColor).font('Helvetica').text(item.unit || 'UN', colX.unit, currentY + 7);
        doc.fillColor(darkColor).font('Helvetica-Bold').text(item.quantity.toString(), colX.qty, currentY + 7);
        doc.fillColor(darkColor).font('Helvetica').text(item.unitPrice.toFixed(2).replace('.', ','), colX.unitPrice, currentY + 7);
        doc.fillColor(darkColor).font('Helvetica-Bold').text(item.total.toFixed(2).replace('.', ','), colX.total, currentY + 7);

        currentY += 24;
      });

      currentY += 15;

      // Quadro de Totais e Observações
      doc.roundedRect(40, currentY, 300, 110, 4).fillAndStroke(lightBg, borderGray);
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('CONDIÇÕES COMERCIAIS & OBSERVAÇÕES:', 52, currentY + 10);
      doc.fillColor(grayColor).fontSize(8).font('Helvetica');
      doc.text('• Preços com desconto especial para pagamento via PIX.', 52, currentY + 26);
      doc.text('• Aceitamos Cartões de Crédito em até 12x (consulte taxas).', 52, currentY + 38);
      doc.text('• Entrega rápida e programada para toda Fortaleza e Região Metropolitana.', 52, currentY + 50);
      doc.text('• Para fechar este pedido, basta responder a Lia no WhatsApp.', 52, currentY + 62);
      if (quote.notes) {
        doc.fillColor(primaryColor).text(`Obs: ${quote.notes.substring(0, 80)}`, 52, currentY + 76);
      }

      doc.roundedRect(355, currentY, 200, 110, 4).fillAndStroke(lightBg, borderGray);
      
      let totalsY = currentY + 12;
      doc.fillColor(grayColor).fontSize(9).font('Helvetica').text('Subtotal dos Itens:', 370, totalsY);
      doc.fillColor(darkColor).font('Helvetica-Bold').text(`R$ ${quote.subtotal.toFixed(2).replace('.', ',')}`, 470, totalsY, { width: 75, align: 'right' });

      if (quote.discount > 0) {
        totalsY += 16;
        doc.fillColor('#16a34a').font('Helvetica').text('Desconto Especial:', 370, totalsY);
        doc.font('Helvetica-Bold').text(`- R$ ${quote.discount.toFixed(2).replace('.', ',')}`, 470, totalsY, { width: 75, align: 'right' });
      }

      if (quote.shipping > 0) {
        totalsY += 16;
        doc.fillColor(grayColor).font('Helvetica').text('Frete Estimado:', 370, totalsY);
        doc.fillColor(darkColor).font('Helvetica-Bold').text(`+ R$ ${quote.shipping.toFixed(2).replace('.', ',')}`, 470, totalsY, { width: 75, align: 'right' });
      }

      totalsY += 20;
      doc.moveTo(370, totalsY).lineTo(545, totalsY).strokeColor(borderGray).stroke();
      
      totalsY += 8;
      doc.rect(365, totalsY, 180, 28).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('TOTAL GERAL:', 375, totalsY + 9);
      doc.fontSize(12).text(`R$ ${quote.total.toFixed(2).replace('.', ',')}`, 450, totalsY + 8, { width: 85, align: 'right' });

      // Rodapé
      doc.moveTo(40, 770).lineTo(555, 770).strokeColor(borderGray).lineWidth(0.5).stroke();
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica');
      doc.text('HubObra • Marketplace Oficial de Materiais de Construção de Fortaleza • www.hubobra.com.br', 40, 780, { width: 515, align: 'center' });
      doc.text(`Documento gerado automaticamente pela Consultora Virtual Lia em ${new Date().toLocaleString('pt-BR')}`, 40, 792, { width: 515, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

  const outputPath = path.join(__dirname, `../test_orcamento_${quote.quoteNumber}.pdf`);
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`🎉 PDF gerado com sucesso (${pdfBuffer.length} bytes)!`);
  console.log(`📁 Arquivo salvo em: ${outputPath}`);

  await prisma.$disconnect();
}

testQuoteAndPdf().catch(err => {
  console.error('❌ Erro no teste:', err);
  prisma.$disconnect();
});
