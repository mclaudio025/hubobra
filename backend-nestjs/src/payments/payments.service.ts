import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentMethod,
  PaymentStatus,
} from "./dto/create-payment.dto";

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  transactionId?: string;
  paymentUrl?: string;
  pixCode?: string;
  qrCode?: string;
  expiresAt?: Date;
  instructions?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    try {
      // Verificar se o pedido existe
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        include: { payment: true },
      });

      if (!order) {
        throw new NotFoundException("Pedido não encontrado");
      }

      if (order.payment) {
        throw new BadRequestException(
          "Pedido já possui um pagamento associado",
        );
      }

      // Criar registro de pagamento
      const payment = await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: dto.method,
          status: PaymentStatus.PENDING,
          amount: dto.amount,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        },
      });

      // Log do evento
      this.customLogger.logBusinessEvent("Payment Created", {
        paymentId: payment.id,
        orderId: dto.orderId,
        method: dto.method,
        amount: dto.amount,
      });

      // Processar baseado no método de pagamento
      const result = await this.processPaymentByMethod(payment, dto);

      return result;
    } catch (error) {
      this.logger.error("Erro ao criar pagamento:", error);
      this.customLogger.error("Payment creation failed", error.stack, {
        orderId: dto.orderId,
        method: dto.method,
        amount: dto.amount,
      });
      throw error;
    }
  }

  private async processPaymentByMethod(
    payment: any,
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    const baseResult: PaymentResult = {
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
    };

    switch (dto.method) {
      case PaymentMethod.STORE_PICKUP:
        return this.processStorePickup(baseResult, payment, dto);

      case PaymentMethod.PIX:
        return this.processPix(baseResult, payment, dto);

      case PaymentMethod.PAYMENT_LINK:
        return this.processPaymentLink(baseResult, payment, dto);

      case PaymentMethod.CASH_ON_DELIVERY:
        return this.processCashOnDelivery(baseResult, payment, dto);

      default:
        throw new BadRequestException("Método de pagamento não suportado");
    }
  }

  private async processStorePickup(
    result: PaymentResult,
    payment: any,
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    // Para retirada na loja, o pagamento é feito presencialmente
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        metadata: JSON.stringify({
          ...dto.metadata,
          paymentLocation: "store",
          instructions:
            "Pagamento será realizado na retirada do produto na loja",
        }),
      },
    });

    return {
      ...result,
      status: PaymentStatus.PENDING,
      instructions: `
        🏪 RETIRADA NA LOJA
        
        • Valor: R$ ${dto.amount.toFixed(2)}
        • Pagamento na retirada
        • Formas aceitas: Dinheiro, PIX, Cartão
        • Endereço: [Configurar endereço da loja]
        • Horário: Segunda a Sexta, 8h às 18h
        
        ⚠️ Importante: Traga um documento com foto
      `,
    };
  }

  private async processPix(
    result: PaymentResult,
    payment: any,
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    // Gerar código PIX (simulado - em produção usar API do banco)
    const pixCode = this.generatePixCode(dto);
    const qrCode = this.generateQRCode(pixCode);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        metadata: JSON.stringify({
          ...dto.metadata,
          pixCode,
          qrCode,
          expiresAt: expiresAt.toISOString(),
        }),
      },
    });

    return {
      ...result,
      status: PaymentStatus.PENDING,
      pixCode,
      qrCode,
      expiresAt,
      instructions: `
        💰 PAGAMENTO VIA PIX
        
        • Valor: R$ ${dto.amount.toFixed(2)}
        • Válido até: ${expiresAt.toLocaleString("pt-BR")}
        
        📱 Como pagar:
        1. Abra o app do seu banco
        2. Escaneie o QR Code ou copie o código PIX
        3. Confirme o pagamento
        
        ✅ O pagamento será confirmado automaticamente
      `,
    };
  }

  private async processPaymentLink(
    result: PaymentResult,
    payment: any,
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    // Gerar link de pagamento
    const paymentUrl = this.generatePaymentLink(payment.id, dto);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        metadata: JSON.stringify({
          ...dto.metadata,
          paymentUrl,
          expiresAt: expiresAt.toISOString(),
        }),
      },
    });

    return {
      ...result,
      status: PaymentStatus.PENDING,
      paymentUrl,
      expiresAt,
      instructions: `
        🔗 LINK PARA PAGAMENTO
        
        • Valor: R$ ${dto.amount.toFixed(2)}
        • Válido até: ${expiresAt.toLocaleString("pt-BR")}
        
        💳 Formas de pagamento disponíveis:
        • PIX (instantâneo)
        • Cartão de crédito
        • Cartão de débito
        • Boleto bancário
        
        🔒 Pagamento 100% seguro
      `,
    };
  }

  private async processCashOnDelivery(
    result: PaymentResult,
    payment: any,
    dto: CreatePaymentDto,
  ): Promise<PaymentResult> {
    // Para pagamento na entrega
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PENDING,
        metadata: JSON.stringify({
          ...dto.metadata,
          deliveryPayment: true,
          instructions: "Pagamento será realizado na entrega do produto",
        }),
      },
    });

    return {
      ...result,
      status: PaymentStatus.PENDING,
      instructions: `
        🚚 PAGAMENTO NA ENTREGA
        
        • Valor: R$ ${dto.amount.toFixed(2)}
        • Pagamento no recebimento
        • Formas aceitas: Dinheiro, PIX
        
        📋 Informações importantes:
        • Tenha o valor exato em dinheiro
        • PIX pode ser feito na hora
        • Entregador levará maquininha
        
        ⚠️ Pedido será enviado após confirmação
      `,
    };
  }

  async updatePayment(
    id: string,
    dto: UpdatePaymentDto,
  ): Promise<PaymentResult> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!payment) {
        throw new NotFoundException("Pagamento não encontrado");
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: {
          status: dto.status,
          transactionId: dto.transactionId,
          paidAt: dto.status === PaymentStatus.PAID ? new Date() : null,
          metadata: dto.metadata
            ? JSON.stringify(dto.metadata)
            : payment.metadata,
        },
      });

      // Log da atualização
      this.customLogger.logBusinessEvent("Payment Updated", {
        paymentId: id,
        oldStatus: payment.status,
        newStatus: dto.status,
        transactionId: dto.transactionId,
      });

      // Se pagamento foi confirmado, atualizar status do pedido
      if (dto.status === PaymentStatus.PAID) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });

        this.customLogger.logBusinessEvent("Order Confirmed by Payment", {
          orderId: payment.orderId,
          paymentId: id,
        });
      }

      return {
        id: updatedPayment.id,
        status: updatedPayment.status as PaymentStatus,
        method: updatedPayment.method as PaymentMethod,
        amount: updatedPayment.amount,
        transactionId: updatedPayment.transactionId,
      };
    } catch (error) {
      this.logger.error("Erro ao atualizar pagamento:", error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<any> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Pagamento não encontrado");
    }

    return {
      ...payment,
      metadata: payment.metadata ? JSON.parse(payment.metadata) : null,
    };
  }

  async getPaymentsByOrder(orderId: string): Promise<any[]> {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async confirmPayment(
    id: string,
    transactionId?: string,
  ): Promise<PaymentResult> {
    return this.updatePayment(id, {
      status: PaymentStatus.PAID,
      transactionId,
    });
  }

  async cancelPayment(id: string, reason?: string): Promise<PaymentResult> {
    return this.updatePayment(id, {
      status: PaymentStatus.CANCELLED,
      metadata: { cancellationReason: reason },
    });
  }

  private generatePixCode(dto: CreatePaymentDto): string {
    // Em produção, usar API do banco para gerar PIX real
    const timestamp = Date.now();
    const orderId = dto.orderId.slice(-8);
    const merchantName = (process.env.PIX_MERCHANT_NAME || "HUB CONSTRUCOES").substring(0, 25);
    const merchantCity = (process.env.PIX_MERCHANT_CITY || "SAO PAULO").substring(0, 15);
    const nameLen = merchantName.length.toString().padStart(2, "0");
    const cityLen = merchantCity.length.toString().padStart(2, "0");
    return `00020126580014BR.GOV.BCB.PIX0136${timestamp}${orderId}5204000053039865802BR59${nameLen}${merchantName}60${cityLen}${merchantCity}62070503***6304${this.calculatePixChecksum(timestamp.toString())}`;
  }

  private generateQRCode(pixCode: string): string {
    // Em produção, usar biblioteca para gerar QR Code real
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }

  private generatePaymentLink(
    paymentId: string,
    dto: CreatePaymentDto,
  ): string {
    // Em produção, usar gateway de pagamento real
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${baseUrl}/pagamento/${paymentId}?amount=${dto.amount}&order=${dto.orderId}`;
  }

  private calculatePixChecksum(data: string): string {
    // Algoritmo simplificado - em produção usar o algoritmo oficial do PIX
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i);
    }
    return (sum % 10000).toString().padStart(4, "0");
  }

  async getPaymentStats(startDate: Date, endDate: Date) {
    try {
      // Buscar pagamentos no período
      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Calcular estatísticas
      const totalPayments = payments.length;
      const totalAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const paidPayments = payments.filter(
        (p) => p.status === PaymentStatus.PAID,
      );
      const successRate =
        totalPayments > 0 ? (paidPayments.length / totalPayments) * 100 : 0;
      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

      // Agrupar por método
      const byMethod = payments.reduce(
        (acc, payment) => {
          acc[payment.method] = (acc[payment.method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Agrupar por status
      const byStatus = payments.reduce(
        (acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Pagamentos recentes (últimos 10)
      const recentPayments = payments.slice(0, 10).map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        orderNumber: payment.order?.orderNumber,
        customerName: payment.order?.user?.name,
        customerEmail: payment.order?.user?.email,
      }));

      return {
        totalPayments,
        totalAmount,
        averageAmount,
        successRate,
        byMethod,
        byStatus,
        recentPayments,
      };
    } catch (error) {
      this.logger.error("Erro ao buscar estatísticas de pagamentos:", error);
      throw error;
    }
  }
}
