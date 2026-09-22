import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

export interface ConversationContext {
  sessionId: string;
  currentPersona: "lia" | "ze";
  conversationHistory: any[];
  userProfile?: {
    name?: string;
    phone?: string;
    preferences?: string[];
  };
  currentTopic?: string;
  needsSpecialist?: boolean;
}

export interface PersonaResponse {
  response: string;
  persona: "lia" | "ze";
  shouldTransfer?: boolean;
  transferReason?: string;
  suggestedActions?: string[];
  products?: any[];
}

@Injectable()
export class AIPersonasService {
  private readonly logger = new Logger(AIPersonasService.name);
  private readonly conversationContexts = new Map<
    string,
    ConversationContext
  >();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async processMessage(
    sessionId: string,
    message: string,
    userName: string = "cliente",
    channel: string = "web",
  ): Promise<PersonaResponse> {
    try {
      // Obter ou criar contexto da conversa
      let context = this.conversationContexts.get(sessionId);
      if (!context) {
        context = {
          sessionId,
          currentPersona: "lia", // Sempre começa com a Lia
          conversationHistory: [],
          userProfile: { name: userName },
          needsSpecialist: false,
        };
        this.conversationContexts.set(sessionId, context);
      }

      // Analisar se precisa transferir para especialista
      const needsSpecialist = this.shouldTransferToSpecialist(message, context);

      // Determinar persona atual
      let targetPersona: "lia" | "ze" = context.currentPersona;

      if (needsSpecialist && context.currentPersona === "lia") {
        targetPersona = "ze";
        context.needsSpecialist = true;
      }

      // Gerar resposta baseada na persona
      const response = await this.generatePersonaResponse(
        targetPersona,
        message,
        context,
        channel,
      );

      // Atualizar contexto
      context.currentPersona = targetPersona;
      context.conversationHistory.push(
        { role: "user", content: message, timestamp: new Date() },
        {
          role: targetPersona,
          content: response.response,
          timestamp: new Date(),
        },
      );

      // Limitar histórico
      if (context.conversationHistory.length > 20) {
        context.conversationHistory = context.conversationHistory.slice(-20);
      }

      this.conversationContexts.set(sessionId, context);

      return response;
    } catch (error) {
      this.logger.error("Erro no processamento de mensagem:", error);
      return this.getFallbackResponse(message, userName);
    }
  }

  private shouldTransferToSpecialist(
    message: string,
    context: ConversationContext,
  ): boolean {
    const lowerMessage = message.toLowerCase();

    // Palavras-chave que indicam necessidade de especialista
    const technicalKeywords = [
      "calcular",
      "quantidade",
      "quanto preciso",
      "dimensionar",
      "especificação",
      "técnico",
      "resistência",
      "carga",
      "fundação",
      "estrutural",
      "norma",
      "abnt",
      "qual cimento",
      "tipo de tijolo",
      "qual tinta",
      "recomenda",
      "melhor produto",
      "diferença entre",
      "como aplicar",
      "instalação",
      "execução",
      "problema",
      "defeito",
      "rachadura",
      "infiltração",
    ];

    const hasKeywords = technicalKeywords.some((keyword) =>
      lowerMessage.includes(keyword),
    );

    // Verificar se já tentou responder questões técnicas
    const recentTechnicalQuestions = context.conversationHistory
      .slice(-6) // Últimas 3 interações
      .filter((msg) => msg.role === "user")
      .some((msg) =>
        technicalKeywords.some((keyword) =>
          msg.content.toLowerCase().includes(keyword),
        ),
      );

    return hasKeywords || recentTechnicalQuestions;
  }

  private async generatePersonaResponse(
    persona: "lia" | "ze",
    message: string,
    context: ConversationContext,
    channel: string,
  ): Promise<PersonaResponse> {
    if (persona === "lia") {
      return this.generateLiaResponse(message, context, channel);
    } else {
      return this.generateZeResponse(message, context, channel);
    }
  }

