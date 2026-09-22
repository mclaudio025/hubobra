import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import { MailService } from "./mail.service";

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: "ORDER" | "PAYMENT" | "SHIPPING" | "MARKETING" | "SYSTEM";
  channels: ("EMAIL" | "SMS" | "PUSH" | "WHATSAPP")[];
  subject: string;
  emailTemplate?: string;
  smsTemplate?: string;
  pushTemplate?: string;
  whatsappTemplate?: string;
  active: boolean;
}

export interface NotificationData {
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
  templateId: string;
  data: Record<string, any>;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  scheduledFor?: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
    private mailService: MailService,
  ) {}

  // Envio de Notificações

  async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      const template = await this.getNotificationTemplate(
        notificationData.templateId,
      );

      if (!template || !template.active) {
        this.logger.warn(
          `Template de notificação não encontrado ou inativo: ${notificationData.templateId}`,
        );
        return false;
      }

      // Obter preferências do usuário
      const preferences = await this.getUserNotificationPreferences(
        notificationData.userId,
      );

      const results: boolean[] = [];

      // Enviar por cada canal configurado
      for (const channel of template.channels) {
        if (this.shouldSendToChannel(channel, preferences)) {
          const success = await this.sendToChannel(
            channel,
            template,
            notificationData,
          );
          results.push(success);
        }
      }

      const overallSuccess = results.some((result) => result);

      // Log da notificação
      this.customLogger.logBusinessEvent("Notification Sent", {
        templateId: notificationData.templateId,
        userId: notificationData.userId,
        channels: template.channels,
        success: overallSuccess,
        priority: notificationData.priority,
      });

      return overallSuccess;
    } catch (error) {
      this.logger.error("Erro ao enviar notificação:", error);
      return false;
    }
  }

  private async sendToChannel(
    channel: string,
    template: NotificationTemplate,
    data: NotificationData,
  ): Promise<boolean> {
    switch (channel) {
      case "EMAIL":
        return this.sendEmailNotification(template, data);
      case "SMS":
        return this.sendSMSNotification(template, data);
      case "PUSH":
        return this.sendPushNotification(template, data);
      case "WHATSAPP":
        return this.sendWhatsAppNotification(template, data);
      default:
        return false;
    }
  }

  private async sendEmailNotification(
    template: NotificationTemplate,
    data: NotificationData,
  ): Promise<boolean> {
    if (!data.email || !template.emailTemplate) {
      return false;
    }

    return this.mailService.sendEmail({
      to: data.email,
      subject: this.processTemplate(template.subject, data.data),
      template: template.emailTemplate,
      context: {
        userName: data.name || "Cliente",
        ...data.data,
      },
    });
  }

  private async sendSMSNotification(
    template: NotificationTemplate,
    data: NotificationData,
  ): Promise<boolean> {
    if (!data.phone || !template.smsTemplate) {
      return false;
    }

    // Implementar integração com provedor de SMS (Twilio, etc.)
    const message = this.processTemplate(template.smsTemplate, data.data);

    this.logger.log(`SMS enviado para ${data.phone}: ${message}`);
    return true; // Mock implementation
  }

  private async sendPushNotification(
    template: NotificationTemplate,
    data: NotificationData,
  ): Promise<boolean> {
    if (!data.userId || !template.pushTemplate) {
      return false;
    }

    // Implementar integração com serviço de push (Firebase, etc.)
    const message = this.processTemplate(template.pushTemplate, data.data);

    this.logger.log(
      `Push notification enviado para usuário ${data.userId}: ${message}`,
    );
    return true; // Mock implementation
  }

  private async sendWhatsAppNotification(
    template: NotificationTemplate,
    data: NotificationData,
  ): Promise<boolean> {
    if (!data.phone || !template.whatsappTemplate) {
      return false;
    }

    // Implementar integração com WhatsApp Business API
    const message = this.processTemplate(template.whatsappTemplate, data.data);

    this.logger.log(`WhatsApp enviado para ${data.phone}: ${message}`);
    return true; // Mock implementation
  }

  // Notificações Específicas do E-commerce

  async notifyOrderCreated(orderId: string): Promise<boolean> {
    const order = await this.getOrderData(orderId);

    if (!order) {
      return false;
    }

    return this.sendNotification({
      userId: order.userId,
      email: order.user.email,
      phone: order.user.phone,
      name: order.user.name,
      templateId: "order-created",
      data: {
        orderNumber: order.orderNumber,
        amount: order.total,
        items: order.items,
      },
      priority: "HIGH",
    });
  }

  async notifyPaymentConfirmed(orderId: string): Promise<boolean> {
    const order = await this.getOrderData(orderId);

    if (!order) {
      return false;
    }

    return this.sendNotification({
      userId: order.userId,
      email: order.user.email,
      phone: order.user.phone,
      name: order.user.name,
      templateId: "payment-confirmed",
      data: {
        orderNumber: order.orderNumber,
        amount: order.total,
        paymentMethod: order.payment?.method,
      },
      priority: "HIGH",
    });
  }

  async notifyOrderShipped(
    orderId: string,
    trackingCode: string,
  ): Promise<boolean> {
    const order = await this.getOrderData(orderId);

    if (!order) {
      return false;
    }

    return this.sendNotification({
      userId: order.userId,
      email: order.user.email,
      phone: order.user.phone,
      name: order.user.name,
      templateId: "order-shipped",
      data: {
        orderNumber: order.orderNumber,
        trackingCode,
        trackingUrl: `https://rastreamento.correios.com.br/app/index.php?codigo=${trackingCode}`,
      },
      priority: "NORMAL",
    });
  }

  async notifyOrderDelivered(orderId: string): Promise<boolean> {
    const order = await this.getOrderData(orderId);

    if (!order) {
      return false;
    }

    return this.sendNotification({
      userId: order.userId,
      email: order.user.email,
      phone: order.user.phone,
      name: order.user.name,
      templateId: "order-delivered",
      data: {
        orderNumber: order.orderNumber,
        reviewUrl: `${process.env.FRONTEND_URL}/pedidos/${orderId}/avaliar`,
      },
      priority: "NORMAL",
    });
  }

  async notifyLowStock(productId: string): Promise<boolean> {
    const product = await this.getProductData(productId);

    if (!product) {
      return false;
    }

    // Notificar administradores
    const admins = await this.getAdminUsers();

    const promises = admins.map((admin) =>
      this.sendNotification({
        userId: admin.id,
        email: admin.email,
        name: admin.name,
        templateId: "low-stock-alert",
        data: {
          productName: product.name,
          currentStock: product.stock,
          minStock: product.minStock,
        },
        priority: "HIGH",
      }),
    );

    const results = await Promise.allSettled(promises);
    return results.some((result) => result.status === "fulfilled");
  }

  async notifyPriceChange(
    productId: string,
    oldPrice: number,
    newPrice: number,
  ): Promise<boolean> {
    // Notificar usuários que favoritaram o produto
    const interestedUsers = await this.getUsersInterestedInProduct(productId);

    if (interestedUsers.length === 0) {
      return false;
    }

    const product = await this.getProductData(productId);

    if (!product) {
      return false;
    }

    const promises = interestedUsers.map((user) =>
      this.sendNotification({
        userId: user.id,
        email: user.email,
        name: user.name,
        templateId: "price-change-alert",
        data: {
          productName: product.name,
          oldPrice,
          newPrice,
          discount:
            oldPrice > newPrice
              ? (((oldPrice - newPrice) / oldPrice) * 100).toFixed(0)
              : null,
          productUrl: `${process.env.FRONTEND_URL}/produtos/${productId}`,
        },
        priority: "NORMAL",
      }),
    );

    const results = await Promise.allSettled(promises);
    return results.some((result) => result.status === "fulfilled");
  }

  // Gerenciamento de Templates

  async createNotificationTemplate(
    templateData: Omit<NotificationTemplate, "id">,
  ): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      id: `tpl_${Date.now()}`,
      ...templateData,
    };

    // Em produção, salvar no banco de dados
    this.logger.log(`Template de notificação criado: ${template.id}`);

    return template;
  }

  async updateNotificationTemplate(
    id: string,
    updates: Partial<NotificationTemplate>,
  ): Promise<boolean> {
    // Em produção, atualizar no banco de dados
    this.logger.log(`Template de notificação atualizado: ${id}`);
    return true;
  }

  // Gerenciamento de Preferências

  async updateUserNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<boolean> {
    try {
      // Em produção, salvar no banco de dados
      this.logger.log(
        `Preferências de notificação atualizadas para usuário: ${userId}`,
      );

      this.customLogger.logBusinessEvent("Notification Preferences Updated", {
        userId,
        preferences,
      });

      return true;
    } catch (error) {
      this.logger.error("Erro ao atualizar preferências:", error);
      return false;
    }
  }

  // Métodos auxiliares privados

  private async getNotificationTemplate(
    id: string,
  ): Promise<NotificationTemplate | null> {
    // Mock implementation - em produção, buscar do banco
    const templates: Record<string, NotificationTemplate> = {
      "order-created": {
        id: "order-created",
        name: "Pedido Criado",
        type: "ORDER",
        channels: ["EMAIL", "SMS"],
        subject: "Pedido Confirmado #{{orderNumber}}",
        emailTemplate: "order-confirmation",
        smsTemplate:
          "Seu pedido #{{orderNumber}} foi confirmado! Total: R$ {{amount}}",
        active: true,
      },
      "payment-confirmed": {
        id: "payment-confirmed",
        name: "Pagamento Confirmado",
        type: "PAYMENT",
        channels: ["EMAIL", "PUSH"],
        subject: "Pagamento Confirmado - Pedido #{{orderNumber}}",
        emailTemplate: "payment-confirmation",
        pushTemplate: "Pagamento do pedido #{{orderNumber}} confirmado!",
        active: true,
      },
      // Adicionar mais templates conforme necessário
    };

    return templates[id] || null;
  }

  private async getUserNotificationPreferences(
    userId?: string,
  ): Promise<NotificationPreferences> {
    if (!userId) {
      return { email: true, sms: false, push: false, whatsapp: false };
    }

    // Em produção, buscar do banco de dados
    return { email: true, sms: true, push: true, whatsapp: false };
  }

  private shouldSendToChannel(
    channel: string,
    preferences: NotificationPreferences,
  ): boolean {
    switch (channel) {
      case "EMAIL":
        return preferences.email;
      case "SMS":
        return preferences.sms;
      case "PUSH":
        return preferences.push;
      case "WHATSAPP":
        return preferences.whatsapp;
      default:
        return false;
    }
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;

    Object.keys(data).forEach((key) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, "g"), data[key]);
    });

    return processed;
  }

  private async getOrderData(orderId: string): Promise<any> {
    try {
      return await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
      });
    } catch (error) {
      this.logger.error("Erro ao buscar dados do pedido:", error);
      return null;
    }
  }

  private async getProductData(productId: string): Promise<any> {
    try {
      return await this.prisma.product.findUnique({
        where: { id: productId },
      });
    } catch (error) {
      this.logger.error("Erro ao buscar dados do produto:", error);
      return null;
    }
  }

  private async getAdminUsers(): Promise<any[]> {
    try {
      return await this.prisma.user.findMany({
        where: {
          role: "ADMIN",
          active: true,
        },
      });
    } catch (error) {
      this.logger.error("Erro ao buscar administradores:", error);
      return [];
    }
  }

  private async getUsersInterestedInProduct(productId: string): Promise<any[]> {
    // Em produção, implementar sistema de favoritos/wishlist
    return [];
  }
}
