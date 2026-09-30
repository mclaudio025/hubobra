import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheEvict } from "../cache/cache.decorator";
import axios from "axios";

export interface ClassificationResult {
  productId: string;
  productName: string;
  sku?: string;
  previousCategoryId?: string;
  previousCategoryName?: string;
  newCategoryId: string;
  newCategoryName: string;
  confidence: number;
  reason: string;
  changed: boolean;
}

export interface CategoryKnowledge {
  id: string;
  name: string;
  normName: string;
  description: string;
  parentName?: string;
  parentNorm: string;
  slug: string;
  isLeaf: boolean;
  phrases: string[];
  terms: string[];
}

@Injectable()
export class CategoryClassifierService {
  private readonly logger = new Logger(CategoryClassifierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normaliza texto removendo acentos, pontuação e caracteres especiais
   */
  private normalizeText(text: string): string {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Lematiza palavras no português (plural para singular, flexões comuns)
   */
  private lemmatize(word: string): string {
    const w = this.normalizeText(word);
    if (!w || w.length <= 3) return w;
    if (w.endsWith("oes") || w.endsWith("ões")) return w.replace(/(oes|ões)$/, "ao");
    if (w.endsWith("ais")) return w.replace(/ais$/, "al");
    if (w.endsWith("eis")) return w.replace(/eis$/, "el");
    if (w.endsWith("ois")) return w.replace(/ois$/, "ol");
    if (w.endsWith("les")) return w.replace(/les$/, "l");
    if (w.endsWith("res")) return w.replace(/res$/, "r");
    if (w.endsWith("zes")) return w.replace(/zes$/, "z");
    if (w.endsWith("ns")) return w.replace(/ns$/, "m");
    if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("is") && !w.endsWith("us") && !["gas", "gesso", "tres"].includes(w)) {
      return w.slice(0, -1);
    }
    return w;
  }

  /**
   * Tokeniza e lematiza um texto completo
   */
  private tokenizeAndLemmatize(text: string): { rawWords: string[]; lemmas: string[]; rawText: string } {
    const rawText = this.normalizeText(text);
    const rawWords = rawText.split(" ").filter((w) => w.length > 1);
    const lemmas = rawWords.map((w) => this.lemmatize(w));
    return { rawWords, lemmas, rawText };
  }

  /**
   * Constrói a base de conhecimento de categorias a partir dos dados do banco
   * e das descrições cadastradas pelo usuário.
   */
  async buildKnowledgeBase(): Promise<CategoryKnowledge[]> {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      include: {
        parent: true,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return categories.map((cat) => {
      const normName = this.normalizeText(cat.name);
      const parentNorm = cat.parent ? this.normalizeText(cat.parent.name) : "";
      const isLeaf = Boolean(cat.parentId);

      const phrases: string[] = [normName];
      const termTokens = new Set<string>();

      const catTokens = this.tokenizeAndLemmatize(cat.name);
      catTokens.lemmas.forEach((l) => termTokens.add(l));

      if (cat.description) {
        const rawPhrases = cat.description.split(/[\n\r•\*\-;,/()]+/);
        for (const p of rawPhrases) {
          const cleanP = this.normalizeText(p);
          if (cleanP.length >= 3) {
            phrases.push(cleanP);
            const pTokens = this.tokenizeAndLemmatize(cleanP);
            pTokens.lemmas.forEach((l) => {
              if (
                l.length > 2 &&
                !["com", "sem", "para", "que", "dos", "das", "por", "sobre", "tipo", "item", "itens", "uso", "geral"].includes(l)
              ) {
                termTokens.add(l);
              }
            });
          }
        }
      }

      if (cat.parent?.name) {
        phrases.push(parentNorm);
      }

      return {
        id: cat.id,
        name: cat.name,
        normName,
        description: cat.description || "",
        parentName: cat.parent?.name,
        parentNorm,
        slug: cat.slug,
        isLeaf,
        phrases: Array.from(new Set(phrases)),
        terms: Array.from(termTokens),
      };
    });
  }

  /**
   * Obtém a chave do Google Gemini a partir das configurações ou variáveis de ambiente
   */
  private async getGeminiApiKey(): Promise<string | null> {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
      return process.env.GEMINI_API_KEY.trim();
    }

    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: "gemini_api_key" },
      });
      if (setting && setting.value && setting.value.trim() !== "") {
        return setting.value.trim();
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  /**
   * Classifica produtos em lote usando Google Gemini Flash
   */
  private async classifyWithGemini(
    products: Array<{ id: string; name: string; brand?: string; description?: string }>,
    knowledgeBase: CategoryKnowledge[],
    apiKey: string
  ): Promise<Map<string, { categoryId: string; categoryName: string; confidence: number; reason: string }>> {
    const resultsMap = new Map<string, { categoryId: string; categoryName: string; confidence: number; reason: string }>();

    try {
      const categoryDescriptions = knowledgeBase
        .filter((k) => k.isLeaf) // Priorizar subcategorias específicas
        .map((k, idx) => {
          const parentInfo = k.parentName ? ` [Setor: ${k.parentName}]` : "";
          const descInfo = k.description ? `\n   Itens/Exemplos: ${k.description.replace(/\n+/g, " | ")}` : "";
          return `${idx + 1}. ID: "${k.id}" | Nome: "${k.name}"${parentInfo}${descInfo}`;
        })
        .join("\n\n");

      const productList = products
        .map((p, idx) => {
          return `${idx + 1}. ID: "${p.id}" | Nome: "${p.name}" | Marca: "${p.brand || "N/A"}"`;
        })
        .join("\n");

      const prompt = `Você é um classificador especialista de catálogo de materiais de construção, hidráulica, elétrica, tintas, ferramentas e acabamentos.

CATEGORIAS DO CATÁLOGO (Use APENAS estes IDs de categoria):
${categoryDescriptions}

PRODUTOS A SEREM CLASSIFICADOS:
${productList}

DIRETRIZES TÉCNICAS ESTRITAS:
1. "Lixas" (lixa ferro, lixa madeira, lixa d'água, lixa massa, folha de lixa), "Discos de Corte", "Discos Flap", "Rebolos", "Discos Diamantados" PERTENCEM ESTRITAMENTE A "Abrasivos e Corte" (em Ferramentas). NUNCA COLOQUE LIXAS EM PINTURA!
2. "Rolos de Lã/Espuma", "Trinchas", "Pincéis", "Bandejas de Pintura", "Fitas Crepe" PERTENCEM A "Acessórios de Pintura".
3. "Suportes de TV", "Suportes Articulados", "Suportes de Micro-ondas", "Mão Francesa" PERTENCEM A "Suportes e Fixação de Aparelhos" (em Utilidades). NUNCA COLOQUE SUPORTES DE TV EM CONEXÕES HIDRÁULICAS!
4. "Tubos de Esgoto", "Tubos Soldáveis Água Fria", "Joelhos PVC", "Cotovelos", "Luvas PVC", "Tês PVC", "Adaptadores Soldáveis", "Buchas de Redução PVC" PERTENCEM A "Tubos e Conexões PVC".
5. "Fechaduras", "Cadeados", "Dobradiças", "Parafusos", "Pregos", "Buchas de Nylon" PERTENCEM ÀS RESPECTIVAS SUBCATEGORIAS DE "Portas, Janelas e Ferragens".
6. "Rejuntes", "Niveladores", "Espaçadores", "Cunhas" PERTENCEM A "Rejuntes e Niveladores" (em Pisos).
7. Retorne a resposta ESTRITAMENTE em formato JSON válido como um array de objetos:
[
  {
    "productId": "ID_DO_PRODUTO",
    "categoryId": "ID_DA_CATEGORIA",
    "confidence": 0.98,
    "reason": "Explicação técnica curta da categorização"
  }
]`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.05,
            responseMimeType: "application/json",
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 25000,
        }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const cat = knowledgeBase.find((k) => k.id === item.categoryId);
            if (cat && item.productId) {
              resultsMap.set(item.productId, {
                categoryId: cat.id,
                categoryName: cat.name,
                confidence: typeof item.confidence === "number" ? item.confidence : 0.95,
                reason: item.reason || `Classificado com base em correspondência técnica com ${cat.name}`,
              });
            }
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`Erro na chamada Gemini Flash: ${error?.message || error}. Usando motor semântico local especializado.`);
    }

    return resultsMap;
  }

  /**
   * Motor Semântico / Heurística de Regras Especializada em Materiais de Construção
   */
  classifyWithRules(
    product: { name: string; brand?: string; description?: string },
    knowledgeBase: CategoryKnowledge[]
  ): { categoryId: string; categoryName: string; confidence: number; reason: string } | null {
    const { lemmas, rawText } = this.tokenizeAndLemmatize(
      `${product.name} ${product.brand || ""} ${product.description || ""}`
    );

    // Flags contextuais do produto
    const isLixaOrAbrasivo =
      rawText.includes("lixa") ||
      rawText.includes("disco de corte") ||
      rawText.includes("disco flap") ||
      rawText.includes("disco desbaste") ||
      rawText.includes("diamantado") ||
      rawText.includes("rebolo") ||
      rawText.includes("esmeril") ||
      rawText.includes("abrasiv");

    const isSuporteTvOuAparelho =
      (rawText.includes("suporte") && (rawText.includes("tv") || rawText.includes("televis") || rawText.includes("monitor") || rawText.includes("lcd") || rawText.includes("led") || rawText.includes("articulado") || rawText.includes("inclinavel") || rawText.includes("fixo") || rawText.includes("microondas"))) ||
      rawText.includes("mao francesa");

    const isEsgotoProduct =
      rawText.includes("esgoto") ||
      rawText.includes("pvce") ||
      rawText.includes("pluvial") ||
      rawText.includes("serie normal") ||
      rawText.includes("sifonad") ||
      rawText.includes("ralo") ||
      rawText.includes("grelha");

    const isConsumivel =
      rawText.includes("cola") ||
      rawText.includes("adesivo") ||
      rawText.includes("veda rosca") ||
      rawText.includes("lubrificante") ||
      rawText.includes("teflon") ||
      rawText.includes("solucao limpadora");

    const isPvcConexao =
      (rawText.includes("soldavel") ||
        rawText.includes("joelho") ||
        rawText.includes("cotovelo") ||
        rawText.includes("uniao") ||
        rawText.includes("luva pvc") ||
        rawText.includes("luva soldavel") ||
        rawText.includes("te ") ||
        rawText.includes("tes ") ||
        rawText.includes("te soldavel") ||
        rawText.includes("bucha de reducao") ||
        rawText.includes("adaptador curto") ||
        rawText.includes("adaptador soldavel") ||
        rawText.includes("curva 90") ||
        rawText.includes("curva 45") ||
        rawText.includes("tubo") ||
        rawText.includes("cano pvc")) &&
      !isSuporteTvOuAparelho &&
      !isLixaOrAbrasivo;

    let bestCategory: CategoryKnowledge | null = null;
    let highestScore = 0;
    let bestReason = "";

    for (const cat of knowledgeBase) {
      // Prioridade forte para subcategorias folhas
      let score = cat.isLeaf ? 20 : 0;
      const matchedPhrases: string[] = [];
      const matchedTerms: string[] = [];

      // 1. Frases Exatas
      for (const phrase of cat.phrases) {
        if (phrase.length >= 4 && rawText.includes(phrase)) {
          score += phrase.length * 3;
          matchedPhrases.push(phrase);
        }
      }

      // 2. Termos e Lematização
      for (const t of cat.terms) {
        if (lemmas.includes(t)) {
          score += 10;
          matchedTerms.push(t);
        }
      }

      // 3. Regras de Domínio Especializadas e Anti-Falsos Positivos

      // --- ABRASIVOS E CORTE (FERRAMENTAS) ---
      if (cat.normName.includes("abrasivos e corte") || cat.slug === "abrasivos-e-corte") {
        if (isLixaOrAbrasivo) score += 250;
        else score -= 100;
      }

      // --- SUPORTES E FIXAÇÃO (UTILIDADES) ---
      if (cat.normName.includes("suportes e fixacao") || cat.slug === "suportes-e-fixacao-aparelhos") {
        if (isSuporteTvOuAparelho) score += 250;
        else score -= 100;
      }

      // --- ACESSÓRIOS DE PINTURA ---
      if (cat.normName.includes("acessorios de pintura") || cat.slug === "acessorios-de-pintura") {
        if (isLixaOrAbrasivo) {
          score -= 300; // NUNCA colocar lixas aqui!
        }
        if (
          rawText.includes("rolo") ||
          rawText.includes("trincha") ||
          rawText.includes("pincel") ||
          rawText.includes("bandeja") ||
          rawText.includes("extensor")
        ) {
          score += 150;
        }
      }

      // --- TUBOS E CONEXÕES PVC (HIDRÁULICA) ---
      if (cat.normName.includes("tubos e conexoes pvc") || cat.slug === "tubos-e-conexoes-pvc") {
        if (isSuporteTvOuAparelho || isLixaOrAbrasivo) {
          score -= 300; // NUNCA colocar suporte ou lixa aqui!
        }
        if (isPvcConexao || isEsgotoProduct) {
          score += 180;
        }
      }

      // --- TINTAS IMOBILIÁRIAS ---
      if (cat.normName.includes("tintas imobiliarias") || cat.slug === "tintas-imobiliarias") {
        if (
          (rawText.includes("tinta acrilica") ||
            rawText.includes("tinta latex") ||
            rawText.includes("tinta pva") ||
            rawText.includes("tinta piso") ||
            rawText.includes("tinta emborrachada") ||
            rawText.includes("rende muito") ||
            rawText.includes("lavavel")) &&
          !rawText.includes("spray")
        ) {
          score += 150;
        }
      }

      // --- ESMALTES E VERNIZES ---
      if (cat.normName.includes("esmaltes e vernizes") || cat.slug === "esmaltes-e-vernizes") {
        if (rawText.includes("esmalte sintetico") || rawText.includes("verniz") || rawText.includes("stain")) {
          score += 150;
        }
      }

      // --- MASSAS, SELADORES E SOLVENTES ---
      if (cat.normName.includes("massas seladores e solventes") || cat.slug === "massas-seladores-e-solventes") {
        if (
          rawText.includes("massa corrida") ||
          rawText.includes("massa acrilica") ||
          rawText.includes("selador") ||
          rawText.includes("fundo preparador") ||
          rawText.includes("aguarras") ||
          rawText.includes("thinner")
        ) {
          score += 150;
        }
      }

      // --- CIMENTOS E ARGAMASSAS ---
      if (cat.normName.includes("cimentos e argamassas") || cat.slug === "cimentos-e-argamassas") {
        if (
          rawText.includes("cimento") ||
          rawText.includes("argamassa") ||
          rawText.includes("ac-i") ||
          rawText.includes("ac-ii") ||
          rawText.includes("ac-iii") ||
          rawText.includes("graute") ||
          rawText.includes("cal hidratada")
        ) {
          score += 150;
        }
      }

      // --- REJUNTES E NIVELADORES ---
      if (cat.normName.includes("rejuntes e niveladores") || cat.slug === "rejuntes-e-niveladores") {
        if (
          rawText.includes("rejunte") ||
          rawText.includes("espacador") ||
          rawText.includes("cunha") ||
          rawText.includes("nivelador")
        ) {
          score += 150;
        }
      }

      // --- FECHADURAS E CADEADOS ---
      if (cat.normName.includes("fechaduras e cadeados") || cat.slug === "fechaduras-e-cadeados") {
        if (rawText.includes("fechadura") || rawText.includes("cadeado") || rawText.includes("cilindro")) {
          score += 150;
        }
      }

      // --- PARAFUSOS, PREGOS E BUCHAS ---
      if (cat.normName.includes("parafusos pregos e buchas") || cat.slug === "parafusos-pregos-e-buchas") {
        if (
          rawText.includes("parafuso") ||
          rawText.includes("prego") ||
          rawText.includes("bucha de nylon") ||
          rawText.includes("bucha nylon") ||
          (rawText.includes("bucha") && !rawText.includes("reducao"))
        ) {
          score += 150;
        }
      }

      // --- CABOS E FIOS ELÉTRICOS ---
      if (cat.normName.includes("cabos e fios") || cat.slug === "cabos-e-fios-eletricos") {
        if (
          rawText.includes("cabo flexivel") ||
          rawText.includes("fio flexivel") ||
          rawText.includes("fio paralelo") ||
          (rawText.includes("cabo") && (rawText.includes("mm") || rawText.includes("coaxial") || rawText.includes("rede")))
        ) {
          score += 150;
        }
      }

      // --- DISJUNTORES E QUADROS ---
      if (cat.normName.includes("disjuntores e quadros") || cat.slug === "disjuntores-e-quadros") {
        if (rawText.includes("disjuntor") || rawText.includes("quadro de distribuicao") || rawText.includes("dps") || rawText.includes(" dr ")) {
          score += 150;
        }
      }

      // --- LÂMPADAS LED ---
      if (cat.normName.includes("lampadas led") || cat.slug === "lampadas-led") {
        if (rawText.includes("lampada") || rawText.includes("bulbo led") || rawText.includes("tubular led")) {
          score += 150;
        }
      }

      if (score > highestScore && score >= 20) {
        highestScore = score;
        bestCategory = cat;
        bestReason =
          matchedPhrases.length > 0
            ? `Correspondeu a "${matchedPhrases.slice(0, 2).join('", "')}" em ${cat.name}`
            : `Termos correspondentes (${matchedTerms.slice(0, 3).join(", ")}) em ${cat.name}`;
      }
    }

    if (bestCategory) {
      const confidence = Math.min(0.99, Math.max(0.7, highestScore / 100));
      return {
        categoryId: bestCategory.id,
        categoryName: bestCategory.name,
        confidence,
        reason: bestReason,
      };
    }

    return null;
  }

  /**
   * Executa a auto-classificação de um produto individual
   */
  async classifySingleProduct(product: {
    name: string;
    brand?: string;
    description?: string;
  }): Promise<{ categoryId: string; categoryName: string; confidence: number; reason: string } | null> {
    const knowledgeBase = await this.buildKnowledgeBase();
    if (knowledgeBase.length === 0) return null;

    const apiKey = await this.getGeminiApiKey();
    if (apiKey) {
      const geminiResult = await this.classifyWithGemini(
        [{ id: "single", name: product.name, brand: product.brand, description: product.description }],
        knowledgeBase,
        apiKey
      );
      if (geminiResult.has("single")) {
        return geminiResult.get("single")!;
      }
    }

    return this.classifyWithRules(product, knowledgeBase);
  }

  /**
   * Executa a auto-classificação em massa de todo o catálogo ou produtos pendentes
   */
  @CacheEvict("products:*")
  @CacheEvict("categories:*")
  async autoClassifyCatalog(options: {
    mode?: "all" | "unclassified_only";
    limit?: number;
  }): Promise<{
    success: boolean;
    totalAnalyzed: number;
    totalUpdated: number;
    totalUnchanged: number;
    changes: ClassificationResult[];
    summaryByCategory: Record<string, number>;
  }> {
    const { mode = "all", limit = 1000 } = options;

    const knowledgeBase = await this.buildKnowledgeBase();
    if (knowledgeBase.length === 0) {
      throw new Error("Nenhuma categoria ativa cadastrada no sistema.");
    }

    // Buscar produtos a classificar (NUNCA alterar produtos travados pelo usuário)
    const where: any = {
      isCategoryLocked: false,
    };
    if (mode === "unclassified_only") {
      where.OR = [{ categoryId: null }, { categoryId: "" }];
    }

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (products.length === 0) {
      return {
        success: true,
        totalAnalyzed: 0,
        totalUpdated: 0,
        totalUnchanged: 0,
        changes: [],
        summaryByCategory: {},
      };
    }

    this.logger.log(`Iniciando auto-classificação especializada de ${products.length} produtos (Modo: ${mode})...`);

    const apiKey = await this.getGeminiApiKey();
    const changes: ClassificationResult[] = [];
    const summaryByCategory: Record<string, number> = {};
    let totalUpdated = 0;
    let totalUnchanged = 0;

    // Processar em lotes de 25 produtos
    const batchSize = 25;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      let batchResults = new Map<string, { categoryId: string; categoryName: string; confidence: number; reason: string }>();

      // Tentar classificar com Gemini se houver chave configurada
      if (apiKey) {
        batchResults = await this.classifyWithGemini(
          batch.map((p) => ({ id: p.id, name: p.name, brand: p.brand || "", description: p.description || "" })),
          knowledgeBase,
          apiKey
        );
      }

      // Para cada produto no lote
      for (const product of batch) {
        let classification = batchResults.get(product.id);

        // Se Gemini não classificou este item ou não houver API Key, usar motor semântico de regras
        if (!classification) {
          classification =
            this.classifyWithRules(
              { name: product.name, brand: product.brand || "", description: product.description || "" },
              knowledgeBase
            ) || undefined;
        }

        if (classification && classification.categoryId) {
          const isDifferent = product.categoryId !== classification.categoryId;

          if (isDifferent) {
            // Atualizar produto no banco de dados
            await this.prisma.product.update({
              where: { id: product.id },
              data: { categoryId: classification.categoryId },
            });

            totalUpdated++;
            summaryByCategory[classification.categoryName] = (summaryByCategory[classification.categoryName] || 0) + 1;

            changes.push({
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              previousCategoryId: product.categoryId || undefined,
              previousCategoryName: product.category?.name || "Sem Categoria",
              newCategoryId: classification.categoryId,
              newCategoryName: classification.categoryName,
              confidence: classification.confidence,
              reason: classification.reason,
              changed: true,
            });
          } else {
            totalUnchanged++;
          }
        } else {
          totalUnchanged++;
        }
      }
    }

    this.logger.log(`Auto-classificação concluída: ${totalUpdated} produtos atualizados de ${products.length} analisados.`);

    return {
      success: true,
      totalAnalyzed: products.length,
      totalUpdated,
      totalUnchanged,
      changes,
      summaryByCategory,
    };
  }
}
