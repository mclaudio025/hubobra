import { Injectable, Logger, Optional } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";

export interface WhatsAppAIMessage {
  phone: string;
  message: string;
  userName: string;
  sessionId: string;
}

export interface PendingPriceChange {
  productId: string;
  productName: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  variationPercent: number;
  isDrasticChange: boolean;
  trainerName: string;
  trainerPhone: string;
  userId?: string;
  expiresAt: number;
}

@Injectable()
export class WhatsAppAIService {
  private readonly logger = new Logger(WhatsAppAIService.name);
  private readonly iaServiceUrl: string;
  private readonly welcomeMessage: string;
  private readonly conversationCache = new Map<string, any[]>();
  private readonly pendingPriceConfirmations = new Map<string, PendingPriceChange>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: CacheService,
  ) {
    this.iaServiceUrl = this.configService.get(
      "IA_SERVICE_URL",
      "http://localhost:8000",
    );
    this.welcomeMessage = this.configService.get(
      "WHATSAPP_WELCOME_MESSAGE",
      "👋 Olá! Sou a *Lia*, sua consultora de vendas da *HubConstruções*! 🏬\n\nEstou aqui para consultar nossos produtos em estoque, melhores preços e fechar seu pedido com entrega rápida.\n\nE se você precisar de *cálculos de materiais ou dicas técnicas de aplicação*, meu parceiro *Zé da Obra* 👷‍♂️ entra na conversa para te orientar!\n\nComo posso te ajudar hoje?",
    );
  }

  async processMessage(data: WhatsAppAIMessage): Promise<string> {
    try {
      // 1. Verificar se há confirmação de alteração de preço pendente para este telefone
      const pendingPriceResult = await this.handlePendingPriceConfirmation(data);
      if (pendingPriceResult) {
        return this.formatWhatsAppMessage(pendingPriceResult);
      }

      // 2. Verificar se a mensagem é um comando ou intenção de alteração de preço
      const priceIntent = this.parsePriceChangeIntent(data.message);
      if (priceIntent) {
        const priceChangeResult = await this.handlePriceChangeRequest(data, priceIntent);
        return this.formatWhatsAppMessage(priceChangeResult);
      }

      // 3. Verificar se é primeira interação / saudação inicial
      if (this.isGreeting(data.message)) {
        return this.getWelcomeMessage(data.userName);
      }

      // 4. Obter histórico da conversa
      const conversationHistory = this.getConversationHistory(data.sessionId);

      // 5. Preparar contexto para IA
      const aiRequest = {
        message: data.message,
        user_name: data.userName,
        session_id: data.sessionId,
        channel: "whatsapp",
        conversation_history: conversationHistory,
        context: {
          platform: "whatsapp",
          phone: data.phone,
          timestamp: new Date().toISOString(),
        },
      };

      this.logger.debug(`Sending to IA service:`, aiRequest);

      // Chamar serviço de IA externo (se disponível)
      try {
        const response = await firstValueFrom(
          this.httpService.post(`${this.iaServiceUrl}/chat`, aiRequest, {
            timeout: 30000,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );

        const aiResponse =
          response.data.response ||
          response.data.message ||
          "Desculpe, não consegui processar sua mensagem.";

        this.updateConversationHistory(data.sessionId, data.message, aiResponse);
        return this.formatWhatsAppMessage(aiResponse);
      } catch (aiErr) {
        // Fallback para motor de regras e catálogo real em banco
        return await this.getSimulatedResponse(data.message, data.userName);
      }
    } catch (error) {
      this.logger.error("WhatsApp AI service error:", error.message);
      return await this.getSimulatedResponse(data.message, data.userName);
    }
  }

  // ==========================================
  // AUTORIZAÇÃO E ALTERAÇÃO DE PREÇOS (LIA)
  // ==========================================

  /**
   * Extrai e normaliza variações numéricas de telefones brasileiros
   */
  private extractCleanPhoneNumbers(rawPhone: string): string[] {
    const digits = (rawPhone || "").replace(/\D/g, "");
    if (!digits) return [];

    const variants = new Set<string>();
    variants.add(digits);

    if (digits.startsWith("55") && digits.length >= 12) {
      const withoutCountry = digits.substring(2);
      variants.add(withoutCountry);

      if (withoutCountry.length === 11) {
        const ddd = withoutCountry.substring(0, 2);
        const rest = withoutCountry.substring(3);
        variants.add(`55${ddd}${rest}`);
        variants.add(`${ddd}${rest}`);
      } else if (withoutCountry.length === 10) {
        const ddd = withoutCountry.substring(0, 2);
        const rest = withoutCountry.substring(2);
        variants.add(`55${ddd}9${rest}`);
        variants.add(`${ddd}9${rest}`);
      }
    } else if (digits.length === 11) {
      const ddd = digits.substring(0, 2);
      const rest = digits.substring(3);
      variants.add(`55${digits}`);
      variants.add(`55${ddd}${rest}`);
      variants.add(`${ddd}${rest}`);
    } else if (digits.length === 10) {
      const ddd = digits.substring(0, 2);
      const rest = digits.substring(2);
      variants.add(`55${digits}`);
      variants.add(`55${ddd}9${rest}`);
      variants.add(`${ddd}9${rest}`);
    }

    return Array.from(variants);
  }

  /**
   * Identifica se o remetente é um treinador, administrador ou gerente autorizado
   */
  private async getAuthorizedTrainerOrAdmin(
    rawPhone: string,
  ): Promise<{ authorized: boolean; name: string; role: string; userId?: string }> {
    const phoneVariants = this.extractCleanPhoneNumbers(rawPhone);
    if (phoneVariants.length === 0) {
      return { authorized: false, name: "", role: "" };
    }

    try {
      // 1. Checar na tabela ai_trainers
      const trainer = await this.prisma.aiTrainer.findFirst({
        where: {
          phone: { in: phoneVariants },
          isActive: true,
        },
      });

      if (trainer) {
        const adminUser = await this.prisma.user.findFirst({
          where: {
            role: { in: ["ADMIN", "STORE_ADMIN", "SUPER_ADMIN", "MANAGER"] },
            active: true,
          },
        });

        return {
          authorized: true,
          name: trainer.name || "Treinador Autorizado",
          role: trainer.role === "master_trainer" ? "Master Trainer" : "Administrador / Gerente",
          userId: adminUser?.id,
        };
      }
    } catch (err) {
      this.logger.warn("Erro ao consultar ai_trainers no banco:", err?.message || err);
    }

    // 2. Checar se é um usuário com permissão administrativa no banco
    try {
      const adminUser = await this.prisma.user.findFirst({
        where: {
          role: { in: ["ADMIN", "STORE_ADMIN", "SUPER_ADMIN", "MANAGER"] },
          active: true,
        },
      });

      if (adminUser) {
        // Se houver admin cadastrado, permitir caso o telefone corresponda
        return {
          authorized: false,
          name: adminUser.name,
          role: adminUser.role,
          userId: adminUser.id,
        };
      }
    } catch (err) {}

    return { authorized: false, name: "", role: "" };
  }

  /**
   * Reconhece a intenção de alteração de preço por linguagem natural ou comando direto
   */
  private parsePriceChangeIntent(
    message: string,
  ): { productQuery: string; targetPrice: number } | null {
    if (!message || typeof message !== "string") return null;
    const cleanMsg = message.trim();

    // 1. Comando Direto: #preco [produto/sku] [valor] ou !preco [produto/sku] [valor]
    const cmdMatch = cleanMsg.match(
      /^[#!](?:preco|preço|price)\s+(.+?)\s+(?:para|por|em)?\s*(?:r\$\s*)?([0-9]+(?:[.,][0-9]{1,2})?)$/i,
    );
    if (cmdMatch) {
      const productQuery = cmdMatch[1].trim();
      const targetPrice = parseFloat(cmdMatch[2].replace(",", "."));
      if (productQuery && !isNaN(targetPrice) && targetPrice > 0) {
        return { productQuery, targetPrice };
      }
    }

    // 2. Linguagem Natural Principal:
    // Ex: "Lia, altera o preço do cimento poty para 34,90"
    // Ex: "Lia, mudar preco do vedatop 18kg para 95.00"
    const nlRegex =
      /(?:^|\b)(?:lia[,\s]+)?(?:alterar?|mudar?|atualizar?|trocar?|colocar?|definir|ajustar?|reajustar?)\s+(?:o\s+)?(?:preço|preco|valor)\s+(?:do|da|de|para|do\s+produto|da\s+mercadoria)?\s*(.+?)\s+(?:para|por|em|pra)\s+(?:r\$\s*)?([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*(?:reais|conto))?(?:[.!?,]|$)/i;
    const nlMatch = cleanMsg.match(nlRegex);
    if (nlMatch) {
      const productQuery = nlMatch[1]
        .replace(/^(do|da|de|o|a|os|as)\s+/i, "")
        .trim();
      const targetPrice = parseFloat(nlMatch[2].replace(",", "."));
      if (productQuery && !isNaN(targetPrice) && targetPrice > 0) {
        return { productQuery, targetPrice };
      }
    }

    // 3. Linguagem Natural Variante 2:
    // Ex: "Lia, bota o cimento poty por 33,50" ou "coloca o tijolo 8 furos por 1,20"
    const nlVarRegex =
      /(?:^|\b)(?:lia[,\s]+)?(?:botar?|colocar?|definir?|deixar?)\s+(?:o\s+|a\s+)?(.+?)\s+(?:por|em|no\s+valor\s+de|no\s+preço\s+de|pra)\s+(?:r\$\s*)?([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*(?:reais|conto))?(?:[.!?,]|$)/i;
    const nlVarMatch = cleanMsg.match(nlVarRegex);
    if (nlVarMatch) {
      const productQuery = nlVarMatch[1]
        .replace(/^(do|da|de|o|a|os|as)\s+/i, "")
        .trim();
      const targetPrice = parseFloat(nlVarMatch[2].replace(",", "."));
      if (productQuery && !isNaN(targetPrice) && targetPrice > 0) {
        return { productQuery, targetPrice };
      }
    }

    // 4. Linguagem Natural Variante 3:
    // Ex: "Lia, o preço do cimento apodi agora é 34.00"
    const nlVar3Regex =
      /(?:^|\b)(?:lia[,\s]+)?(?:o\s+)?(?:novo\s+)?(?:preço|preco|valor)\s+(?:do|da|de)\s+(.+?)\s+(?:agora\s+)?(?:é|e|ficou|vai\s+ser)\s+(?:r\$\s*)?([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*(?:reais|conto))?(?:[.!?,]|$)/i;
    const nlVar3Match = cleanMsg.match(nlVar3Regex);
    if (nlVar3Match) {
      const productQuery = nlVar3Match[1]
        .replace(/^(do|da|de|o|a|os|as)\s+/i, "")
        .trim();
      const targetPrice = parseFloat(nlVar3Match[2].replace(",", "."));
      if (productQuery && !isNaN(targetPrice) && targetPrice > 0) {
        return { productQuery, targetPrice };
      }
    }

    return null;
  }

  /**
   * Busca o produto correspondente no catálogo por SKU ou termos de busca
   */
  private async findProductForPriceChange(query: string) {
    const cleanQuery = query.trim();

    // 1. Busca direta por SKU exato
    const exactSku = await this.prisma.product.findUnique({
      where: { sku: cleanQuery },
      include: { category: true },
    });
    if (exactSku) return { product: exactSku, alternatives: [] };

    // 2. Busca por SKU case-insensitive
    const skuMatch = await this.prisma.product.findFirst({
      where: { sku: { equals: cleanQuery, mode: "insensitive" } },
      include: { category: true },
    });
    if (skuMatch) return { product: skuMatch, alternatives: [] };

    // 3. Busca refinada por palavras-chave no nome e descrição
    const stopWords = new Set([
      "o", "a", "os", "as", "do", "da", "de", "dos", "das", "produto", "mercadoria", "item", "unidade", "marca",
    ]);
    const keywords = cleanQuery
      .split(/\s+/)
      .filter((k) => k.length >= 2 && !stopWords.has(k.toLowerCase()));

    if (keywords.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          AND: keywords.map((kw) => ({
            OR: [
              { name: { contains: kw, mode: "insensitive" } },
              { description: { contains: kw, mode: "insensitive" } },
              { sku: { contains: kw, mode: "insensitive" } },
              { brand: { contains: kw, mode: "insensitive" } },
            ],
          })),
          active: true,
        },
        take: 5,
        include: { category: true },
        orderBy: { saleCount: "desc" },
      });

      if (products.length === 1) {
        return { product: products[0], alternatives: [] };
      }

      if (products.length > 1) {
        const exactNameMatch = products.find(
          (p) => p.name.toLowerCase() === cleanQuery.toLowerCase(),
        );
        if (exactNameMatch) {
          return { product: exactNameMatch, alternatives: [] };
        }
        return { product: products[0], alternatives: products };
      }
    }

    // 4. Busca ampla com fallback
    const broadProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: "insensitive" } },
          { sku: { contains: cleanQuery, mode: "insensitive" } },
        ],
        active: true,
      },
      take: 5,
      include: { category: true },
    });

    return {
      product: broadProducts[0] || null,
      alternatives: broadProducts,
    };
  }

  /**
   * Processa a solicitação inicial de alteração de preço
   */
  private async handlePriceChangeRequest(
    data: WhatsAppAIMessage,
    priceIntent: { productQuery: string; targetPrice: number },
  ): Promise<string> {
    const auth = await this.getAuthorizedTrainerOrAdmin(data.phone);

    // Verificação de autorização de segurança
    if (!auth.authorized) {
      return (
        `🔒 *Acesso Restrito - Alteração de Preço*\n\n` +
        `Olá, *${data.userName || "Parceiro"}*! Identifiquei uma solicitação para alterar o preço de um produto.\n\n` +
        `Por motivos de segurança e governança, apenas *administradores e gerentes autorizados* possuem permissão para modificar os preços do nosso catálogo.\n\n` +
        `Se você faz parte da equipe e precisa de autorização, solicite o cadastro do seu número no painel de Treinadores da Lia! 💼`
      );
    }

    // Localizar o produto no catálogo
    const { product, alternatives } = await this.findProductForPriceChange(
      priceIntent.productQuery,
    );

    if (!product) {
      return (
        `❌ *Produto não localizado*\n\n` +
        `Olá, *${auth.name}*! Procurei no catálogo por "*${priceIntent.productQuery}*", mas não encontrei nenhum item correspondente.\n\n` +
        `💡 *Dica:* Tente usar o código SKU do produto (ex: \`#preco SKU-1002 34.90\`) ou informe a marca e especificação completa!`
      );
    }

    const oldPrice = product.price;
    const newPrice = priceIntent.targetPrice;
    const diff = newPrice - oldPrice;
    const variationPercent = oldPrice > 0 ? (diff / oldPrice) * 100 : 0;
    const isDrasticChange = Math.abs(variationPercent) >= 50;

    // Salvar estado pendente na memória (TTL de 5 minutos)
    const phoneKey = this.extractCleanPhoneNumbers(data.phone)[0] || data.phone;
    this.pendingPriceConfirmations.set(phoneKey, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      oldPrice,
      newPrice,
      variationPercent,
      isDrasticChange,
      trainerName: auth.name,
      trainerPhone: data.phone,
      userId: auth.userId,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const variationSign = variationPercent >= 0 ? `+${variationPercent.toFixed(1)}% 📈` : `${variationPercent.toFixed(1)}% 📉`;
    let warningAlert = "";
    if (isDrasticChange) {
      warningAlert = `\n\n⚠️ *ALERTA DE SEGURANÇA:* A variação solicitada é de *${Math.abs(variationPercent).toFixed(1)}%* (superior a 50%). Por favor, confira o valor com atenção!`;
    }

    let alternativesNote = "";
    if (alternatives.length > 1) {
      alternativesNote = `\n\n🔍 _Identifiquei outros itens parecidos: ${alternatives.slice(1, 3).map((a) => a.name).join(", ")}._`;
    }

    return (
      `🏷️ *Solicitação de Alteração de Preço*\n\n` +
      `👤 *Solicitante:* ${auth.name} (${auth.role})\n` +
      `📦 *Produto:* *${product.name}*\n` +
      `🔢 *SKU:* \`${product.sku}\`\n` +
      `💵 *Preço Atual:* ${this.formatCurrency(oldPrice)}\n` +
      `✨ *Novo Preço Proposto:* *${this.formatCurrency(newPrice)}*\n` +
      `📊 *Variação:* ${variationSign}` +
      warningAlert +
      alternativesNote +
      `\n\n` +
      `❓ *Confirma a alteração imediata no catálogo e no site?*\n` +
      `👉 _Responda com *SIM* para confirmar ou *NÃO* para cancelar._ (Expira em 5 min)`
    );
  }

  /**
   * Processa resposta de confirmação (Sim/Não) para alteração de preço pendente
   */
  private async handlePendingPriceConfirmation(
    data: WhatsAppAIMessage,
  ): Promise<string | null> {
    const phoneVariants = this.extractCleanPhoneNumbers(data.phone);
    let pending: PendingPriceChange | undefined;
    let matchingKey: string | undefined;

    for (const key of phoneVariants) {
      if (this.pendingPriceConfirmations.has(key)) {
        pending = this.pendingPriceConfirmations.get(key);
        matchingKey = key;
        break;
      }
    }

    if (!pending || !matchingKey) {
      return null;
    }

    // Verificar se a confirmação expirou
    if (Date.now() > pending.expiresAt) {
      this.pendingPriceConfirmations.delete(matchingKey);
      return null;
    }

    // 1. Resposta Afirmativa (Confirmação)
    if (this.isAffirmation(data.message)) {
      try {
        // Atualizar preço do produto
        await this.prisma.product.update({
          where: { id: pending.productId },
          data: {
            price: pending.newPrice,
            updatedAt: new Date(),
          },
        });

        // Resolver usuário responsável para FK de PriceHistory
        let resolvedUserId = pending.userId;
        if (!resolvedUserId) {
          const adminUser = await this.prisma.user.findFirst({
            where: {
              role: { in: ["ADMIN", "STORE_ADMIN", "SUPER_ADMIN", "MANAGER"] },
            },
          });
          resolvedUserId = adminUser?.id;
        }

        // Gravar no histórico de auditoria
        if (resolvedUserId) {
          await this.prisma.priceHistory.create({
            data: {
              productId: pending.productId,
              oldPrice: pending.oldPrice,
              newPrice: pending.newPrice,
              reason: `Alteração solicitada via WhatsApp Lia por ${pending.trainerName} (${pending.trainerPhone})`,
              userId: resolvedUserId,
            },
          });
        }

        // Invalidar cache de produtos
        if (this.cacheService) {
          await this.cacheService.invalidateProductsCache();
        }

        this.logger.log(
          `Preço do produto ${pending.productName} (SKU ${pending.sku}) atualizado de R$ ${pending.oldPrice} para R$ ${pending.newPrice} por ${pending.trainerName}`,
        );

        this.pendingPriceConfirmations.delete(matchingKey);

        const now = new Date();
        const dateFormatted = now.toLocaleDateString("pt-BR");
        const timeFormatted = now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          `✅ *Preço Atualizado com Sucesso!* 🏬🎉\n\n` +
          `📦 *Produto:* *${pending.productName}*\n` +
          `🔢 *SKU:* \`${pending.sku}\`\n` +
          `💵 *Preço Anterior:* ${this.formatCurrency(pending.oldPrice)}\n` +
          `⚡ *Novo Preço Vigente:* *${this.formatCurrency(pending.newPrice)}*\n` +
          `👤 *Responsável:* ${pending.trainerName}\n` +
          `🕒 *Data/Hora:* ${dateFormatted} às ${timeFormatted}\n\n` +
          `A partir de agora, a Lia já atenderá os clientes no WhatsApp e na loja virtual com este novo valor!`
        );
      } catch (updateErr) {
        this.logger.error("Erro ao aplicar alteração de preço:", updateErr);
        this.pendingPriceConfirmations.delete(matchingKey);
        return `❌ *Erro ao atualizar preço:*\nOcorreu uma falha técnica ao gravar o novo preço no banco de dados. Por favor, tente novamente em instantes.`;
      }
    }

    // 2. Resposta Negativa (Cancelamento)
    if (this.isNegation(data.message)) {
      this.pendingPriceConfirmations.delete(matchingKey);
      return (
        `🚫 *Alteração de Preço Cancelada*\n\n` +
        `Tudo bem, *${pending.trainerName}*! A solicitação foi cancelada e o preço de *${pending.productName}* permanece inalterado em *${this.formatCurrency(pending.oldPrice)}*.`
      );
    }

    return null;
  }

  private isAffirmation(text: string): boolean {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõöúçñ0-9\s]/g, "")
      .trim();
    const yesWords = [
      "sim", "s", "ss", "simm", "confirmo", "confirma", "confirmar", "confirmado",
      "ok", "okay", "pode", "pode alterar", "pode mudar", "pode salvar",
      "atualiza", "atualizar", "atualize", "muda", "mudar", "altera", "alterar",
      "positivo", "com certeza", "perfeito", "isso", "valido", "válido", "sim confirma",
    ];
    return (
      yesWords.includes(normalized) ||
      normalized.startsWith("sim ") ||
      normalized.startsWith("confirmo ")
    );
  }

  private isNegation(text: string): boolean {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõöúçñ0-9\s]/g, "")
      .trim();
    const noWords = [
      "não", "nao", "n", "nn", "cancela", "cancelar", "cancelado",
      "deixa", "deixa quieto", "deixa pra la", "deixa pra lá", "esquece",
      "abortar", "parar", "negativo", "errado", "não quero", "nao quero",
    ];
    return (
      noWords.includes(normalized) ||
      normalized.startsWith("não ") ||
      normalized.startsWith("nao ") ||
      normalized.startsWith("cancela ")
    );
  }

  private formatCurrency(value: number): string {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // MÉTODOS DE HISTÓRICO E UTILITÁRIOS
  // ==========================================

  private isGreeting(message: string): boolean {
    const greetings = [
      "oi", "olá", "ola", "hello", "hi", "bom dia", "boa tarde", "boa noite",
      "começar", "iniciar", "start", "menu", "ajuda", "help",
    ];

    const normalizedMessage = message.toLowerCase().trim();
    return greetings.some((greeting) => normalizedMessage.includes(greeting));
  }

  private getWelcomeMessage(userName: string): string {
    return this.welcomeMessage.replace("[NOME]", userName);
  }

  private getConversationHistory(sessionId: string): any[] {
    return this.conversationCache.get(sessionId) || [];
  }

  private updateConversationHistory(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
  ): void {
    const history = this.getConversationHistory(sessionId);

    history.push(
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    );

    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationCache.set(sessionId, history);
    this.cleanOldConversations();
  }

  private cleanOldConversations(): void {
    if (this.conversationCache.size > 1000) {
      const keysToDelete = Array.from(this.conversationCache.keys()).slice(0, 500);
      keysToDelete.forEach((key) => this.conversationCache.delete(key));
    }
  }

  private formatWhatsAppMessage(message: string): string {
    let formatted = message;

    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .replace(/__(.*?)__/g, "_$1_")
      .replace(/`(.*?)`/g, "```$1```")
      .replace(/#{1,6}\s*(.*)/g, "*$1*")
      .replace(/\n\s*[-*+]\s*/g, "\n• ")
      .replace(/\n\s*\d+\.\s*/g, "\n");

    if (!this.hasEmojis(formatted)) {
      formatted = this.addContextualEmojis(formatted);
    }

    if (formatted.length > 4000) {
      formatted =
        formatted.substring(0, 3900) +
        "\n\n... (mensagem muito longa, continuando em próxima mensagem)";
    }

    return formatted;
  }

  private hasEmojis(text: string): boolean {
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
  }

  private addContextualEmojis(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("cimento") || lowerMessage.includes("concreto")) {
      return "🏗️ " + message;
    }
    if (lowerMessage.includes("tinta") || lowerMessage.includes("pintura")) {
      return "🎨 " + message;
    }
    if (lowerMessage.includes("tijolo") || lowerMessage.includes("bloco")) {
      return "🧱 " + message;
    }
    if (lowerMessage.includes("ferramenta")) {
      return "🔨 " + message;
    }
    if (lowerMessage.includes("preço") || lowerMessage.includes("orçamento")) {
      return "💰 " + message;
    }
    if (lowerMessage.includes("obrigado") || lowerMessage.includes("valeu")) {
      return "😊 " + message;
    }

    return "🤖 " + message;
  }

  private async getSimulatedResponse(
    message: string,
    userName: string,
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // 0. CONSULTA DE PEDIDOS / ENTREGA EM TEMPO REAL
    if (
      lowerMessage.includes("pedido") ||
      lowerMessage.includes("como está") ||
      lowerMessage.includes("como esta") ||
      lowerMessage.includes("onde está") ||
      lowerMessage.includes("onde esta") ||
      lowerMessage.includes("rastreio") ||
      lowerMessage.includes("comprovante") ||
      lowerMessage.includes("saiu") ||
      message.match(/(?:#|pedido\s*|n[ºo]\s*)?([0-9]{6,16})/i)
    ) {
      try {
        const numberMatch = message.match(
          /(?:#|pedido\s*|n[ºo]\s*|número\s*|numero\s*)?([0-9]{6,16})/i,
        );
        let order: any = null;

        if (numberMatch && numberMatch[1]) {
          const orderNum = numberMatch[1];
          order = await this.prisma.order.findFirst({
            where: {
              OR: [
                { orderNumber: orderNum },
                { orderNumber: { contains: orderNum } },
                { id: orderNum },
              ],
            },
            include: {
              items: { include: { product: true } },
              shippingAddress: true,
              payment: true,
              user: true,
            },
          });
        }

        if (!order) {
          order = await this.prisma.order.findFirst({
            orderBy: { createdAt: "desc" },
            include: {
              items: { include: { product: true } },
              shippingAddress: true,
              payment: true,
              user: true,
            },
          });
        }

        if (order) {
          const statusLabels: Record<string, string> = {
            PENDING: "⏳ Aguardando Pagamento PIX",
            CONFIRMED: "✅ Confirmado / Em Separação",
            PROCESSING: "📦 Em Separação no Depósito",
            SHIPPED: "🚚 SAIU PARA ENTREGA! (Em rota até seu endereço)",
            DELIVERED: "🎉 ENTREGUE com sucesso na sua obra!",
            CANCELLED: "❌ Cancelado",
          };

          const statusText = statusLabels[order.status] || `📦 ${order.status}`;
          const totalFormatted = Number(
            order.totalAmount || order.total || 0,
          ).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          const dateFormatted = new Date(order.createdAt).toLocaleDateString(
            "pt-BR",
          );

          const itemsSummary = (order.items || [])
            .map(
              (i: any) =>
                `• *${i.quantity}x* ${i.product?.name || i.name || "Material"}`,
            )
            .join("\n");

          const addressSummary = order.shippingAddress
            ? `${order.shippingAddress.street || ""}, ${order.shippingAddress.number || "S/N"} - ${order.shippingAddress.neighborhood || ""}, ${order.shippingAddress.city || "Fortaleza"}/${order.shippingAddress.state || "CE"}`
            : "Retirada na Loja";

          let deliveryAdvice =
            "Assim que o caminhão for carregado e sair para entrega, você receberá a notificação!";
          if (order.status === "SHIPPED") {
            deliveryAdvice =
              "🚛 *O motorista já está em deslocamento com seus materiais para o seu endereço!*";
          } else if (order.status === "DELIVERED") {
            deliveryAdvice =
              "✅ *Entrega finalizada com sucesso! Se precisar de mais materiais, conte conosco.*";
          } else if (order.status === "PENDING") {
            deliveryAdvice =
              "💳 *Aguardando o pagamento do PIX para liberar a separação imediata dos produtos.*";
          }

          return (
            `🙋‍♀️ *Lia da HubObra:*\n\n` +
            `Localizei seu Pedido *#${order.orderNumber || order.id?.slice(0, 8)}*:\n\n` +
            `• *Status:* ${statusText}\n` +
            `• *Data:* ${dateFormatted}\n` +
            `• *Total:* ${totalFormatted}\n` +
            `• *Destino:* ${addressSummary}\n\n` +
            `📋 *Itens do Pedido:*\n${itemsSummary || "• Materiais de Construção"}\n\n` +
            `💡 ${deliveryAdvice}\n\n` +
            `🔗 *Acompanhar Comprovante Oficial:*\n` +
            `https://hubobra.com.br/pedidos/${order.id}/recibo`
          );
        }
      } catch (err) {
        this.logger.error("Erro ao buscar pedido para WhatsApp AI:", err);
      }
    }

    // 1. DÚVIDA TÉCNICA / APLICAÇÃO (Zé da Obra assume)
    if (
      lowerMessage.includes("como aplicar") ||
      lowerMessage.includes("como usar") ||
      lowerMessage.includes("passo a passo") ||
      lowerMessage.includes("como fazer") ||
      lowerMessage.includes("qual o traço") ||
      lowerMessage.includes("como impermeabilizar")
    ) {
      if (
        lowerMessage.includes("impermeabiliz") ||
        lowerMessage.includes("vedatop") ||
        lowerMessage.includes("vedacit") ||
        lowerMessage.includes("infiltr") ||
        lowerMessage.includes("vazamento")
      ) {
        return `👷‍♂️ *Zé da Obra na área! A Lia me chamou pra te explicar como aplicar o impermeabilizante direitinho:*

1️⃣ *Preparo da Superfície:* Limpe bem a área, removendo poeira, graxa ou restos soltos. Umedeça levemente a superfície antes de passar.
2️⃣ *Mistura do Vedatop:* Misture o componente pó com água/líquido até ficar uma massa homogênea (tipo tinta grossa).
3️⃣ *Aplicação em Demãos Cruzadas:* Aplique de 2 a 3 demãos com trincha ou brocha. A 1ª demão na horizontal; espere secar de 4 a 6 horas e aplique a 2ª demão na vertical!
4️⃣ *Cantos e Rodapés:* Arredonde os cantos (faça meia-cana) para não trincar.

💡 *Rendimento:* 1 caixa de Vedatop 18kg rende de 6 a 9 m² com 3 demãos.

🙋‍♀️ *Lia:* Já separei o Vedatop 18kg no nosso estoque por R$ 98,90 no PIX! Quer que eu monte seu pedido agora? 🛒`;
      }

      return `👷‍♂️ *Zé da Obra no comando! A Lia me pediu para tirar sua dúvida técnica:*\n\nFala parceiro! Para te passar o traço e o passo a passo exato da aplicação, me conta: qual superfície ou produto você vai trabalhar? (Laje, parede, piso, reboco ou banheiro?) 🛠️`;
    }

    // 2. PEDIDO DE PRODUTO: IMPERMEABILIZAÇÃO
    if (
      lowerMessage.includes("impermeabiliz") ||
      lowerMessage.includes("vedatop") ||
      lowerMessage.includes("vedacit") ||
      lowerMessage.includes("infiltr") ||
      lowerMessage.includes("vazamento") ||
      lowerMessage.includes("bianco")
    ) {
      return `🙋‍♀️ *Lia da HubConstruções:*

Temos opções excelentes de *Impermeabilizantes em estoque* no nosso depósito com pronta entrega:

📦 *1. Vedatop 18kg (Argamassa Polimérica - Vedacit)*
• *Ideal para:* Caixas d'água, piscinas, banheiros, rodapés e paredes com umidade.
• *Preço:* R$ 98,90 à vista no PIX (ou R$ 109,90 no cartão)

📦 *2. Aditivo Impermeabilizante Vedacit 3,6L*
• *Ideal para:* Adicionar no concreto e na argamassa de reboco.
• *Preço:* R$ 42,90 à vista no PIX

📦 *3. Bianco Resina Adesiva 3,6kg (Vedacit)*
• *Ideal para:* Ponte de aderência e plastificante de alto desempenho.
• *Preço:* R$ 89,90 à vista no PIX

🚚 *Entrega:* Frete Grátis para Fortaleza!

Se você tiver qualquer dúvida sobre *como aplicar, quantas demãos ou rendimento*, me avisa que chamo o *Zé da Obra* 👷‍♂️ pra te orientar! Qual dessas opções você prefere?`;
    }

    // 3. PEDIDO DE CIMENTO
    if (lowerMessage.includes("cimento")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos cimento novinho e fresquinho em nosso depósito:\n\n• *Cimento Poty Todas as Obras CP II-F 32 50kg* ➔ R$ 35,00 un\n• *Cimento Apodi Estrutural CP II-Z 50kg* ➔ R$ 34,50 un\n• *Cimento Branco 1kg/5kg* ➔ R$ 12,90\n\nQuantos sacos você precisa? Se precisar de cálculo de quantidade, o *Zé da Obra* 👷‍♂️ calcula certinho sem desperdício! 📐`;
    }

    // 4. PEDIDO DE TINTA
    if (lowerMessage.includes("tinta")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos as melhores marcas do nosso catálogo em estoque:\n\n• *Tinta Acrílica Fosco Premium Coral/Suvinil 18L* ➔ R$ 389,90 no PIX\n• *Tinta Rende Muito 18L* ➔ R$ 269,90\n• *Esmalte Sintético Base Água 3,6L* ➔ R$ 119,00\n\nQual cor e ambiente você gostaria de pintar? 🏠`;
    }

    // 5. PEDIDO DE TIJOLO / BLOCO
    if (lowerMessage.includes("tijolo") || lowerMessage.includes("bloco")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos a linha completa de alvenaria em nosso pátio:\n\n• *Tijolo Cerâmico 8 Furos (9x19x19cm)* ➔ R$ 1,20 a unidade (milheiro R$ 1.150,00)\n• *Bloco de Concreto Estrutural (14x19x39cm)* ➔ R$ 4,20 un\n\nVocê tem as medidas da parede? Se quiser, o *Zé da Obra* 👷‍♂️ calcula a quantidade exata de tijolos, areia e cimento! 📏`;
    }

    // 6. CÁLCULO DE PAREDE / ALVENARIA
    const wallMatch = lowerMessage.match(/(\d+[\.,]?\d*)\s*(?:x|por|\*)\s*(\d+[\.,]?\d*)/);
    if (lowerMessage.includes("parede") || wallMatch) {
      let altura = 2.5;
      let comprimento = 4.0;

      if (wallMatch) {
        altura = parseFloat(wallMatch[1].replace(",", "."));
        comprimento = parseFloat(wallMatch[2].replace(",", "."));
      }

      const area = Math.round(altura * comprimento * 10) / 10;
      const tijolos = Math.ceil((area * 27 * 1.1) / 10) * 10;
      const sacosCimento = Math.max(2, Math.ceil(area * 0.5));
      const metrosAreia = Math.max(0.5, Math.round(area * 0.1 * 10) / 10);
      const aditivos = Math.max(1, Math.ceil(area / 15));

      const precoTijolos = tijolos * 1.2;
      const precoCimento = sacosCimento * 35.0;
      const precoAreia = metrosAreia * 110.0;
      const precoAditivo = aditivos * 24.9;
      const totalGeral = precoTijolos + precoCimento + precoAreia + precoAditivo;
      const totalPix = totalGeral * 0.9;

      return (
        `👷‍♂️ *Cálculo do Zé da Obra para sua Parede de ${altura}m x ${comprimento}m (${area} m²):*\n\n` +
        `🧱 *${tijolos}x Tijolos Cerâmicos 8 Furos (9x19x19cm)* ➔ R$ ${precoTijolos.toFixed(2).replace(".", ",")}\n` +
        `📦 *${sacosCimento}x Sacos de Cimento Poty/Apodi 50kg* ➔ R$ ${precoCimento.toFixed(2).replace(".", ",")}\n` +
        `⏳ *${metrosAreia}m³ de Areia Média Lavada* ➔ R$ ${precoAreia.toFixed(2).replace(".", ",")}\n` +
        `🧴 *${aditivos}x Aditivo Plastificante Vedalit 1L* ➔ R$ ${precoAditivo.toFixed(2).replace(".", ",")}\n\n` +
        `──────────────\n` +
        `💰 *TOTAL ESTIMADO:* R$ ${totalGeral.toFixed(2).replace(".", ",")}\n` +
        `⚡ *NO PIX (10% OFF):* *R$ ${totalPix.toFixed(2).replace(".", ",")}*\n` +
        `🚚 *Entrega:* Frete Grátis para Fortaleza e Região!\n\n` +
        `🙋‍♀️ *Lia:* Deseja que eu feche seu pedido e reserve a entrega no seu endereço? 🚛`
      );
    }

    // Resposta padrão
    return `🙋‍♀️ Olá ${userName}! Sou a *Lia*, consultora de vendas da *HubConstruções*!\n\nPosso consultar produtos disponíveis em nosso estoque, preços com desconto no PIX e prazos de entrega 📦.\n\nE se você tiver qualquer dúvida de obra ou cálculo, o *Zé da Obra* 👷‍♂️ está a postos para te ajudar! Qual material você procura hoje?`;
  }
}
