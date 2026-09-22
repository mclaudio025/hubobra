import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import { MailService } from "./mail.service";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribed: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  preferences: {
    promotions: boolean;
    newProducts: boolean;
    tips: boolean;
  };
}

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  template: string;
  scheduledFor?: Date;
  sentAt?: Date;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
    private mailService: MailService,
  ) {}

  // Gerenciamento de Assinantes

  async subscribe(
    email: string,
    name?: string,
    preferences?: Partial<NewsletterSubscriber["preferences"]>,
  ): Promise<NewsletterSubscriber> {
    try {
      // Verificar se já existe
      const existing = await this.findSubscriberByEmail(email);

      if (existing) {
        if (existing.subscribed) {
          throw new BadRequestException("Email já está inscrito na newsletter");
        }

        // Reativar assinatura
        const updated = await this.updateSubscriber(existing.id, {
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          name: name || existing.name,
          preferences: { ...existing.preferences, ...preferences },
        });

        this.customLogger.logBusinessEvent("Newsletter Resubscribed", {
          email,
          subscriberId: existing.id,
        });

        return updated;
      }

      // Criar nova assinatura
      const subscriber = await this.createSubscriber({
        email,
        name,
        subscribed: true,
        subscribedAt: new Date(),
        preferences: {
          promotions: true,
          newProducts: true,
          tips: false,
          ...preferences,
        },
      });

      // Enviar email de boas-vindas
      await this.sendWelcomeEmail(subscriber);

      this.customLogger.logBusinessEvent("Newsletter Subscribed", {
        email,
        subscriberId: subscriber.id,
      });

      return subscriber;
    } catch (error) {
      this.logger.error("Erro ao inscrever na newsletter:", error);
      throw error;
    }
  }

  async unsubscribe(email: string, reason?: string): Promise<boolean> {
    try {
      const subscriber = await this.findSubscriberByEmail(email);

      if (!subscriber || !subscriber.subscribed) {
        return false;
      }

      await this.updateSubscriber(subscriber.id, {
        subscribed: false,
        unsubscribedAt: new Date(),
      });

      this.customLogger.logBusinessEvent("Newsletter Unsubscribed", {
        email,
        subscriberId: subscriber.id,
        reason,
      });

      return true;
    } catch (error) {
      this.logger.error("Erro ao cancelar newsletter:", error);
      return false;
    }
  }

  async updatePreferences(
    email: string,
    preferences: Partial<NewsletterSubscriber["preferences"]>,
  ): Promise<NewsletterSubscriber | null> {
    try {
      const subscriber = await this.findSubscriberByEmail(email);

      if (!subscriber) {
        return null;
      }

      return this.updateSubscriber(subscriber.id, {
        preferences: { ...subscriber.preferences, ...preferences },
      });
    } catch (error) {
      this.logger.error("Erro ao atualizar preferências:", error);
      return null;
    }
  }

  // Campanhas de Newsletter

  async createCampaign(campaignData: {
    title: string;
    subject: string;
    content: string;
    template?: string;
    scheduledFor?: Date;
    targetAudience?: "ALL" | "PROMOTIONS" | "NEW_PRODUCTS" | "TIPS";
  }): Promise<NewsletterCampaign> {
    try {
      const campaign = await this.saveCampaign({
        ...campaignData,
        template: campaignData.template || "newsletter-default",
        status: campaignData.scheduledFor ? "SCHEDULED" : "DRAFT",
        recipientCount: await this.getTargetAudienceCount(
          campaignData.targetAudience,
        ),
      });

      this.customLogger.logBusinessEvent("Newsletter Campaign Created", {
        campaignId: campaign.id,
        title: campaign.title,
        scheduledFor: campaign.scheduledFor,
      });

      return campaign;
    } catch (error) {
      this.logger.error("Erro ao criar campanha:", error);
      throw error;
    }
  }

  async sendCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = await this.getCampaign(campaignId);

      if (!campaign || campaign.status === "SENT") {
        throw new BadRequestException("Campanha não encontrada ou já enviada");
      }

      // Atualizar status para enviando
      await this.updateCampaignStatus(campaignId, "SENDING");

      // Obter lista de destinatários
      const recipients = await this.getActiveSubscribers();

      if (recipients.length === 0) {
        throw new BadRequestException("Nenhum assinante ativo encontrado");
      }

      // Enviar emails em lotes para evitar sobrecarga
      const batchSize = 50;
      let sentCount = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        const emailPromises = batch.map((subscriber) =>
          this.mailService.sendEmail({
            to: subscriber.email,
            subject: campaign.subject,
            template: campaign.template,
            context: {
              subscriberName: subscriber.name || "Cliente",
              campaignTitle: campaign.title,
              content: campaign.content,
              unsubscribeUrl: this.generateUnsubscribeUrl(subscriber.email),
              preferencesUrl: this.generatePreferencesUrl(subscriber.email),
            },
          }),
        );

        const results = await Promise.allSettled(emailPromises);
        sentCount += results.filter(
          (result) => result.status === "fulfilled",
        ).length;

        // Pequena pausa entre lotes
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Atualizar campanha como enviada
      await this.updateCampaign(campaignId, {
        status: "SENT",
        sentAt: new Date(),
        recipientCount: sentCount,
      });

      this.customLogger.logBusinessEvent("Newsletter Campaign Sent", {
        campaignId,
        recipientCount: sentCount,
        totalSubscribers: recipients.length,
      });

      this.logger.log(
        `Campanha ${campaignId} enviada para ${sentCount} assinantes`,
      );
      return true;
    } catch (error) {
      this.logger.error("Erro ao enviar campanha:", error);
      await this.updateCampaignStatus(campaignId, "DRAFT");
      throw error;
    }
  }

  async scheduleCampaign(
    campaignId: string,
    scheduledFor: Date,
  ): Promise<boolean> {
    try {
      await this.updateCampaign(campaignId, {
        scheduledFor,
        status: "SCHEDULED",
      });

      this.customLogger.logBusinessEvent("Newsletter Campaign Scheduled", {
        campaignId,
        scheduledFor,
      });

      return true;
    } catch (error) {
      this.logger.error("Erro ao agendar campanha:", error);
      return false;
    }
  }

  // Automações

  async sendWelcomeEmail(subscriber: NewsletterSubscriber): Promise<boolean> {
    return this.mailService.sendEmail({
      to: subscriber.email,
      subject: "Bem-vindo à nossa Newsletter!",
      template: "newsletter-welcome",
      context: {
        subscriberName: subscriber.name || "Cliente",
        preferences: subscriber.preferences,
        unsubscribeUrl: this.generateUnsubscribeUrl(subscriber.email),
        preferencesUrl: this.generatePreferencesUrl(subscriber.email),
      },
    });
  }

  async sendNewProductAlert(productData: {
    name: string;
    description: string;
    price: number;
    image: string;
    url: string;
    category: string;
  }): Promise<boolean> {
    try {
      const subscribers = await this.getSubscribersByPreference("newProducts");

      if (subscribers.length === 0) {
        return false;
      }

      const emailPromises = subscribers.map((subscriber) =>
        this.mailService.sendEmail({
          to: subscriber.email,
          subject: `Novo Produto: ${productData.name}`,
          template: "new-product-alert",
          context: {
            subscriberName: subscriber.name || "Cliente",
            product: productData,
            unsubscribeUrl: this.generateUnsubscribeUrl(subscriber.email),
          },
        }),
      );

      await Promise.allSettled(emailPromises);

      this.customLogger.logBusinessEvent("New Product Alert Sent", {
        productName: productData.name,
        recipientCount: subscribers.length,
      });

      return true;
    } catch (error) {
      this.logger.error("Erro ao enviar alerta de novo produto:", error);
      return false;
    }
  }

  // Métodos auxiliares privados

  private async createSubscriber(
    data: Partial<NewsletterSubscriber>,
  ): Promise<NewsletterSubscriber> {
    // Em produção, implementar com tabela específica de newsletter
    // Por enquanto, usar dados mock
    const subscriber: NewsletterSubscriber = {
      id: `sub_${Date.now()}`,
      email: data.email!,
      name: data.name,
      subscribed: data.subscribed!,
      subscribedAt: data.subscribedAt!,
      unsubscribedAt: data.unsubscribedAt,
      preferences: data.preferences!,
    };

    return subscriber;
  }

  private async findSubscriberByEmail(
    email: string,
  ): Promise<NewsletterSubscriber | null> {
    // Mock implementation
    return null;
  }

  private async updateSubscriber(
    id: string,
    data: Partial<NewsletterSubscriber>,
  ): Promise<NewsletterSubscriber> {
    // Mock implementation
    return {} as NewsletterSubscriber;
  }

  private async getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
    // Mock implementation
    return [];
  }

  private async getSubscribersByPreference(
    preference: keyof NewsletterSubscriber["preferences"],
  ): Promise<NewsletterSubscriber[]> {
    // Mock implementation
    return [];
  }

  private async saveCampaign(
    data: Partial<NewsletterCampaign>,
  ): Promise<NewsletterCampaign> {
    // Mock implementation
    return {
      id: `camp_${Date.now()}`,
      ...data,
    } as NewsletterCampaign;
  }

  private async getCampaign(id: string): Promise<NewsletterCampaign | null> {
    // Mock implementation
    return null;
  }

  private async updateCampaign(
    id: string,
    data: Partial<NewsletterCampaign>,
  ): Promise<void> {
    // Mock implementation
  }

  private async updateCampaignStatus(
    id: string,
    status: NewsletterCampaign["status"],
  ): Promise<void> {
    // Mock implementation
  }

  private async getTargetAudienceCount(audience?: string): Promise<number> {
    // Mock implementation
    return 0;
  }

  private generateUnsubscribeUrl(email: string): string {
    const token = Buffer.from(email).toString("base64");
    return `${process.env.FRONTEND_URL}/newsletter/unsubscribe?token=${token}`;
  }

  private generatePreferencesUrl(email: string): string {
    const token = Buffer.from(email).toString("base64");
    return `${process.env.FRONTEND_URL}/newsletter/preferences?token=${token}`;
  }

  // Estatísticas

  async getNewsletterStats(): Promise<{
    totalSubscribers: number;
    activeSubscribers: number;
    totalCampaigns: number;
    avgOpenRate: number;
    avgClickRate: number;
    recentCampaigns: NewsletterCampaign[];
  }> {
    // Mock implementation
    return {
      totalSubscribers: 0,
      activeSubscribers: 0,
      totalCampaigns: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      recentCampaigns: [],
    };
  }
}
