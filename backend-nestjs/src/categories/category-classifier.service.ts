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
  normalizedName: string;
  description: string;
  parentName?: string;
  slug: string;
  keywords: string[];
  exactPhrases: string[];
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
      const normalizedName = this.normalizeText(cat.name);
      const exactPhrases: string[] = [normalizedName];
      const keywordsSet = new Set<string>();

      // Adicionar palavras do nome da categoria
      normalizedName.split(" ").forEach((word) => {
        if (word.length > 2 && !["com", "sem", "para", "que", "dos", "das", "por", "sobre"].includes(word)) {
          keywordsSet.add(word);
        }
      });

      // Processar o campo descrição (bullet points, parênteses, listas)
      if (cat.description) {
        // Separar linhas ou marcadores (•, -, *, etc)
        const lines = cat.description.split(/[\n\r•\*\-;,]+/);
        for (const line of lines) {
          const cleanedLine = this.normalizeText(line);
          if (cleanedLine.length >= 3) {
            exactPhrases.push(cleanedLine);

            // Separar palavras individuais da linha
            cleanedLine.split(" ").forEach((w) => {
              if (w.length > 2 && !["com", "sem", "para", "que", "dos", "das", "por", "tipo", "item", "itens"].includes(w)) {
                keywordsSet.add(w);
              }
            });
          }
        }
      }

      // Adicionar nome da categoria pai se houver
      if (cat.parent?.name) {
        const normParent = this.normalizeText(cat.parent.name);
        exactPhrases.push(normParent);
      }

      return {
        id: cat.id,
        name: cat.name,
        normalizedName,
        description: cat.description || "",
        parentName: cat.parent?.name,
        slug: cat.slug,
        keywords: Array.from(keywordsSet),
        exactPhrases: Array.from(new Set(exactPhrases)),
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
        .map((k, idx) => {
          const parentInfo = k.parentName ? ` (Subcategoria de: ${k.parentName})` : "";
          const descInfo = k.description ? `\n   Itens/Descrição: ${k.description.replace(/\n+/g, " | ")}` : "";
          return `${idx + 1}. ID: "${k.id}" - Nome: "${k.name}"${parentInfo}${descInfo}`;
        })
        .join("\n\n");

      const productList = products
        .map((p, idx) => {
          return `${idx + 1}. ID: "${p.id}" | Nome: "${p.name}" | Marca: "${p.brand || "N/A"}"`;
        })
        .join("\n");

      const prompt = `Você é um classificador especialista de catálogo de materiais de construção, ferramentas, hidráulica, elétrica, tintas e acabamentos.

CATEGORIAS DO CATÁLOGO (Use APENAS estes IDs de categoria):
${categoryDescriptions}

PRODUTOS A SEREM CLASSIFICADOS:
${productList}

INSTRUÇÕES:
1. Para cada produto, identifique qual categoria disponível tem maior correspondência semântica e técnica com o produto.
2. Observe atentamente a descrição e os itens cadastrados em cada categoria (ex: "disco de lixa" pertence a lixas/acessórios de pintura, "tubos e conexões soldáveis" pertence a água/hidráulica, "tubo esgoto" pertence a esgoto).
3. Retorne a resposta ESTRITAMENTE em formato JSON válido como um array de objetos:
[
  {
    "productId": "ID_DO_PRODUTO",
    "categoryId": "ID_DA_CATEGORIA",
    "confidence": 0.95,
    "reason": "Explicação curta do motivo do enquadramento"
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
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000,
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
      this.logger.warn(`Erro na chamada Gemini Flash: ${error?.message || error}. Usando motor semântico local.`);
    }

    return resultsMap;
  }

  /**
   * Motor Semântico / Heurística de Regras baseada no catálogo de categorias e descrições
   */
  classifyWithRules(
    product: { name: string; brand?: string; description?: string },
    knowledgeBase: CategoryKnowledge[]
  ): { categoryId: string; categoryName: string; confidence: number; reason: string } | null {
    const normName = this.normalizeText(product.name);
    const normBrand = this.normalizeText(product.brand || "");
    const normDesc = this.normalizeText(product.description || "");
    const fullProductText = `${normName} ${normBrand} ${normDesc}`.trim();

    let bestCategory: CategoryKnowledge | null = null;
    let highestScore = 0;
    let bestReason = "";

    for (const cat of knowledgeBase) {
      let score = 0;
      const matchedPhrases: string[] = [];

      // 1. Verificação de Frases Exatas da Descrição ou Nome (Peso Alto: 20 a 50 pontos)
      for (const phrase of cat.exactPhrases) {
        if (phrase.length >= 4 && fullProductText.includes(phrase)) {
          const phraseScore = phrase.length * 4;
          score += phraseScore;
          matchedPhrases.push(phrase);
        }
      }

      // 2. Verificação de Palavras-Chave Individuais (Peso: 5 pontos por palavra)
      const productWords = fullProductText.split(" ");
      let keywordHits = 0;
      for (const kw of cat.keywords) {
        if (productWords.includes(kw)) {
          score += 6;
          keywordHits++;
        } else if (kw.length >= 5 && fullProductText.includes(kw)) {
          score += 3;
          keywordHits++;
        }
      }

      // 3. Regras e contextualizações específicas da construção civil
      if (cat.normalizedName.includes("esgoto") || cat.description.toLowerCase().includes("esgoto")) {
        if (fullProductText.includes("esgoto") || fullProductText.includes("pluvial") || fullProductText.includes("ralo") || fullProductText.includes("sifonada")) {
          score += 40;
        }
      }

      if (cat.normalizedName.includes("agua") || cat.normalizedName.includes("pvc") || cat.description.toLowerCase().includes("agua fria")) {
        if (fullProductText.includes("soldavel") || fullProductText.includes("agua fria") || fullProductText.includes("marrom") || fullProductText.includes("rosavel")) {
          score += 40;
        }
        // Penalizar se for esgoto
        if (fullProductText.includes("esgoto")) {
          score -= 50;
        }
      }

      if (cat.normalizedName.includes("lixa") || cat.normalizedName.includes("pintura") || cat.description.toLowerCase().includes("lixa")) {
        if (fullProductText.includes("lixa") || fullProductText.includes("disco de lixa") || fullProductText.includes("velcro") || fullProductText.includes("grao") || fullProductText.includes("g080") || fullProductText.includes("g100") || fullProductText.includes("g120") || fullProductText.includes("g150") || fullProductText.includes("trincha") || fullProductText.includes("rolo")) {
          score += 50;
        }
      }

      if (score > highestScore && score >= 12) {
        highestScore = score;
        bestCategory = cat;
        bestReason = matchedPhrases.length > 0
          ? `Correspondeu a "${matchedPhrases.slice(0, 2).join('", "')}" na descrição de ${cat.name}`
          : `Correspondeu a ${keywordHits} palavra(s)-chave da categoria ${cat.name}`;
      }
    }

    if (bestCategory) {
      const confidence = Math.min(0.99, Math.max(0.65, highestScore / 80));
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

    // Buscar produtos a classificar
    const where: any = {};
    if (mode === "unclassified_only") {
      where.OR = [
        { categoryId: null },
        { categoryId: "" },
      ];
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

    this.logger.log(`Iniciando auto-classificação de ${products.length} produtos (Modo: ${mode})...`);

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

      // Tentar classificar com Gemini Flash se houver chave configurada
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

        // Se Gemini não classificou este item, usar o motor semântico de regras
        if (!classification) {
          classification = this.classifyWithRules(
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
