import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import { PixPaymentDto, PaymentStatus } from "./dto/create-payment.dto";

export interface PixPaymentResult {
  id: string;
  pixCode: string;
  qrCode: string;
  amount: number;
  expiresAt: Date;
  status: PaymentStatus;
}

@Injectable()
export class PixService {
  private readonly logger = new Logger(PixService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  async createPixPayment(dto: PixPaymentDto): Promise<PixPaymentResult> {
    try {
      // Verificar se o pedido existe
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new Error("Pedido não encontrado");
      }

      // Gerar código PIX
      const pixCode = this.generatePixCode(dto);
      const qrCode = await this.generateQRCode(pixCode);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      // Criar ou atualizar pagamento
      const metadataString = JSON.stringify({
        pixCode,
        qrCode,
        expiresAt: expiresAt.toISOString(),
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
      });

      const payment = await this.prisma.payment.upsert({
        where: { orderId: dto.orderId },
        update: {
          method: "PIX",
          status: PaymentStatus.PENDING,
          amount: dto.amount,
          metadata: metadataString,
        },
        create: {
          orderId: dto.orderId,
          method: "PIX",
          status: PaymentStatus.PENDING,
          amount: dto.amount,
          metadata: metadataString,
        },
      });

      // Log do evento
      this.customLogger.logBusinessEvent("PIX Payment Created", {
        paymentId: payment.id,
        orderId: dto.orderId,
        amount: dto.amount,
        customerEmail: dto.customerEmail,
      });

      return {
        id: payment.id,
        pixCode,
        qrCode,
        amount: dto.amount,
        expiresAt,
        status: PaymentStatus.PENDING,
      };
    } catch (error) {
      this.logger.error("Erro ao criar pagamento PIX:", error);
      throw error;
    }
  }

  async getPixStatus(
    paymentId: string,
  ): Promise<{ status: PaymentStatus; paidAt?: Date }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    return {
      status: payment.status as PaymentStatus,
      paidAt: payment.paidAt,
    };
  }

  async handleWebhook(webhookData: any): Promise<void> {
    try {
      // Em produção, validar assinatura do webhook
      this.logger.log("Webhook PIX recebido:", JSON.stringify(webhookData));

      const { paymentId, status, transactionId, paidAt } = webhookData;

      if (paymentId && status) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status,
            transactionId,
            paidAt: paidAt ? new Date(paidAt) : null,
          },
        });

        // Se pagamento foi confirmado, atualizar pedido
        if (status === PaymentStatus.PAID) {
          const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
          });

          if (payment) {
            await this.prisma.order.update({
              where: { id: payment.orderId },
              data: { status: "CONFIRMED" },
            });

            this.customLogger.logBusinessEvent("PIX Payment Confirmed", {
              paymentId,
              orderId: payment.orderId,
              transactionId,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error("Erro ao processar webhook PIX:", error);
      throw error;
    }
  }

  private generatePixCode(dto: PixPaymentDto): string {
    // Gerar código PIX seguindo o padrão EMV
    const merchantName = process.env.PIX_MERCHANT_NAME || "HUB CONSTRUCOES";
    const merchantCity = process.env.PIX_MERCHANT_CITY || "SAO PAULO";
    const txId = dto.orderId.slice(-25); // Máximo 25 caracteres

    // Chave PIX (em produção, usar chave real)
    const pixKey = process.env.PIX_KEY || "11999999999";

    // Construir payload PIX
    const payload = this.buildPixPayload({
      pixKey,
      merchantName,
      merchantCity,
      amount: dto.amount,
      txId,
      description: dto.description || `Pedido ${dto.orderId}`,
    });

    return payload;
  }

  private buildPixPayload(data: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txId: string;
    description: string;
  }): string {
    // Implementação simplificada do payload PIX
    // Em produção, usar biblioteca oficial do Banco Central

    const formatField = (id: string, value: string): string => {
      const length = value.length.toString().padStart(2, "0");
      return `${id}${length}${value}`;
    };

    let payload = "";

    // Payload Format Indicator
    payload += formatField("00", "01");

    // Point of Initiation Method
    payload += formatField("01", "12");

    // Merchant Account Information
    const merchantInfo =
      formatField("00", "BR.GOV.BCB.PIX") + formatField("01", data.pixKey);
    payload += formatField("26", merchantInfo);

    // Merchant Category Code
    payload += formatField("52", "0000");

    // Transaction Currency
    payload += formatField("53", "986");

    // Transaction Amount
    payload += formatField("54", data.amount.toFixed(2));

    // Country Code
    payload += formatField("58", "BR");

    // Merchant Name
    payload += formatField("59", data.merchantName.substring(0, 25));

    // Merchant City
    payload += formatField("60", data.merchantCity.substring(0, 15));

    // Additional Data Field Template
    const additionalData = formatField("05", data.txId);
    payload += formatField("62", additionalData);

    // CRC16
    payload += "6304";
    const crc = this.calculateCRC16(payload);
    payload += crc;

    return payload;
  }

  private calculateCRC16(payload: string): string {
    // Implementação simplificada do CRC16
    // Em produção, usar implementação oficial
    let crc = 0xffff;

    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xffff;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  private async generateQRCode(pixCode: string): Promise<string> {
    // Em produção, usar biblioteca como qrcode para gerar QR Code real
    // Por enquanto, retornar um placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          QR Code PIX
        </text>
        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="8">
          ${pixCode.substring(0, 20)}...
        </text>
      </svg>
    `,
    ).toString("base64")}`;
  }

  // Método para simular confirmação de pagamento PIX (desenvolvimento)
  async simulatePixPayment(paymentId: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Simulação não permitida em produção");
    }

    const transactionId = `PIX${Date.now()}`;

    await this.handleWebhook({
      paymentId,
      status: PaymentStatus.PAID,
      transactionId,
      paidAt: new Date().toISOString(),
    });

    this.logger.log(`PIX simulado confirmado: ${paymentId}`);
  }
}
