import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface TransactionalEmailData {
  customerName: string;
  customerEmail: string;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod?: string;
  deliveryAddress?: string;
  trackingCode?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        context: {
          ...emailData.context,
          companyInfo: this.getCompanyInfo(),
          currentYear: new Date().getFullYear(),
        },
        attachments: emailData.attachments,
      });

      // Log do envio
      this.customLogger.logBusinessEvent("Email Sent", {
        to: Array.isArray(emailData.to)
          ? emailData.to.join(", ")
          : emailData.to,
        subject: emailData.subject,
        template: emailData.template,
      });

      this.logger.log(`Email enviado para: ${emailData.to}`);
      return true;
    } catch (error) {
      this.logger.error("Erro ao enviar email:", error);
      this.customLogger.error("Email sending failed", error.stack, {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
      });
      return false;
    }
  }

  // Emails Transacionais

  async sendOrderConfirmation(data: TransactionalEmailData): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido Confirmado #${data.orderNumber}`,
      template: "order-confirmation",
      context: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        amount: data.amount,
        items: data.items,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        orderDate: new Date().toLocaleDateString("pt-BR"),
      },
    });
  }

  async sendPaymentConfirmation(
    data: TransactionalEmailData,
  ): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pagamento Confirmado - Pedido #${data.orderNumber}`,
      template: "payment-confirmation",
      context: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date().toLocaleDateString("pt-BR"),
      },
    });
  }

  async sendOrderShipped(data: TransactionalEmailData): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido Enviado #${data.orderNumber}`,
      template: "order-shipped",
      context: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        trackingCode: data.trackingCode,
        deliveryAddress: data.deliveryAddress,
        shippedDate: new Date().toLocaleDateString("pt-BR"),
        trackingUrl: `https://rastreamento.correios.com.br/app/index.php?codigo=${data.trackingCode}`,
      },
    });
  }

  async sendOrderDelivered(data: TransactionalEmailData): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido Entregue #${data.orderNumber}`,
      template: "order-delivered",
      context: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        deliveredDate: new Date().toLocaleDateString("pt-BR"),
        reviewUrl: `${this.configService.get("FRONTEND_URL")}/pedidos/${data.orderId}/avaliar`,
      },
    });
  }

  async sendOrderCancelled(
    data: TransactionalEmailData & { reason?: string },
  ): Promise<boolean> {
    return this.sendEmail({
      to: data.customerEmail,
      subject: `Pedido Cancelado #${data.orderNumber}`,
      template: "order-cancelled",
      context: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        amount: data.amount,
        reason: data.reason || "Cancelamento solicitado",
        cancelledDate: new Date().toLocaleDateString("pt-BR"),
      },
    });
  }

  async sendWelcomeEmail(
    customerName: string,
    customerEmail: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: "Bem-vindo à Loja Moderna!",
      template: "welcome",
      context: {
        customerName,
        loginUrl: `${this.configService.get("FRONTEND_URL")}/login`,
        catalogUrl: `${this.configService.get("FRONTEND_URL")}/produtos`,
      },
    });
  }

  async sendPasswordReset(
    customerName: string,
    customerEmail: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: customerEmail,
      subject: "Redefinir Senha - Loja Moderna",
      template: "password-reset",
      context: {
        customerName,
        resetUrl,
        expiresIn: "24 horas",
      },
    });
  }

  async sendLowStockAlert(
    productName: string,
    currentStock: number,
    minStock: number,
  ): Promise<boolean> {
    const adminEmails = await this.getAdminEmails();

    if (adminEmails.length === 0) {
      this.logger.warn("Nenhum email de admin configurado para alertas");
      return false;
    }

    return this.sendEmail({
      to: adminEmails,
      subject: `Alerta: Estoque Baixo - ${productName}`,
      template: "low-stock-alert",
      context: {
        productName,
        currentStock,
        minStock,
        alertDate: new Date().toLocaleDateString("pt-BR"),
        adminUrl: `${this.configService.get("FRONTEND_URL")}/admin/produtos`,
      },
    });
  }

  async sendNewOrderAlert(orderData: TransactionalEmailData): Promise<boolean> {
    const adminEmails = await this.getAdminEmails();

    if (adminEmails.length === 0) {
      return false;
    }

    return this.sendEmail({
      to: adminEmails,
      subject: `Novo Pedido #${orderData.orderNumber}`,
      template: "new-order-alert",
      context: {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customerName,
        amount: orderData.amount,
        items: orderData.items,
        paymentMethod: orderData.paymentMethod,
        orderDate: new Date().toLocaleDateString("pt-BR"),
        adminUrl: `${this.configService.get("FRONTEND_URL")}/admin/pedidos/${orderData.orderId}`,
      },
    });
  }

  // Emails de Marketing

  async sendPromotionalEmail(
    recipients: string[],
    subject: string,
    promotionData: {
      title: string;
      description: string;
      discount?: string;
      validUntil?: Date;
      products?: Array<{
        name: string;
        price: number;
        image: string;
        url: string;
      }>;
      couponCode?: string;
    },
  ): Promise<boolean> {
    return this.sendEmail({
      to: recipients,
      subject,
      template: "promotional",
      context: {
        ...promotionData,
        validUntil: promotionData.validUntil?.toLocaleDateString("pt-BR"),
        shopUrl: this.configService.get("FRONTEND_URL"),
      },
    });
  }

  async sendAbandonedCartEmail(
    customerName: string,
    customerEmail: string,
    cartItems: Array<{
      name: string;
      price: number;
      quantity: number;
      image: string;
    }>,
    cartTotal: number,
  ): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: "Você esqueceu alguns itens no seu carrinho",
      template: "abandoned-cart",
      context: {
        customerName,
        cartItems,
        cartTotal,
        checkoutUrl: `${this.configService.get("FRONTEND_URL")}/carrinho`,
        validHours: 48,
      },
    });
  }

  // Métodos auxiliares

  private getCompanyInfo() {
    return {
      name: this.configService.get("COMPANY_NAME", "Loja Moderna"),
      address: this.configService.get(
        "COMPANY_ADDRESS",
        "Rua das Flores, 123 - São Paulo, SP",
      ),
      phone: this.configService.get("COMPANY_PHONE", "(11) 99999-9999"),
      email: this.configService.get("COMPANY_EMAIL", "contato@lojamoderna.com"),
      website: this.configService.get(
        "FRONTEND_URL",
        "https://lojamoderna.com",
      ),
    };
  }

  private async getAdminEmails(): Promise<string[]> {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: "ADMIN",
          active: true,
        },
        select: {
          email: true,
        },
      });

      return admins.map((admin) => admin.email);
    } catch (error) {
      this.logger.error("Erro ao buscar emails de admin:", error);
      return [];
    }
  }

  // Método para testar configuração de email
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const testEmail = this.configService.get("SMTP_USER");

      if (!testEmail) {
        throw new Error("SMTP_USER não configurado");
      }

      return this.sendEmail({
        to: testEmail,
        subject: "Teste de Configuração - Loja Moderna",
        template: "test-email",
        context: {
          testDate: new Date().toLocaleString("pt-BR"),
          serverInfo: {
            host: this.configService.get("SMTP_HOST"),
            port: this.configService.get("SMTP_PORT"),
          },
        },
      });
    } catch (error) {
      this.logger.error("Erro no teste de email:", error);
      return false;
    }
  }

  // Estatísticas de email
  async getEmailStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalSent: number;
    byTemplate: Record<string, number>;
    recentEmails: Array<{
      to: string;
      subject: string;
      template: string;
      sentAt: Date;
      status: string;
    }>;
  }> {
    // Em produção, implementar com banco de dados de logs de email
    // Por enquanto, retornar dados mock
    return {
      totalSent: 0,
      byTemplate: {},
      recentEmails: [],
    };
  }
}
