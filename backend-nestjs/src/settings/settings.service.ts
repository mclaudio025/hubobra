import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class SettingsService {
  private readonly encryptionKey =
    process.env.ENCRYPTION_KEY || "default-key-change-in-production";

  constructor(private prisma: PrismaService) { }

  private encrypt(text: string): string {
    const iv = Buffer.alloc(16, 0); // IV fixo para compatibilidade
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  private decrypt(encryptedText: string): string {
    const iv = Buffer.alloc(16, 0); // IV fixo para compatibilidade
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async getAllSettings(category?: string) {
    const where = category ? { category, active: true } : { active: true };

    const settings = await this.prisma.setting.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }, { label: "asc" }],
    });

    // Descriptografar valores se necessário
    return settings.map((setting) => {
      try {
        return {
          ...setting,
          value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
        };
      } catch (error) {
        console.warn(`[Settings] Falha ao descriptografar chave "${setting.key}". Usando valor bruto.`);
        return {
          ...setting,
          value: setting.value,
        };
      }
    });
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Configuração '${key}' não encontrada`);
    }

    return {
      ...setting,
      value: setting.encrypted ? this.decrypt(setting.value) : setting.value,
    };
  }

  async getSettingValue(key: string, defaultValue?: any) {
    try {
      const setting = await this.getSettingByKey(key);

      // Converter valor baseado no tipo
      switch (setting.type) {
        case "BOOLEAN":
          return setting.value === "true";
        case "NUMBER":
          return parseFloat(setting.value);
        case "JSON":
          return JSON.parse(setting.value);
        default:
          return setting.value;
      }
    } catch (error) {
      return defaultValue;
    }
  }

  async updateSetting(key: string, value: any) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Configuração '${key}' não encontrada`);
    }

    // Converter valor para string
    let stringValue: string;
    if (typeof value === "object") {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    // Criptografar se necessário
    const finalValue = setting.encrypted
      ? this.encrypt(stringValue)
      : stringValue;

    return this.prisma.setting.update({
      where: { key },
      data: {
        value: finalValue,
        updatedAt: new Date(),
      },
    });
  }

  async createSetting(data: {
    key: string;
    value: any;
    type?: string;
    category?: string;
    label: string;
    description?: string;
    required?: boolean;
    encrypted?: boolean;
    order?: number;
  }) {
    // Converter valor para string
    let stringValue: string;
    if (typeof data.value === "object") {
      stringValue = JSON.stringify(data.value);
    } else {
      stringValue = String(data.value);
    }

    // Criptografar se necessário
    const finalValue = data.encrypted ? this.encrypt(stringValue) : stringValue;

    return this.prisma.setting.create({
      data: {
        ...data,
        value: finalValue,
      },
    });
  }

  async deleteSetting(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Configuração '${key}' não encontrada`);
    }

    return this.prisma.setting.delete({
      where: { key },
    });
  }

  async getAISettings() {
    return this.getAllSettings("AI");
  }

  async getWhatsAppSettings() {
    return this.getAllSettings("WHATSAPP");
  }

  async bulkUpdateSettings(settings: Array<{ key: string; value: any }>) {
    const results = [];

    for (const setting of settings) {
      try {
        const result = await this.updateSetting(setting.key, setting.value);
        results.push({ key: setting.key, success: true, result });
      } catch (error) {
        results.push({
          key: setting.key,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      message: "Atualização em lote concluída",
      results,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  async initializeDefaultSettings() {
    const defaultSettings = [
      // Configurações de IA
      {
        key: "ai_provider",
        value: "openai",
        type: "TEXT",
        category: "AI",
        label: "Provedor de IA",
        description: "Provedor de IA a ser usado (openai, gemini, anthropic)",
        required: true,
        order: 1,
      },
      {
        key: "openai_api_key",
        value: "",
        type: "PASSWORD",
        category: "AI",
        label: "Chave API OpenAI",
        description: "Chave da API do OpenAI",
        required: false,
        encrypted: true,
        order: 2,
      },
      {
        key: "gemini_api_key",
        value: "",
        type: "PASSWORD",
        category: "AI",
        label: "Chave API Gemini",
        description: "Chave da API do Google Gemini",
        required: false,
        encrypted: true,
        order: 3,
      },
      {
        key: "ai_model",
        value: "gpt-3.5-turbo",
        type: "TEXT",
        category: "AI",
        label: "Modelo de IA",
        description: "Modelo específico a ser usado",
        required: true,
        order: 4,
      },
      {
        key: "ai_temperature",
        value: "0.7",
        type: "NUMBER",
        category: "AI",
        label: "Temperatura da IA",
        description: "Controla a criatividade das respostas (0.0 a 1.0)",
        required: true,
        order: 5,
      },
      {
        key: "ai_max_tokens",
        value: "1000",
        type: "NUMBER",
        category: "AI",
        label: "Máximo de Tokens",
        description: "Número máximo de tokens por resposta",
        required: true,
        order: 6,
      },
      {
        key: "system_prompt",
        value: `Você é o Zé da Obra 2.0, um assistente especializado em materiais de construção e reformas. Você trabalha para uma loja de materiais de construção e deve:

1. Ser sempre prestativo e educado
2. Fornecer informações técnicas precisas sobre materiais de construção
3. Ajudar com cálculos de materiais para projetos
4. Recomendar produtos da loja quando apropriado
5. Dar dicas práticas de construção e reforma
6. Manter um tom amigável e profissional
7. Sempre priorizar a segurança nas recomendações

Quando não souber algo específico, seja honesto e sugira que o cliente consulte um profissional qualificado.`,
        type: "TEXT",
        category: "AI",
        label: "Prompt do Sistema",
        description: "Prompt base que define o comportamento da IA",
        required: true,
        order: 7,
      },

      // Configurações do WhatsApp
      {
        key: "whatsapp_enabled",
        value: "false",
        type: "BOOLEAN",
        category: "WHATSAPP",
        label: "WhatsApp Habilitado",
        description: "Habilitar integração com WhatsApp",
        required: true,
        order: 1,
      },
      {
        key: "whatsapp_number",
        value: "",
        type: "TEXT",
        category: "WHATSAPP",
        label: "Número do WhatsApp",
        description:
          "Número do WhatsApp no formato internacional (ex: 5511999999999)",
        required: false,
        order: 2,
      },
      {
        key: "whatsapp_api_url",
        value: "",
        type: "TEXT",
        category: "WHATSAPP",
        label: "URL da API WhatsApp",
        description: "URL da API do WhatsApp Business",
        required: false,
        order: 3,
      },
      {
        key: "whatsapp_api_token",
        value: "",
        type: "PASSWORD",
        category: "WHATSAPP",
        label: "Token da API WhatsApp",
        description: "Token de autenticação da API do WhatsApp",
        required: false,
        encrypted: true,
        order: 4,
      },
      {
        key: "whatsapp_welcome_message",
        value:
          "Olá! 👋 Sou o Zé da Obra 2.0, seu assistente especializado em materiais de construção. Como posso ajudar você hoje?",
        type: "TEXT",
        category: "WHATSAPP",
        label: "Mensagem de Boas-vindas",
        description: "Mensagem enviada quando alguém inicia uma conversa",
        required: true,
        order: 5,
      },

      // Configurações Gerais
      {
        key: "store_name",
        value: "Loja Moderna",
        type: "TEXT",
        category: "GENERAL",
        label: "Nome da Loja",
        description: "Nome da loja exibido no sistema",
        required: true,
        order: 1,
      },
      {
        key: "carousel_autoplay_interval",
        value: "5000",
        type: "NUMBER",
        category: "GENERAL",
        label: "Intervalo do Carrossel (ms)",
        description:
          "Tempo em milissegundos entre as transições automáticas do carrossel principal",
        required: true,
        order: 2,
      },
      {
        key: "store_phone",
        value: "",
        type: "TEXT",
        category: "GENERAL",
        label: "Telefone da Loja",
        description: "Telefone principal da loja",
        required: false,
        order: 3,
      },
      {
        key: "store_email",
        value: "",
        type: "TEXT",
        category: "GENERAL",
        label: "Email da Loja",
        description: "Email principal da loja",
        required: false,
        order: 4,
      },
      {
        key: "store_address",
        value: "",
        type: "TEXT",
        category: "GENERAL",
        label: "Endereço da Loja",
        description: "Endereço completo da loja",
        required: false,
        order: 5,
      },
    ];

    for (const setting of defaultSettings) {
      const exists = await this.prisma.setting.findUnique({
        where: { key: setting.key },
      });

      if (!exists) {
        await this.createSetting(setting);
      }
    }

    return { message: "Configurações padrão inicializadas" };
  }
}
