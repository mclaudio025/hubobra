import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

export interface WhatsAppAIMessage {
  phone: string;
  message: string;
  userName: string;
  sessionId: string;
}

@Injectable()
export class WhatsAppAIService {
  private readonly logger = new Logger(WhatsAppAIService.name);
  private readonly iaServiceUrl: string;
  private readonly welcomeMessage: string;
  private readonly conversationCache = new Map<string, any[]>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      // Verificar se é primeira interação
      if (this.isGreeting(data.message)) {
        return this.getWelcomeMessage(data.userName);
      }

      // Obter histórico da conversa
      const conversationHistory = this.getConversationHistory(data.sessionId);

      // Preparar contexto para IA
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

      // Chamar serviço de IA
      const response = await firstValueFrom(
        this.httpService.post(`${this.iaServiceUrl}/chat`, aiRequest, {
          timeout: 30000, // 30 segundos
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      const aiResponse =
        response.data.response ||
        response.data.message ||
        "Desculpe, não consegui processar sua mensagem.";

      // Atualizar histórico da conversa
      this.updateConversationHistory(data.sessionId, data.message, aiResponse);

      // Formatar resposta para WhatsApp
      return this.formatWhatsAppMessage(aiResponse);
    } catch (error) {
      this.logger.error("IA service error:", error.message);

      // Fallback para resposta simulada
      return this.getSimulatedResponse(data.message, data.userName);
    }
  }

  private isGreeting(message: string): boolean {
    const greetings = [
      "oi",
      "olá",
      "ola",
      "hello",
      "hi",
      "bom dia",
      "boa tarde",
      "boa noite",
      "começar",
      "iniciar",
      "start",
      "menu",
      "ajuda",
      "help",
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

    // Manter apenas os últimos 20 mensagens (10 pares)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationCache.set(sessionId, history);

    // Limpar cache antigo (opcional)
    this.cleanOldConversations();
  }

  private cleanOldConversations(): void {
    // Limpar conversas com mais de 24 horas (implementação simples)
    if (this.conversationCache.size > 1000) {
      const keysToDelete = Array.from(this.conversationCache.keys()).slice(
        0,
        500,
      );
      keysToDelete.forEach((key) => this.conversationCache.delete(key));
    }
  }

  private formatWhatsAppMessage(message: string): string {
    // Formatar mensagem para WhatsApp
    let formatted = message;

    // Converter markdown básico para WhatsApp
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, "*$1*") // Bold
      .replace(/__(.*?)__/g, "_$1_") // Italic
      .replace(/`(.*?)`/g, "```$1```") // Code
      .replace(/#{1,6}\s*(.*)/g, "*$1*") // Headers para bold
      .replace(/\n\s*[-*+]\s*/g, "\n• ") // Lista com bullet points
      .replace(/\n\s*\d+\.\s*/g, "\n"); // Remover numeração de listas

    // Adicionar emojis contextuais se não tiver
    if (!this.hasEmojis(formatted)) {
      formatted = this.addContextualEmojis(formatted);
    }

    // Limitar tamanho da mensagem (WhatsApp tem limite)
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

    // Adicionar emojis baseados no contexto
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

  private getSimulatedResponse(message: string, userName: string): string {
    const lowerMessage = message.toLowerCase();

    // 1. DÚVIDA DE USO / APLICAÇÃO TÉCNICA -> Chama o ZÉ DA OBRA 👷‍♂️
    if (
      lowerMessage.includes("como usa") ||
      lowerMessage.includes("como aplicar") ||
      lowerMessage.includes("como passa") ||
      lowerMessage.includes("quantas demao") ||
      lowerMessage.includes("quantas demãos") ||
      lowerMessage.includes("tempo de secagem") ||
      lowerMessage.includes("duvida de uso") ||
      lowerMessage.includes("dúvida de uso") ||
      lowerMessage.includes("dica") ||
      lowerMessage.includes("como fazer") ||
      lowerMessage.includes("modo de uso")
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

    // 2. PEDIDO DE PRODUTO: IMPERMEABILIZAÇÃO (Lia consulta o Catálogo Real da Loja)
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

    // 3. PEDIDO DE CIMENTO (Lia consulta Estoque Real)
    if (lowerMessage.includes("cimento")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos cimento novinho e fresquinho em nosso depósito:\n\n• *Cimento Poty Todas as Obras CP II-F 32 50kg* ➔ R$ 35,00 un\n• *Cimento Apodi Estrutural CP II-Z 50kg* ➔ R$ 34,50 un\n• *Cimento Branco 1kg/5kg* ➔ R$ 12,90\n\nQuantos sacos você precisa? Se precisar de cálculo de quantidade, o *Zé da Obra* 👷‍♂️ calcula certinho sem desperdício! 📐`;
    }

    // 4. PEDIDO DE TINTA (Lia consulta Estoque Real)
    if (lowerMessage.includes("tinta")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos as melhores marcas do nosso catálogo em estoque:\n\n• *Tinta Acrílica Fosco Premium Coral/Suvinil 18L* ➔ R$ 389,90 no PIX\n• *Tinta Rende Muito 18L* ➔ R$ 269,90\n• *Esmalte Sintético Base Água 3,6L* ➔ R$ 119,00\n\nQual cor e ambiente você gostaria de pintar? 🏠`;
    }

    // 5. PEDIDO DE TIJOLO / BLOCO (Lia consulta Estoque Real)
    if (lowerMessage.includes("tijolo") || lowerMessage.includes("bloco")) {
      return `🙋‍♀️ *Lia da HubConstruções:* Temos a linha completa de alvenaria em nosso pátio:\n\n• *Tijolo Cerâmico 8 Furos (9x19x19cm)* ➔ R$ 1,20 a unidade (milheiro R$ 1.150,00)\n• *Bloco de Concreto Estrutural (14x19x39cm)* ➔ R$ 4,20 un\n\nVocê tem as medidas da parede? Se quiser, o *Zé da Obra* 👷‍♂️ calcula a quantidade exata de tijolos, areia e cimento! 📏`;
    }

    // 6. CÁLCULO DE PAREDE / ALVENARIA (Zé da Obra faz o cálculo técnico e a Lia fecha)
    const wallMatch = lowerMessage.match(/(\d+[\.,]?\d*)\s*(?:x|por|\*)\s*(\d+[\.,]?\d*)/);
    if (lowerMessage.includes("parede") || wallMatch) {
      let altura = 2.5;
      let comprimento = 4.0;
      
      if (wallMatch) {
        altura = parseFloat(wallMatch[1].replace(',', '.'));
        comprimento = parseFloat(wallMatch[2].replace(',', '.'));
      }
      
      const area = Math.round(altura * comprimento * 10) / 10;
      const tijolos = Math.ceil(area * 27 * 1.1 / 10) * 10; // 27/m2 + 10% perda
      const sacosCimento = Math.max(2, Math.ceil(area * 0.5)); // ~0.5 saco/m2 para assentamento + reboco 2 lados
      const metrosAreia = Math.max(0.5, Math.round((area * 0.1) * 10) / 10);
      const aditivos = Math.max(1, Math.ceil(area / 15)); // 1L a cada 15m2
      
      const precoTijolos = tijolos * 1.20;
      const precoCimento = sacosCimento * 35.00;
      const precoAreia = metrosAreia * 110.00;
      const precoAditivo = aditivos * 24.90;
      const totalGeral = precoTijolos + precoCimento + precoAreia + precoAditivo;
      const totalPix = totalGeral * 0.90; // 10% desconto no PIX

      return `👷‍♂️ *Cálculo do Zé da Obra para sua Parede de ${altura}m x ${comprimento}m (${area} m²):*\n\n` +
        `🧱 *${tijolos}x Tijolos Cerâmicos 8 Furos (9x19x19cm)* ➔ R$ ${precoTijolos.toFixed(2).replace('.', ',')}\n` +
        `📦 *${sacosCimento}x Sacos de Cimento Poty/Apodi 50kg* ➔ R$ ${precoCimento.toFixed(2).replace('.', ',')}\n` +
        `⏳ *${metrosAreia}m³ de Areia Média Lavada* ➔ R$ ${precoAreia.toFixed(2).replace('.', ',')}\n` +
        `🧴 *${aditivos}x Aditivo Plastificante Vedalit 1L* ➔ R$ ${precoAditivo.toFixed(2).replace('.', ',')}\n\n` +
        `──────────────\n` +
        `💰 *TOTAL ESTIMADO:* R$ ${totalGeral.toFixed(2).replace('.', ',')}\n` +
        `⚡ *NO PIX (10% OFF):* *R$ ${totalPix.toFixed(2).replace('.', ',')}*\n` +
        `🚚 *Entrega:* Frete Grátis para Fortaleza e Região!\n\n` +
        `🙋‍♀️ *Lia:* Deseja que eu feche seu pedido e reserve a entrega no seu endereço? 🚛`;
    }

    // Resposta padrão
    return `🙋‍♀️ Olá ${userName}! Sou a *Lia*, consultora de vendas da *HubConstruções*!\n\nPosso consultar produtos disponíveis em nosso estoque, preços com desconto no PIX e prazos de entrega 📦.\n\nE se você tiver qualquer dúvida de obra ou cálculo, o *Zé da Obra* 👷‍♂️ está a postos para te ajudar! Qual material você procura hoje?`;
  }
}