  private async generateLiaResponse(
    message: string,
    context: ConversationContext,
    channel: string,
  ): Promise<PersonaResponse> {
    const lowerMessage = message.toLowerCase();
    const userName = context.userProfile?.name || "cliente";

    // Verificar se precisa transferir para o Zé
    const needsSpecialist = this.shouldTransferToSpecialist(message, context);

    if (needsSpecialist) {
      return {
        response: `Olá ${userName}! 😊 Vejo que você tem uma dúvida técnica sobre produtos. Vou chamar nosso engenheiro especialista, o *Zé da Obra*, para te ajudar melhor!\n\n🔄 Transferindo para o especialista...`,
        persona: "lia",
        shouldTransfer: true,
        transferReason: "Questão técnica sobre produtos",
        suggestedActions: ["Aguarde o Zé da Obra"],
      };
    }

    // Respostas da Lia (atendimento geral)
    if (this.isGreeting(message)) {
      return {
        response: `Olá ${userName}! 😊 Sou a *Lia*, sua atendente virtual da loja!\n\n✨ *Posso ajudar você com:*\n• Informações sobre pedidos\n• Horários e localização\n• Dúvidas sobre entrega\n• Navegação no site\n• Promoções e ofertas\n\n🔧 *Para questões técnicas sobre produtos*, posso chamar nosso engenheiro especialista, o *Zé da Obra*!\n\nComo posso ajudar você hoje?`,
        persona: "lia",
        suggestedActions: [
          "Ver meus pedidos",
          "Informações de entrega",
          "Falar com especialista",
          "Ver promoções",
        ],
      };
    }

    if (lowerMessage.includes("pedido") || lowerMessage.includes("compra")) {
      return {
        response: `📦 *Sobre pedidos*, posso ajudar você com:\n\n• Consultar status do pedido\n• Informações de entrega\n• Alterar endereço de entrega\n• Cancelamentos (dentro do prazo)\n• Nota fiscal\n\nVocê tem o número do seu pedido? Ou precisa de ajuda para fazer um novo pedido?`,
        persona: "lia",
        suggestedActions: [
          "Consultar pedido",
          "Fazer novo pedido",
          "Alterar entrega",
          "Falar com especialista",
        ],
      };
    }

    if (lowerMessage.includes("entrega") || lowerMessage.includes("prazo")) {
      return {
        response: `🚚 *Informações sobre entrega:*\n\n📍 *Região metropolitana:* 2-3 dias úteis\n📍 *Interior:* 5-7 dias úteis\n📍 *Produtos especiais:* Até 10 dias úteis\n\n💰 *Frete grátis* para compras acima de R$ 299,00!\n\nQuer consultar o prazo para seu CEP específico?`,
        persona: "lia",
        suggestedActions: [
          "Calcular frete",
          "Rastrear pedido",
          "Ver produtos",
          "Falar com especialista",
        ],
      };
    }

    if (
      lowerMessage.includes("horário") ||
      lowerMessage.includes("funcionamento")
    ) {
      return {
        response: `🕒 *Horários de funcionamento:*\n\n🏪 *Loja física:*\n• Segunda a sexta: 7h às 18h\n• Sábado: 7h às 16h\n• Domingo: 8h às 12h\n\n💻 *Site:* 24h por dia, 7 dias por semana\n\n📱 *Atendimento online:*\n• Segunda a sexta: 8h às 17h\n• Sábado: 8h às 14h`,
        persona: "lia",
        suggestedActions: [
          "Ver localização",
          "Contatos",
          "Ver produtos",
          "Falar com especialista",
        ],
      };
    }

    if (
      lowerMessage.includes("promoção") ||
      lowerMessage.includes("oferta") ||
      lowerMessage.includes("desconto")
    ) {
      return {
        response: `🎉 *Promoções ativas:*\n\n💥 *Frete grátis* acima de R$ 299\n🏗️ *Kit construção* com 15% de desconto\n🎨 *Tintas* com até 20% off\n📦 *Compre 10, leve 12* em tijolos\n\n📱 Quer ver todas as ofertas ou tem interesse em algum produto específico?\n\n💡 *Dica:* Para recomendações técnicas, posso chamar o Zé da Obra!`,
        persona: "lia",
        suggestedActions: [
          "Ver todas ofertas",
          "Kit construção",
          "Tintas em promoção",
          "Falar com especialista",
        ],
      };
    }

    // Resposta padrão da Lia
    return {
      response: `Olá ${userName}! 😊 Sou a Lia, sua atendente virtual!\n\n✨ *Posso ajudar com:*\n• Pedidos e entregas\n• Informações da loja\n• Promoções e ofertas\n• Navegação no site\n\n🔧 *Para questões técnicas* sobre produtos, cálculos ou especificações, posso chamar nosso engenheiro *Zé da Obra*!\n\nO que você precisa hoje?`,
      persona: "lia",
      suggestedActions: [
        "Ver produtos",
        "Meus pedidos",
        "Promoções",
        "Falar com especialista",
      ],
    };
  }

