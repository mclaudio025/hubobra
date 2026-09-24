import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ProductsService } from "../products/products.service";

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
  calculation?: any;
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
    private readonly productsService: ProductsService,
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

      // Analisar se precisa transferir para especialista (Zé da Obra)
      const needsSpecialist = this.shouldTransferToSpecialist(message, context);

      // Determinar persona alvo
      let targetPersona: "lia" | "ze" = context.currentPersona;

      if (needsSpecialist) {
        targetPersona = "ze";
        context.needsSpecialist = true;
      }

      // Gerar resposta baseada na persona com busca de produtos
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

    // Palavras-chave que acionam o Zé da Obra
    const technicalKeywords = [
      "calcular",
      "calculo",
      "cálculo",
      "quantidade",
      "quanto preciso",
      "dimensionar",
      "especificação",
      "técnico",
      "resistência",
      "carga",
      "fundação",
      "estrutural",
      "m²",
      "metro quadrado",
      "metros",
      "reboco",
      "rebocar",
      "alvenaria",
      "muro",
      "parede",
      "contrapiso",
      "laje",
      "concreto",
      "cimento",
      "tijolo",
      "bloco",
      "areia",
      "brita",
      "argamassa",
      "rejunte",
      "impermeabilizante",
      "qual cimento",
      "tipo de tijolo",
      "como aplicar",
      "rachadura",
      "infiltração",
    ];

    return technicalKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  private async searchRelevantProducts(query: string): Promise<any[]> {
    try {
      if (!query || query.trim().length < 2) return [];
      const result = await this.productsService.findAll(1, 4, query.trim());
      const productList = result?.products || (result as any)?.data || [];
      if (Array.isArray(productList)) {
        return productList.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          salePrice: p.salePrice || p.price,
          sku: p.sku,
          image: p.images?.[0]?.url || "/placeholder-product.png",
          unit: p.unit || "un",
        }));
      }
      return [];
    } catch (err) {
      this.logger.warn(`Erro ao buscar produtos para IA (${query}):`, err);
      return [];
    }
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

    // Saudação
    if (this.isGreeting(message)) {
      const sampleProducts = await this.searchRelevantProducts("cimento");
      return {
        response: `Olá, ${userName}! 😊 Seja muito bem-vindo à HubConstruções! Sou a *Lia*, sua consultora de atendimento e compras.\n\n✨ Posso te ajudar a encontrar produtos, verificar prazos de entrega e promoções ativas.\n\n💡 Se você precisar calcular materiais (cimento, areia, tijolos ou reboco), basta me dizer o tamanho da sua parede ou cômodo que eu chamo o *Zé da Obra* na hora para fazer o cálculo exato!\n\nO que você precisa para sua obra hoje?`,
        persona: "lia",
        products: sampleProducts,
        suggestedActions: [
          "Ver promoções do dia",
          "Calcular material com Zé",
          "Consultar entrega",
          "Falar sobre cimento e tijolos",
        ],
      };
    }

    // Perguntas sobre pedidos e compras
    if (lowerMessage.includes("pedido") || lowerMessage.includes("compra")) {
      return {
        response: `📦 *Sobre seus pedidos na HubConstruções:*\n\n• Pagamento no PIX com confirmação imediata e desconto de 5% à vista.\n• Entregas expressas em 24h a 48h na sua obra!\n• Você pode acompanhar seu pedido direto pelo menu "Meus Pedidos" ou me informar o código aqui.\n\nPrecisa de ajuda para montar um novo pedido agora?`,
        persona: "lia",
        suggestedActions: [
          "Meus pedidos",
          "Fazer novo pedido",
          "Calcular frete",
        ],
      };
    }

    // Perguntas sobre entrega e frete
    if (lowerMessage.includes("entrega") || lowerMessage.includes("frete") || lowerMessage.includes("prazo")) {
      return {
        response: `🚚 *Prazos e Condições de Entrega:*\n\n📍 *Região Metropolitana:* Entrega rápida em até 24h úteis direto no canteiro da obra.\n📍 *Interior:* 2 a 4 dias úteis.\n\n💥 *Frete Grátis* para compras acima de R$ 299,00!\n\nQual produto você gostaria de receber na sua obra?`,
        persona: "lia",
        suggestedActions: ["Ver produtos com frete grátis", "Calcular materiais", "Falar com especialista"],
      };
    }

    // Promoções
    if (lowerMessage.includes("promoção") || lowerMessage.includes("promocao") || lowerMessage.includes("oferta") || lowerMessage.includes("desconto")) {
      const promoProducts = await this.searchRelevantProducts("tubo");
      return {
        response: `🎉 *Super Ofertas da Semana na HubConstruções:*\n\n💥 5% de desconto extra pagando no PIX!\n🏗️ Cimentos, tubos e conexões com preços especiais direto da fábrica.\n🚚 Frete Grátis acima de R$ 299!\n\nSeparei alguns destaques do nosso catálogo para você:`,
        persona: "lia",
        products: promoProducts,
        suggestedActions: ["Ver tubos e conexões", "Ver cimento e argamassa", "Calcular minha obra"],
      };
    }

    // Busca geral de produtos mencionada pelo cliente
    let searchTerm = "";
    if (lowerMessage.includes("cimento")) searchTerm = "cimento";
    else if (lowerMessage.includes("tubo") || lowerMessage.includes("conex")) searchTerm = "tubo";
    else if (lowerMessage.includes("tinta")) searchTerm = "tinta";
    else if (lowerMessage.includes("piso") || lowerMessage.includes("porcelanato")) searchTerm = "piso";
    else if (lowerMessage.includes("argamassa")) searchTerm = "argamassa";

    const matchedProducts = searchTerm ? await this.searchRelevantProducts(searchTerm) : [];

    return {
      response: `Olá ${userName}! 😊 Sou a Lia. Encontrei ótimas opções para você na loja! Se precisar de ajuda para calcular quantidades ou escolher a especificação certa, nosso engenheiro Zé da Obra está a postos para te ajudar.`,
      persona: "lia",
      products: matchedProducts,
      suggestedActions: [
        "Calcular quantidade com Zé da Obra",
        "Ver catálogo completo",
        "Adicionar ao carrinho",
      ],
    };
  }

  private async generateZeResponse(
    message: string,
    context: ConversationContext,
    channel: string,
  ): Promise<PersonaResponse> {
    const lowerMessage = message.toLowerCase();
    const userName = context.userProfile?.name || "amigo";

    // Extrair números (área, comprimento, altura)
    const numbers = message.match(/\d+([.,]\d+)?/g)?.map((n) => parseFloat(n.replace(",", "."))) || [];
    const area = numbers[0] || 0;

    // 1. Cálculo de Reboco / Emboço
    if (lowerMessage.includes("reboco") || lowerMessage.includes("rebocar") || lowerMessage.includes("emboço")) {
      const calcArea = area > 0 ? area : 10;
      // Traço 1:3 reboco (~2cm espessura): ~0.25 sacos de cimento (50kg) e ~0.04m³ de areia por m²
      const cimentoSacos = Math.max(1, Math.ceil(calcArea * 0.25));
      const areiaM3 = (calcArea * 0.035).toFixed(2);
      const matchedProducts = await this.searchRelevantProducts("cimento");

      return {
        response: `🔧 *Fala ${userName}, aqui é o Zé da Obra!* Fiz o cálculo para ${calcArea} m² de reboco:\n\n📐 *Insumos recomendados:*\n• *Cimento CP-II (50kg):* ${cimentoSacos} sacos\n• *Areia média lavada:* ${areiaM3} m³\n• *Aditivo plastificante:* 1 frasco de 1L (melhora a liga e evita trincas)\n\n💡 *Dica do Zé:* Sempre chapeie a alvenaria antes do reboco para garantir aderência perfeita. Já separei o Cimento em estoque abaixo com o melhor preço da loja!`,
        persona: "ze",
        products: matchedProducts,
        calculation: {
          tipo: "Reboco de Parede",
          areaM2: calcArea,
          cimentoSacos,
          areiaM3,
        },
        suggestedActions: [
          `Adicionar ${cimentoSacos} sacos de cimento`,
          "Calcular outra medida",
          "Falar com a Lia",
        ],
      };
    }

    // 2. Cálculo de Alvenaria / Tijolo / Muro
    if (lowerMessage.includes("tijolo") || lowerMessage.includes("bloco") || lowerMessage.includes("muro") || lowerMessage.includes("parede")) {
      const calcArea = area > 0 ? area : 12;
      // Tijolo cerâmico 6 furos: ~25 un/m² | Bloco de concreto: ~12.5 un/m²
      const tijolos6Furos = Math.ceil(calcArea * 25 * 1.1); // 10% perda
      const argamassaAssentamentoSacos = Math.max(1, Math.ceil(calcArea * 0.3));
      const matchedProducts = await this.searchRelevantProducts("argamassa");

      return {
        response: `🧱 *Cálculo de Alvenaria do Zé da Obra para ${calcArea} m²:*\n\n📐 *Quantidades estimadas (com 10% de margem de segurança):*\n• *Tijolo cerâmico 6 furos:* ~${tijolos6Furos} unidades\n• *Argamassa de assentamento:* ~${argamassaAssentamentoSacos} sacos de 50kg\n\n💡 *Dica do Zé:* Lembre-se de amarrar bem os cantos e usar impermeabilizante nas 3 primeiras fiadas do chão para evitar umidade subindo na parede!`,
        persona: "ze",
        products: matchedProducts,
        calculation: {
          tipo: "Alvenaria e Muro",
          areaM2: calcArea,
          tijolos: tijolos6Furos,
          argamassaSacos: argamassaAssentamentoSacos,
        },
        suggestedActions: [
          "Ver opções de tijolo e argamassa",
          "Calcular reboco para essa parede",
          "Voltar para a Lia",
        ],
      };
    }

    // 3. Cálculo de Contrapiso / Concreto
    if (lowerMessage.includes("contrapiso") || lowerMessage.includes("piso") || lowerMessage.includes("concreto") || lowerMessage.includes("laje")) {
      const calcArea = area > 0 ? area : 15;
      const cimentoSacos = Math.max(1, Math.ceil(calcArea * 0.28));
      const areiaM3 = (calcArea * 0.04).toFixed(2);
      const britaM3 = (calcArea * 0.045).toFixed(2);
      const matchedProducts = await this.searchRelevantProducts("cimento");

      return {
        response: `🏗️ *Cálculo de Concreto/Contrapiso do Zé para ${calcArea} m² (espessura média 5cm):*\n\n📐 *Materiais necessários:*\n• *Cimento CP-II:* ${cimentoSacos} sacos de 50kg\n• *Areia média/grossa:* ${areiaM3} m³\n• *Brita 1:* ${britaM3} m³\n\n💡 *Dica do Zé:* Mantenha o concreto curando com água por pelo menos 3 a 5 dias para atingir a máxima resistência mecânica!`,
        persona: "ze",
        products: matchedProducts,
        calculation: {
          tipo: "Contrapiso e Concreto",
          areaM2: calcArea,
          cimentoSacos,
          areiaM3,
          britaM3,
        },
        suggestedActions: [
          `Comprar ${cimentoSacos} sacos de Cimento`,
          "Calcular rejunte e piso",
          "Voltar para a Lia",
        ],
      };
    }

    // 4. Cálculo de Pintura e Tinta
    if (lowerMessage.includes("tinta") || lowerMessage.includes("pintar") || lowerMessage.includes("pintura")) {
      const calcArea = area > 0 ? area : 30;
      // Lata de 18L rende ~100m² com 2 demãos. Galão de 3.6L rende ~20m²
      const latas18L = Math.max(1, Math.ceil(calcArea / 100));
      const matchedProducts = await this.searchRelevantProducts("tinta");

      return {
        response: `🎨 *Cálculo de Tinta do Zé da Obra para ${calcArea} m² (2 demãos):*\n\n📐 *Rendimento estimado:*\n• *Lata de Tinta Acrílica (18L):* ${latas18L} lata(s)\n• *Selador Acrílico:* 1 galão (para fundo)\n• *Fita Crepe & Lixas:* 2 rolos e 5 lixas grão 120/150\n\n💡 *Dica do Zé:* Aplique sempre o fundo preparador ou selador para economizar tinta e ter acabamento uniforme!`,
        persona: "ze",
        products: matchedProducts,
        suggestedActions: ["Ver tintas e acessórios", "Calcular outra parede", "Voltar para a Lia"],
      };
    }

    // Resposta padrão do Zé da Obra
    const defaultProducts = await this.searchRelevantProducts("cimento");
    return {
      response: `🔧 Olá ${userName}! Sou o *Zé da Obra*, engenheiro especialista da HubConstruções!\n\nPosso calcular materiais para:\n• 🧱 *Alvenaria e Muros* (tijolos e argamassa)\n• 📐 *Reboco e Emboço* (cimento, areia e aditivo)\n• 🏗️ *Contrapiso e Lajes* (concreto e ferragens)\n• 🎨 *Pintura e Revestimento* (tintas, pisos e argamassa AC3)\n\nMe informe as medidas (ex: *"preciso rebocar 20 metros"* ou *"quantos tijolos para 15m²"*) que eu calculo tudo na hora!`,
      persona: "ze",
      products: defaultProducts,
      suggestedActions: [
        "Calcular reboco para 15m²",
        "Calcular tijolos para muro de 20m²",
        "Calcular contrapiso para 30m²",
        "Voltar para a Lia",
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
      response: `Olá ${userName}! 😊 Sou a Lia, sua consultora na HubConstruções. Estou pronta para te ajudar com produtos, prazos e cálculos de materiais com o Zé da Obra. Como posso ajudar com seu projeto hoje?`,
      persona: "lia",
      suggestedActions: [
        "Ver cimento e tijolos",
        "Calcular reboco",
        "Consultar entregas",
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
