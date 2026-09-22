import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import { PaymentLinkDto, PaymentStatus } from "./dto/create-payment.dto";

export interface PaymentLinkResult {
  id: string;
  url: string;
  amount: number;
  expiresAt: Date;
  status: PaymentStatus;
  availableMethods: string[];
}

@Injectable()
export class PaymentLinkService {
  private readonly logger = new Logger(PaymentLinkService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  async createPaymentLink(dto: PaymentLinkDto): Promise<PaymentLinkResult> {
    try {
      // Verificar se o pedido existe
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException("Pedido não encontrado");
      }

      const expiresAt = new Date(
        Date.now() + (dto.expiresInHours || 24) * 60 * 60 * 1000,
      );
      const linkId = this.generateLinkId();
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const paymentUrl = `${baseUrl}/pagamento/link/${linkId}`;

      // Criar ou atualizar pagamento
      const metadataString = JSON.stringify({
        linkId,
        paymentUrl,
        expiresAt: expiresAt.toISOString(),
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        description: dto.description,
        availableMethods: ["PIX", "CREDIT_CARD", "DEBIT_CARD", "BANK_SLIP"],
      });

      const payment = await this.prisma.payment.upsert({
        where: { orderId: dto.orderId },
        update: {
          method: "PAYMENT_LINK",
          status: PaymentStatus.PENDING,
          amount: dto.amount,
          metadata: metadataString,
        },
        create: {
          orderId: dto.orderId,
          method: "PAYMENT_LINK",
          status: PaymentStatus.PENDING,
          amount: dto.amount,
          metadata: metadataString,
        },
      });

      // Log do evento
      this.customLogger.logBusinessEvent("Payment Link Created", {
        paymentId: payment.id,
        orderId: dto.orderId,
        amount: dto.amount,
        customerEmail: dto.customerEmail,
        expiresAt: expiresAt.toISOString(),
      });

      return {
        id: payment.id,
        url: paymentUrl,
        amount: dto.amount,
        expiresAt,
        status: PaymentStatus.PENDING,
        availableMethods: ["PIX", "CREDIT_CARD", "DEBIT_CARD", "BANK_SLIP"],
      };
    } catch (error) {
      this.logger.error("Erro ao criar link de pagamento:", error);
      throw error;
    }
  }

