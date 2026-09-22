import { Controller, Get, Post, Body, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { UserRole } from "../common/enums";

import { MailService } from "./mail.service";
import { NewsletterService } from "./newsletter.service";
import { NotificationService } from "./notification.service";

@Controller("mail")
export class MailController {
  constructor(
    private mailService: MailService,
    private newsletterService: NewsletterService,
    private notificationService: NotificationService,
  ) {}

  // Endpoints de Email Transacional

  @Post("send-order-confirmation")
  @UseGuards(JwtAuthGuard)
  async sendOrderConfirmation(
    @Body()
    data: {
      customerName: string;
      customerEmail: string;
      orderNumber: string;
      orderId: string;
      amount: number;
      items: any[];
      paymentMethod: string;
      deliveryAddress?: string;
    },
  ) {
    const success = await this.mailService.sendOrderConfirmation(data);
    return {
      success,
      message: success ? "Email enviado" : "Erro ao enviar email",
    };
  }

  @Post("send-payment-confirmation")
  @UseGuards(JwtAuthGuard)
  async sendPaymentConfirmation(
    @Body()
    data: {
      customerName: string;
      customerEmail: string;
      orderNumber: string;
      amount: number;
      paymentMethod: string;
    },
  ) {
    const success = await this.mailService.sendPaymentConfirmation(data);
    return {
      success,
      message: success ? "Email enviado" : "Erro ao enviar email",
    };
  }

  @Post("send-order-shipped")
  @UseGuards(JwtAuthGuard)
  async sendOrderShipped(
    @Body()
    data: {
      customerName: string;
      customerEmail: string;
      orderNumber: string;
      trackingCode: string;
      deliveryAddress: string;
    },
  ) {
    const success = await this.mailService.sendOrderShipped(data);
    return {
      success,
      message: success ? "Email enviado" : "Erro ao enviar email",
    };
  }

  @Post("send-welcome")
  @UseGuards(JwtAuthGuard)
  async sendWelcomeEmail(
    @Body() data: { customerName: string; customerEmail: string },
  ) {
    const success = await this.mailService.sendWelcomeEmail(
      data.customerName,
      data.customerEmail,
    );
    return {
      success,
      message: success ? "Email enviado" : "Erro ao enviar email",
    };
  }

  // Endpoints de Newsletter

  @Post("newsletter/subscribe")
  async subscribeNewsletter(
    @Body()
    data: {
      email: string;
      name?: string;
      preferences?: {
        promotions?: boolean;
        newProducts?: boolean;
        tips?: boolean;
      };
    },
  ) {
    try {
      const subscriber = await this.newsletterService.subscribe(
        data.email,
        data.name,
        data.preferences,
      );
      return {
        success: true,
        message: "Inscrição realizada com sucesso",
        subscriber: {
          id: subscriber.id,
          email: subscriber.email,
          preferences: subscriber.preferences,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro ao inscrever na newsletter",
      };
    }
  }

  @Post("newsletter/unsubscribe")
  async unsubscribeNewsletter(
    @Body() data: { email: string; reason?: string },
  ) {
    const success = await this.newsletterService.unsubscribe(
      data.email,
      data.reason,
    );
    return {
      success,
      message: success
        ? "Inscrição cancelada"
        : "Email não encontrado ou já cancelado",
    };
  }

  @Post("newsletter/update-preferences")
  async updateNewsletterPreferences(
    @Body()
    data: {
      email: string;
      preferences: {
        promotions?: boolean;
        newProducts?: boolean;
        tips?: boolean;
      };
    },
  ) {
    const subscriber = await this.newsletterService.updatePreferences(
      data.email,
      data.preferences,
    );
    return {
      success: !!subscriber,
      message: subscriber ? "Preferências atualizadas" : "Email não encontrado",
      subscriber: subscriber
        ? {
            email: subscriber.email,
            preferences: subscriber.preferences,
          }
        : null,
    };
  }

  // Endpoints Administrativos

  @Post("newsletter/campaign/create")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createNewsletterCampaign(
    @Body()
    data: {
      title: string;
      subject: string;
      content: string;
      template?: string;
      scheduledFor?: string;
      targetAudience?: string;
    },
  ) {
    try {
      const campaign = await this.newsletterService.createCampaign({
        title: data.title,
        subject: data.subject,
        content: data.content,
        template: data.template,
        scheduledFor: data.scheduledFor
          ? new Date(data.scheduledFor)
          : undefined,
        targetAudience:
          (data.targetAudience as
            | "ALL"
            | "PROMOTIONS"
            | "NEW_PRODUCTS"
            | "TIPS") || "ALL",
      });
      return { success: true, campaign };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("newsletter/campaign/:id/send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendNewsletterCampaign(@Body() body: { campaignId: string }) {
    try {
      const success = await this.newsletterService.sendCampaign(
        body.campaignId,
      );
      return {
        success,
        message: success ? "Campanha enviada" : "Erro ao enviar campanha",
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get("newsletter/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getNewsletterStats() {
    return this.newsletterService.getNewsletterStats();
  }

  // Endpoints de Notificação

  @Post("notification/send")
  @UseGuards(JwtAuthGuard)
  async sendNotification(
    @Body()
    data: {
      userId?: string;
      email?: string;
      phone?: string;
      name?: string;
      templateId: string;
      data: Record<string, any>;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    },
  ) {
    const success = await this.notificationService.sendNotification({
      ...data,
      priority: data.priority || "NORMAL",
    });
    return {
      success,
      message: success ? "Notificação enviada" : "Erro ao enviar notificação",
    };
  }

  @Post("notification/preferences")
  @UseGuards(JwtAuthGuard)
  async updateNotificationPreferences(
    @GetUser() user: any,
    @Body()
    preferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
      whatsapp: boolean;
    },
  ) {
    const success =
      await this.notificationService.updateUserNotificationPreferences(
        user.id,
        preferences,
      );
    return {
      success,
      message: success
        ? "Preferências atualizadas"
        : "Erro ao atualizar preferências",
    };
  }

  // Endpoints de Teste e Configuração

  @Post("test-configuration")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testEmailConfiguration() {
    const success = await this.mailService.testEmailConfiguration();
    return {
      success,
      message: success
        ? "Configuração de email OK"
        : "Erro na configuração de email",
    };
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getEmailStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.mailService.getEmailStats(start, end);
  }

  // Webhooks para provedores de email (futuro)

  @Post("webhook/delivery")
  async handleDeliveryWebhook(@Body() data: any) {
    // Implementar webhook para rastreamento de entrega de emails
    console.log("Email delivery webhook:", data);
    return { received: true };
  }

  @Post("webhook/bounce")
  async handleBounceWebhook(@Body() data: any) {
    // Implementar webhook para emails rejeitados
    console.log("Email bounce webhook:", data);
    return { received: true };
  }

  @Post("webhook/complaint")
  async handleComplaintWebhook(@Body() data: any) {
    // Implementar webhook para reclamações de spam
    console.log("Email complaint webhook:", data);
    return { received: true };
  }
}