  private async generateZeResponse(
    message: string,
    context: ConversationContext,
    channel: string,
  ): Promise<PersonaResponse> {
    const lowerMessage = message.toLowerCase();
    const userName = context.userProfile?.name || "cliente";

    // Primeira vez que o Zé entra na conversa
    if (context.needsSpecialist && context.conversationHistory.length <= 2) {
      return {
        response: `🔧 Olá ${userName}! Sou o *Zé da Obra*, engenheiro especialista em materiais de construção!\n\nA Lia me passou sua dúvida técnica. Sou especializado em:\n\n🏗️ *Cálculos de materiais*\n📐 *Dimensionamento de projetos*\n🧱 *Especificações técnicas*\n💡 *Recomendações de produtos*\n⚡ *Soluções de problemas*\n🛡️ *Normas e segurança*\n\nMe conte mais detalhes sobre seu projeto para eu poder ajudar melhor!`,
        persona: "ze",
        suggestedActions: [
          "Calcular materiais",
          "Recomendar produtos",
          "Resolver problema",
          "Voltar para Lia",
        ],
      };
    }

    // Respostas técnicas do Zé
    if (lowerMessage.includes("cimento") || lowerMessage.includes("concreto")) {
      return {
        response: `🏗️ *Sobre cimento*, ${userName}:\n\n📋 *Tipos principais:*\n• *CP II-E 32:* Uso geral, boa trabalhidade\n• *CP III-40:* Maior resistência, obras estruturais\n• *CP IV-32:* Econômico, baixo calor de hidratação\n• *CP V-ARI:* Alta resistência inicial\n\n📐 *Cálculo básico:*\n• Contrapiso: 1 saco (50kg) para 4-5m²\n• Concreto: 7 sacos por m³ (fck 20MPa)\n• Argamassa: 1 saco para 3-4m² de revestimento\n\nQue tipo de aplicação você tem em mente?`,
        persona: "ze",
        suggestedActions: [
          "Calcular quantidade",
          "Ver preços",
          "Outras dúvidas técnicas",
          "Voltar para Lia",
        ],
      };
    }

    if (lowerMessage.includes("tijolo") || lowerMessage.includes("bloco")) {
      return {
        response: `🧱 *Sobre tijolos e blocos*, ${userName}:\n\n📋 *Opções disponíveis:*\n• *Tijolo cerâmico 6 furos:* Tradicional, boa isolação\n• *Bloco cerâmico 8 furos:* Maior resistência\n• *Bloco de concreto:* Estrutural, alta resistência\n• *Tijolo maciço:* Muros e pilares\n\n📐 *Quantidades:*\n• Tijolo 6 furos: 25 unidades/m²\n• Bloco cerâmico: 12,5 unidades/m²\n• Bloco concreto: 12,5 unidades/m²\n\n💡 *Dica:* Sempre calcule 10% a mais para perdas!\n\nQual o tipo de parede você vai construir?`,
        persona: "ze",
        suggestedActions: [
          "Calcular tijolos",
          "Comparar tipos",
          "Ver argamassa",
          "Voltar para Lia",
        ],
      };
    }

    if (
      lowerMessage.includes("calcular") ||
      lowerMessage.includes("quantidade")
    ) {
      return {
        response: `📐 *Vamos calcular juntos*, ${userName}!\n\nPara fazer um cálculo preciso, preciso saber:\n\n🏗️ *Tipo de projeto:*\n• Casa, muro, laje, contrapiso?\n\n📏 *Dimensões:*\n• Comprimento, largura, altura?\n• Área total em m²?\n\n🎯 *Especificações:*\n• Tipo de material preferido?\n• Orçamento disponível?\n\nMe passe essas informações que faço todos os cálculos para você!`,
        persona: "ze",
        suggestedActions: [
          "Casa completa",
          "Muro/cerca",
          "Contrapiso",
          "Voltar para Lia",
        ],
      };
    }

    // Resposta padrão do Zé
    return {
      response: `🔧 Olá ${userName}! Sou o Zé da Obra, seu engenheiro especialista!\n\n🎯 *Posso ajudar com:*\n• Cálculos precisos de materiais\n• Especificações técnicas\n• Recomendações de produtos\n• Soluções para problemas\n• Normas e segurança\n\nQual sua dúvida técnica? Quanto mais detalhes você me der sobre seu projeto, melhor posso ajudar!`,
      persona: "ze",
      suggestedActions: [
        "Calcular materiais",
        "Recomendar produtos",
        "Resolver problema",
        "Voltar para Lia",
      ],
    };
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

  private getFallbackResponse(
    message: string,
    userName: string,
  ): PersonaResponse {
    return {
      response: `Olá ${userName}! 😊 Sou a Lia, sua atendente virtual. Parece que tivemos um probleminha técnico, mas estou aqui para ajudar!\n\nPosso ajudar com informações gerais ou chamar nosso especialista Zé da Obra para questões técnicas. Como posso ajudar?`,
      persona: "lia",
      suggestedActions: [
        "Tentar novamente",
        "Falar com especialista",
        "Ver produtos",
        "Contato humano",
      ],
    };
  }

  // Métodos para gerenciar contexto
  async switchPersona(
    sessionId: string,
    targetPersona: "lia" | "ze",
  ): Promise<void> {
    const context = this.conversationContexts.get(sessionId);
    if (context) {
      context.currentPersona = targetPersona;
      this.conversationContexts.set(sessionId, context);
    }
  }

  async getConversationContext(
    sessionId: string,
  ): Promise<ConversationContext | null> {
    return this.conversationContexts.get(sessionId) || null;
  }

  async clearConversation(sessionId: string): Promise<void> {
    this.conversationContexts.delete(sessionId);
  }
}