  async getPaymentLink(linkId: string): Promise<any> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          metadata: {
            contains: linkId,
          },
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException("Link de pagamento não encontrado");
      }

      const metadata = JSON.parse(payment.metadata || "{}");

      // Verificar se o link expirou
      if (metadata.expiresAt && new Date() > new Date(metadata.expiresAt)) {
        return {
          ...payment,
          metadata,
          expired: true,
          message: "Este link de pagamento expirou",
        };
      }

      return {
        ...payment,
        metadata,
        expired: false,
      };
    } catch (error) {
      this.logger.error("Erro ao buscar link de pagamento:", error);
      throw error;
    }
  }

  async processPayment(
    linkId: string,
    method: string,
    cardData?: any,
  ): Promise<any> {
    try {
      const paymentLink = await this.getPaymentLink(linkId);

      if (paymentLink.expired) {
        throw new Error("Link de pagamento expirado");
      }

      if (paymentLink.status !== PaymentStatus.PENDING) {
        throw new Error("Pagamento já foi processado");
      }

      // Processar pagamento baseado no método
      let result;
      switch (method.toUpperCase()) {
        case "PIX":
          result = await this.processPixPayment(paymentLink);
          break;
        case "CREDIT_CARD":
          result = await this.processCreditCard(paymentLink, cardData);
          break;
        case "DEBIT_CARD":
          result = await this.processDebitCard(paymentLink, cardData);
          break;
        case "BANK_SLIP":
          result = await this.processBankSlip(paymentLink);
          break;
        default:
          throw new Error("Método de pagamento não suportado");
      }

      // Log do processamento
      this.customLogger.logBusinessEvent("Payment Link Processed", {
        paymentId: paymentLink.id,
        method,
        amount: paymentLink.amount,
      });

      return result;
    } catch (error) {
      this.logger.error("Erro ao processar pagamento via link:", error);
      throw error;
    }
  }

  private async processPixPayment(paymentLink: any): Promise<any> {
    // Gerar PIX para o link de pagamento
    const pixCode = this.generatePixCode(paymentLink);
    const qrCode = await this.generateQRCode(pixCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Atualizar metadata do pagamento
    const metadata = JSON.parse(paymentLink.metadata || "{}");
    metadata.pixPayment = {
      pixCode,
      qrCode,
      expiresAt: expiresAt.toISOString(),
    };

    await this.prisma.payment.update({
      where: { id: paymentLink.id },
      data: {
        status: PaymentStatus.PROCESSING,
        metadata: JSON.stringify(metadata),
      },
    });

    return {
      method: "PIX",
      pixCode,
      qrCode,
      expiresAt,
      instructions: "Escaneie o QR Code ou copie o código PIX para pagar",
    };
  }

  private async processCreditCard(
    paymentLink: any,
    cardData: any,
  ): Promise<any> {
    // Simular processamento de cartão de crédito
    // Em produção, integrar com gateway de pagamento

    if (!cardData || !cardData.number || !cardData.cvv || !cardData.expiry) {
      throw new Error("Dados do cartão incompletos");
    }

    // Simular validação do cartão
    const isValid = this.validateCreditCard(cardData);

    if (!isValid) {
      throw new Error("Dados do cartão inválidos");
    }

    // Simular processamento (em produção, chamar gateway)
    const transactionId = `CC${Date.now()}`;

    await this.prisma.payment.update({
      where: { id: paymentLink.id },
      data: {
        status: PaymentStatus.PAID,
        transactionId,
        paidAt: new Date(),
      },
    });

    // Atualizar status do pedido
    await this.prisma.order.update({
      where: { id: paymentLink.order.id },
      data: { status: "CONFIRMED" },
    });

    return {
      method: "CREDIT_CARD",
      transactionId,
      status: "APPROVED",
      message: "Pagamento aprovado com sucesso",
    };
  }

  private async processDebitCard(
    paymentLink: any,
    cardData: any,
  ): Promise<any> {
    // Similar ao cartão de crédito, mas com validações específicas de débito
    return this.processCreditCard(paymentLink, cardData);
  }

  private async processBankSlip(paymentLink: any): Promise<any> {
    // Gerar boleto bancário
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias
    const barcode = this.generateBarcode(paymentLink);
    const digitableLine = this.generateDigitableLine(barcode);

    await this.prisma.payment.update({
      where: { id: paymentLink.id },
      data: {
        status: PaymentStatus.PROCESSING,
        metadata: JSON.stringify({
          ...JSON.parse(paymentLink.metadata || "{}"),
          bankSlip: {
            barcode,
            digitableLine,
            dueDate: dueDate.toISOString(),
          },
        }),
      },
    });

    return {
      method: "BANK_SLIP",
      barcode,
      digitableLine,
      dueDate,
      instructions: "Pague o boleto em qualquer banco ou internet banking",
    };
  }

  private generateLinkId(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generatePixCode(paymentLink: any): string {
    // Implementação similar ao PixService
    const merchantName = "LOJA MODERNA MATERIAIS";
    const merchantCity = "SAO PAULO";
    const txId = paymentLink.order.id.slice(-25);

    // Simplificado para exemplo
    return `00020126580014BR.GOV.BCB.PIX0136${Date.now()}${txId}5204000053039865802BR5925${merchantName}6009${merchantCity}62070503***6304ABCD`;
  }

  private async generateQRCode(pixCode: string): Promise<string> {
    // Placeholder para QR Code
    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          QR Code PIX
        </text>
      </svg>
    `,
    ).toString("base64")}`;
  }

  private validateCreditCard(cardData: any): boolean {
    // Validação básica do cartão (em produção, usar validações mais robustas)
    const { number, cvv, expiry } = cardData;

    // Verificar se o número tem 16 dígitos
    if (!/^\d{16}$/.test(number.replace(/\s/g, ""))) {
      return false;
    }

    // Verificar CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return false;
    }

    // Verificar data de expiração
    const [month, year] = expiry.split("/");
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    if (expiryDate < new Date()) {
      return false;
    }

    return true;
  }

  private generateBarcode(paymentLink: any): string {
    // Gerar código de barras do boleto (simplificado)
    const bankCode = "001"; // Banco do Brasil
    const amount = Math.floor(paymentLink.amount * 100)
      .toString()
      .padStart(10, "0");
    const dueDate = "9999"; // Simplificado
    const sequential = Date.now().toString().slice(-10);

    return `${bankCode}9${dueDate}${amount}${sequential}`;
  }

  private generateDigitableLine(barcode: string): string {
    // Converter código de barras em linha digitável (simplificado)
    return barcode.replace(
      /(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/,
      "$1.$2 $3.$4 $5.$6 $7 $8",
    );
  }
}
