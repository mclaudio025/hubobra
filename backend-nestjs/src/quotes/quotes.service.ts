import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ConvertQuoteToOrderDto } from './dto/convert-quote-to-order.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gera um número sequencial único para o orçamento: ORC-YYYY-XXXX
   */
  async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORC-${year}-`;

    try {
      const lastQuote = await this.prisma.quote.findFirst({
        where: {
          quoteNumber: {
            startsWith: prefix,
          },
        },
        orderBy: {
          quoteNumber: 'desc',
        },
        select: {
          quoteNumber: true,
        },
      });

      let sequence = 1;
      if (lastQuote && lastQuote.quoteNumber) {
        const parts = lastQuote.quoteNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }

      return `${prefix}${sequence.toString().padStart(4, '0')}`;
    } catch (e) {
      return `${prefix}${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Cria um novo orçamento no sistema com validade padrão de 7 dias
   */
  async create(dto: CreateQuoteDto) {
    const {
      customerName,
      customerPhone,
      customerEmail,
      userId,
      storeId,
      discount = 0,
      shipping = 0,
      notes,
      items,
    } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('O orçamento deve conter pelo menos um item');
    }

    // Normalizar telefone
    const cleanPhone = customerPhone.replace(/\D/g, '');

    // Calcular totais
    let subtotal = 0;
    const formattedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const itemTotal = qty * price;
      subtotal += itemTotal;

      return {
        name: item.name.trim(),
        productId: item.productId || null,
        brand: item.brand || null,
        unit: (item.unit || 'UN').toUpperCase(),
        quantity: qty,
        unitPrice: price,
        total: itemTotal,
      };
    });

    const numDiscount = Number(discount) || 0;
    const numShipping = Number(shipping) || 0;
    const grandTotal = Math.max(0, subtotal - numDiscount + numShipping);

    // Validade padrão: 7 dias a partir de agora
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    const quoteNumber = await this.generateQuoteNumber();

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        status: 'OPEN',
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail ? customerEmail.trim() : null,
        userId: userId || null,
        storeId: storeId || null,
        subtotal,
        discount: numDiscount,
        shipping: numShipping,
        total: grandTotal,
        validUntil,
        notes: notes ? notes.trim() : null,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: true,
      },
    });

    this.logger.log(`📄 Orçamento criado: ${quote.quoteNumber} para ${quote.customerName} (Total: R$ ${quote.total})`);
    return quote;
  }

  /**
   * Busca orçamento por ID
   */
  async findById(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                brand: true,
                images: {
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        convertedOrder: {
          select: { id: true, orderNumber: true, status: true, total: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Orçamento com ID ${id} não encontrado`);
    }

    return quote;
  }

  /**
   * Busca orçamentos ativos por telefone (usado pela Lia no WhatsApp)
   */
  async findByPhone(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const partialPhone = cleanPhone.slice(-8); // últimos 8 dígitos para compatibilidade 859...

    const quotes = await this.prisma.quote.findMany({
      where: {
        customerPhone: {
          contains: partialPhone,
        },
      },
      include: {
        items: true,
        convertedOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return quotes;
  }

  /**
   * Busca orçamentos do usuário autenticado no site
   */
  async findByUser(userId: string) {
    return this.prisma.quote.findMany({
      where: { userId },
      include: {
        items: true,
        convertedOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lista todos os orçamentos (para o painel administrativo)
   */
  async findAll(params: {
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { status, search, skip = 0, take = 20 } = params;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.findMany({
        where,
        include: {
          items: true,
          convertedOrder: {
            select: { id: true, orderNumber: true, status: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: Number(skip),
        take: Number(take),
      }),
    ]);

    return { total, items, skip, take };
  }

  /**
   * Gera o arquivo PDF formatado e profissional da HubObra
   */
  async generatePdfBuffer(quoteId: string): Promise<Buffer> {
    const quote = await this.findById(quoteId);

    return new Promise((resolve, reject) => {
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

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const primaryColor = '#ea580c'; // Laranja HubObra
        const darkColor = '#0f172a'; // Slate 900
        const grayColor = '#64748b'; // Slate 500
        const lightBg = '#f8fafc'; // Slate 50
        const borderGray = '#e2e8f0';

        // ══════════════════════════════════════════════════════════
        // 1. CABEÇALHO COM IDENTIDADE HUBOBRA
        // ══════════════════════════════════════════════════════════
        // Barra Superior Colorida
        doc.rect(0, 0, 595.28, 8).fill(primaryColor);

        // Logo & Nome da Empresa
        doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('HubObra', 40, 30);
        doc.fillColor(darkColor).fontSize(9).font('Helvetica').text('O Marketplace da Construção de Fortaleza e Região', 40, 56);
        doc.fillColor(grayColor).fontSize(8).text('CNPJ: 00.000.000/0001-00 • Fortaleza - CE', 40, 69);
        doc.text('WhatsApp Oficial: (85) 98921-9126 • https://hubobra.com.br', 40, 80);

        // Box de Identificação do Orçamento (Canto Direito)
        doc.roundedRect(380, 25, 175, 68, 6).fillAndStroke(lightBg, borderGray);
        doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('ORÇAMENTO COMERCIAL', 390, 34, { width: 155, align: 'center' });
        doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text(quote.quoteNumber, 390, 49, { width: 155, align: 'center' });
        
        const isExpired = new Date() > new Date(quote.validUntil);
        const statusLabel = quote.status === 'CONVERTED' ? 'PEDIDO FECHADO' : (isExpired ? 'EXPIRADO' : 'VÁLIDO');
        const statusColor = quote.status === 'CONVERTED' ? '#16a34a' : (isExpired ? '#dc2626' : '#ea580c');
        
        doc.fillColor(statusColor).fontSize(8).font('Helvetica-Bold').text(`Status: ${statusLabel}`, 390, 68, { width: 155, align: 'center' });

        doc.moveTo(40, 105).lineTo(555, 105).strokeColor(borderGray).lineWidth(1).stroke();

        // ══════════════════════════════════════════════════════════
        // 2. DADOS DO CLIENTE & VALIDADE
        // ══════════════════════════════════════════════════════════
        let currentY = 115;
        doc.roundedRect(40, currentY, 515, 60, 4).fillAndStroke(lightBg, borderGray);

        const formatDate = (date: Date) => {
          const d = new Date(date);
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        };

        // Coluna Esquerda: Cliente
        doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('DADOS DO CLIENTE:', 52, currentY + 10);
        doc.fillColor(grayColor).font('Helvetica').fontSize(9);
        doc.text(`Nome: `, 52, currentY + 24, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(quote.customerName);
        doc.font('Helvetica').fillColor(grayColor).text(`Telefone / WhatsApp: `, 52, currentY + 38, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(quote.customerPhone);

        // Coluna Direita: Datas
        doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('DATAS & CONDIÇÕES:', 320, currentY + 10);
        doc.fillColor(grayColor).font('Helvetica').fontSize(9);
        doc.text(`Data de Emissão: `, 320, currentY + 24, { continued: true }).font('Helvetica-Bold').fillColor(darkColor).text(formatDate(quote.createdAt));
        doc.font('Helvetica').fillColor(grayColor).text(`Válido Até: `, 320, currentY + 38, { continued: true }).font('Helvetica-Bold').fillColor('#dc2626').text(`${formatDate(quote.validUntil)} (7 dias)`);

        currentY += 75;

        // ══════════════════════════════════════════════════════════
        // 3. TABELA DE PRODUTOS E MATERIAIS
        // ══════════════════════════════════════════════════════════
        doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO', 40, currentY);
        currentY += 16;

        // Cabeçalho da Tabela
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

        // Linhas de Itens
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

        // ══════════════════════════════════════════════════════════
        // 4. QUADRO DE TOTAIS & FORMAS DE PAGAMENTO
        // ══════════════════════════════════════════════════════════
        // Caixa de Observações e Condições (Esquerda)
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

        // Caixa de Totais (Direita)
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

        // ══════════════════════════════════════════════════════════
        // 5. RODAPÉ INSTITUCIONAL
        // ══════════════════════════════════════════════════════════
        doc.moveTo(40, 770).lineTo(555, 770).strokeColor(borderGray).lineWidth(0.5).stroke();
        doc.fillColor(grayColor).fontSize(7.5).font('Helvetica');
        doc.text('HubObra • Marketplace Oficial de Materiais de Construção de Fortaleza • www.hubobra.com.br', 40, 780, { width: 515, align: 'center' });
        doc.text(`Documento gerado automaticamente pela Consultora Virtual Lia em ${new Date().toLocaleString('pt-BR')}`, 40, 792, { width: 515, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Converte um orçamento aprovado em Pedido Oficial (Order)
   */
  async convertToOrder(quoteId: string, convertDto: ConvertQuoteToOrderDto) {
    const quote = await this.findById(quoteId);

    if (quote.status === 'CONVERTED') {
      throw new BadRequestException(`Este orçamento já foi convertido no pedido #${quote.convertedOrder?.orderNumber || 'existente'}`);
    }

    const {
      paymentMethod = 'PIX',
      street,
      number,
      complement,
      district,
      city = 'Fortaleza',
      state = 'CE',
      zipCode = '60000-000',
    } = convertDto;

    // Se o orçamento não tiver userId, busca ou cria um usuário pelo telefone
    let targetUserId = quote.userId;
    if (!targetUserId) {
      let existingUser = await this.prisma.user.findFirst({
        where: {
          email: `${quote.customerPhone}@hubobra.com.br`,
        },
      });

      if (!existingUser) {
        existingUser = await this.prisma.user.create({
          data: {
            name: quote.customerName,
            email: `${quote.customerPhone}@hubobra.com.br`,
            password: 'guest-whatsapp-user',
            role: 'USER',
          },
        });
      }
      targetUserId = existingUser.id;
    }

    // Gerar número de pedido único
    const year = new Date().getFullYear();
    const orderNumber = `PED-${year}-${Date.now().toString().slice(-4)}`;

    // Garantir produtos válidos para os itens do pedido
    const defaultProduct = await this.prisma.product.findFirst({ select: { id: true } });
    
    const orderItemsData = await Promise.all(
      quote.items.map(async (item) => {
        let finalProductId = item.productId;
        if (finalProductId) {
          const exists = await this.prisma.product.findUnique({
            where: { id: finalProductId },
            select: { id: true },
          });
          if (!exists) finalProductId = defaultProduct?.id || null;
        } else {
          finalProductId = defaultProduct?.id || null;
        }

        return {
          productId: finalProductId,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.total,
        };
      }),
    );

    // Filtrar apenas com productId válido (caso não haja nenhum produto cadastrado)
    const validItems = orderItemsData.filter((i) => Boolean(i.productId));

    // Criar o pedido oficial
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: targetUserId,
        storeId: quote.storeId,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        tax: 0,
        total: quote.total,
        notes: `Convertido do Orçamento ${quote.quoteNumber}. ${quote.notes || ''}`,
        status: 'PENDING',
        items: {
          create: validItems,
        },
        shippingAddress: {
          create: {
            street,
            number,
            complement: complement || null,
            district,
            city,
            state,
            zipCode: zipCode || '60000-000',
          },
        },
        payment: {
          create: {
            method: paymentMethod,
            amount: quote.total,
            status: 'PENDING',
          },
        },
      },
    });

    // Atualizar o orçamento como CONVERTED
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'CONVERTED',
        convertedOrderId: order.id,
      },
    });

    this.logger.log(`🎉 Orçamento ${quote.quoteNumber} convertido com sucesso no Pedido ${order.orderNumber}!`);

    return {
      success: true,
      message: `Orçamento ${quote.quoteNumber} convertido com sucesso!`,
      order,
      quoteNumber: quote.quoteNumber,
      orderNumber: order.orderNumber,
    };
  }
}
