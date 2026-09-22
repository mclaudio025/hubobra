import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName: string;
}

export interface WhatsAppResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly evolutionApiUrl: string;
  private readonly instanceName: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.evolutionApiUrl = this.configService.get(
      "EVOLUTION_API_URL",
      "http://localhost:8080",
    );
    this.instanceName = this.configService.get(
      "EVOLUTION_INSTANCE_NAME",
      "loja-moderna",
    );
    this.apiKey = this.configService.get("EVOLUTION_API_KEY", "your-api-key");
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      const url = `${this.evolutionApiUrl}/message/sendText/${this.instanceName}`;

      const payload = {
        number: to,
        text: message,
      };

      this.logger.debug(
        `Sending WhatsApp message to ${to}: ${message.substring(0, 100)}...`,
      );

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            apikey: this.apiKey,
          },
        }),
      );

      this.logger.log(`WhatsApp message sent successfully to ${to}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${to}:`,
        error.message,
      );
      throw error;
    }
  }

  async sendTyping(to: string): Promise<void> {
    try {
      const url = `${this.evolutionApiUrl}/chat/whatsappNumbers/${this.instanceName}`;

      const payload = {
        numbers: [to],
        action: "composing",
      };

      await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            apikey: this.apiKey,
          },
        }),
      );

      this.logger.debug(`Typing indicator sent to ${to}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send typing indicator to ${to}:`,
        error.message,
      );
    }
  }

  async createInstance(): Promise<any> {
    try {
      const url = `${this.evolutionApiUrl}/instance/create`;

      const payload = {
        instanceName: this.instanceName,
        token: this.apiKey,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        webhookUrl: `${this.configService.get("APP_URL", "http://localhost:8081")}/whatsapp/webhook`,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          "APPLICATION_STARTUP",
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "SEND_MESSAGE",
        ],
      };

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            apikey: this.apiKey,
          },
        }),
      );

      this.logger.log(`WhatsApp instance created: ${this.instanceName}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create WhatsApp instance:`, error.message);
      throw error;
    }
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const url = `${this.evolutionApiUrl}/instance/connectionState/${this.instanceName}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            apikey: this.apiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get instance status:`, error.message);
      throw error;
    }
  }

  async getQRCode(): Promise<any> {
    try {
      const url = `${this.evolutionApiUrl}/instance/connect/${this.instanceName}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            apikey: this.apiKey,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get QR code:`, error.message);
      throw error;
    }
  }

  extractMessageText(message: WhatsAppMessage): string {
    if (message.message.conversation) {
      return message.message.conversation;
    }

    if (message.message.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }

    return "";
  }

  extractPhoneNumber(remoteJid: string): string {
    // Remove @s.whatsapp.net e outros sufixos
    return remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
  }

  formatPhoneNumber(phone: string): string {
    // Garantir que o número tenha o formato correto
    let formatted = phone.replace(/\D/g, ""); // Remove tudo que não é dígito

    // Se não começar com 55 (Brasil), adicionar
    if (!formatted.startsWith("55")) {
      formatted = "55" + formatted;
    }

    return formatted;
  }

  isValidMessage(message: WhatsAppMessage): boolean {
    // Ignorar mensagens próprias
    if (message.key.fromMe) {
      return false;
    }

    // Verificar se tem texto
    const text = this.extractMessageText(message);
    if (!text || text.trim().length === 0) {
      return false;
    }

    // Ignorar mensagens de grupos (por enquanto)
    if (message.key.remoteJid.includes("@g.us")) {
      return false;
    }

    return true;
  }
}
