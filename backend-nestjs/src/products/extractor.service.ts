import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CategoryClassifierService } from "../categories/category-classifier.service";

export interface ExtractedProduct {
  store: string;
  storeLogo: string;
  productId: string;
  name: string;
  brand: string;
  ean: string;
  price: number;
  listPrice: number;
  available: boolean;
  url: string;
  image: string;
  categories: string[];
  description: string;
  alreadyInCatalog?: boolean;
  existingProduct?: any;
}

export interface ExtractorImportDto {
  name: string;
  brand?: string;
  ean?: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  stock?: number;
  unit?: string;
  image?: string;
  description?: string;
  categoryName?: string;
  store?: string;
}

@Injectable()
export class ExtractorService {
  private readonly logger = new Logger(ExtractorService.name);
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  private readonly axiosClient = axios.create({
    timeout: 9000,
    headers: {
      "User-Agent": this.userAgent,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryClassifier: CategoryClassifierService
  ) {}

  /**
   * Decodifica entidades HTML básicas
   */
  private decodeHtml(str: string): string {
    if (!str) return "";
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&ccedil;/gi, "ç")
      .replace(/&atilde;/gi, "ã")
      .replace(/&otilde;/gi, "õ")
      .replace(/&eacute;/gi, "é")
      .replace(/&aacute;/gi, "á")
      .replace(/&iacute;/gi, "í")
      .replace(/&oacute;/gi, "ó")
      .replace(/&uacute;/gi, "ú")
      .replace(/&acirc;/gi, "â")
      .replace(/&ecirc;/gi, "ê")
      .replace(/&ocirc;/gi, "ô")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–");
  }

  /**
   * Remove menções proprietárias de concorrentes no título
   */
  private cleanProductName(name: string): string {
    if (!name) return "";
    return name
      .replace(/\|\s*(Normatel|Acal|Carajás|Obramax|Telhanorte|Leroy Merlin|C&C|JC Materiais)/gi, "")
      .replace(/Exclusivo\s+(Acal|Normatel|Carajás|Obramax|Telhanorte|Leroy\s*Merlin|JC\s*Materiais)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * 1. Conector Carajás (VTEX Intelligent Search & Catalog System)
   */
  async searchCarajas(query: string): Promise<ExtractedProduct[]> {
    try {
      // 1. Tentar Intelligent Search (sinônimos + IA)
      try {
        const isUrl = `https://www.carajas.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(query)}`;
        const res = await this.axiosClient.get(isUrl);
        const products = res.data?.products;
        if (Array.isArray(products) && products.length > 0) {
          return products
            .map((item: any) => {
              const sku = item.items?.[0] || {};
              const seller = sku.sellers?.[0]?.commertialOffer || {};
              const image =
                sku.images?.[0]?.imageUrl ||
                item.items?.[0]?.images?.[0]?.imageUrl ||
                "";

              return {
                store: "Carajás",
                storeLogo: "https://www.carajas.com.br/arquivos/logo-carajas.png",
                productId: `carajas-${item.productId}`,
                name: this.cleanProductName(item.productName || item.name),
                brand: item.brand || "Carajás",
                ean: sku.ean || item.productReference || "",
                price: Number(seller.Price) || Number(seller.ListPrice) || 0,
                listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
                available: seller.AvailableQuantity > 0,
                url: item.link || `https://www.carajas.com.br/${item.linkText}/p`,
                image: image,
                categories: item.categories || [],
                description: item.description || "",
              };
            })
            .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
        }
      } catch (isErr) {
        // Fallback para Catalog
      }

      // 2. Fallback para Catalog System direto (sem _from/_to que gera 400 na Carajás)
      const url = `https://carajas.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Referer: "https://www.carajas.com.br/",
          Origin: "https://www.carajas.com.br",
          Accept: "application/json",
        },
      });
      if (!Array.isArray(res.data)) return [];

      return res.data
        .map((item: any) => {
          const sku = item.items?.[0] || {};
          const seller = sku.sellers?.[0]?.commertialOffer || {};
          const image =
            sku.images?.[0]?.imageUrl ||
            item.items?.[0]?.images?.[0]?.imageUrl ||
            "";

          return {
            store: "Carajás",
            storeLogo: "https://www.carajas.com.br/arquivos/logo-carajas.png",
            productId: `carajas-${item.productId}`,
            name: this.cleanProductName(item.productName || item.name),
            brand: item.brand || "Carajás",
            ean: sku.ean || item.productReference || "",
            price: Number(seller.Price) || Number(seller.ListPrice) || 0,
            listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
            available: seller.AvailableQuantity > 0,
            url: item.link || `https://www.carajas.com.br/${item.linkText}/p`,
            image: image,
            categories: item.categories || [],
            description: item.description || "",
          };
        })
        .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
    } catch (err: any) {
      this.logger.warn(`[Carajás] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * 2. Conector Acal Home Center (VTEX Catalog System)
   */
  async searchAcal(query: string): Promise<ExtractedProduct[]> {
    try {
      const url = `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Referer: "https://www.acalhomecenter.com.br/",
          Origin: "https://www.acalhomecenter.com.br",
          Accept: "application/json",
        },
      });
      if (!Array.isArray(res.data)) return [];

      return res.data
        .map((item: any) => {
          const sku = item.items?.[0] || {};
          const seller = sku.sellers?.[0]?.commertialOffer || {};
          const image =
            sku.images?.[0]?.imageUrl ||
            item.items?.[0]?.images?.[0]?.imageUrl ||
            "";

          return {
            store: "Acal",
            storeLogo: "https://www.acalhomecenter.com.br/arquivos/logo-acal.png",
            productId: `acal-${item.productId}`,
            name: this.cleanProductName(item.productName || item.name),
            brand: item.brand || "Acal",
            ean: sku.ean || item.productReference || "",
            price: Number(seller.Price) || Number(seller.ListPrice) || 0,
            listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
            available: seller.AvailableQuantity > 0,
            url: item.link || `https://www.acalhomecenter.com.br/${item.linkText}/p`,
            image: image,
            categories: item.categories || [],
            description: item.description || "",
          };
        })
        .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
    } catch (err: any) {
      this.logger.warn(`[Acal] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * 3. Conector Telhanorte (VTEX Catalog System)
   */
  async searchTelhanorte(query: string): Promise<ExtractedProduct[]> {
    try {
      const url = `https://www.telhanorte.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Referer: "https://www.telhanorte.com.br/",
          Origin: "https://www.telhanorte.com.br",
          Accept: "application/json",
        },
      });
      if (!Array.isArray(res.data)) return [];

      return res.data
        .map((item: any) => {
          const sku = item.items?.[0] || {};
          const seller = sku.sellers?.[0]?.commertialOffer || {};
          const image =
            sku.images?.[0]?.imageUrl ||
            item.items?.[0]?.images?.[0]?.imageUrl ||
            "";

          return {
            store: "Telhanorte",
            storeLogo: "https://telhanorte.vteximg.com.br/arquivos/logo-telhanorte.png",
            productId: `telhanorte-${item.productId}`,
            name: this.cleanProductName(item.productName || item.name),
            brand: item.brand || "Telhanorte",
            ean: sku.ean || item.productReference || "",
            price: Number(seller.Price) || Number(seller.ListPrice) || 0,
            listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
            available: seller.AvailableQuantity > 0,
            url: item.link || `https://www.telhanorte.com.br/${item.linkText}/p`,
            image: image,
            categories: item.categories || [],
            description: item.description || "",
          };
        })
        .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
    } catch (err: any) {
      this.logger.warn(`[Telhanorte] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * 4. Conector Obramax (VTEX Intelligent Search com sinônimos de construção)
   */
  async searchObramax(query: string): Promise<ExtractedProduct[]> {
    try {
      // 1. Tentar Intelligent Search (sinônimos + IA)
      try {
        const isUrl = `https://www.obramax.com.br/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(query)}`;
        const res = await this.axiosClient.get(isUrl);
        const products = res.data?.products;
        if (Array.isArray(products) && products.length > 0) {
          return products
            .map((item: any) => {
              const sku = item.items?.[0] || {};
              const seller = sku.sellers?.[0]?.commertialOffer || {};
              const image =
                sku.images?.[0]?.imageUrl ||
                item.items?.[0]?.images?.[0]?.imageUrl ||
                "";

              return {
                store: "Obramax",
                storeLogo: "https://lojaobramax.vteximg.com.br/arquivos/logo-obramax.png",
                productId: `obramax-${item.productId}`,
                name: this.cleanProductName(item.productName || item.name),
                brand: item.brand || "Obramax",
                ean: sku.ean || item.productReference || "",
                price: Number(seller.Price) || Number(seller.ListPrice) || 0,
                listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
                available: seller.AvailableQuantity > 0,
                url: item.link || `https://www.obramax.com.br/${item.linkText}/p`,
                image: image,
                categories: item.categories || [],
                description: item.description || "",
              };
            })
            .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
        }
      } catch (isErr) {
        // Fallback para Catalog
      }

      // 2. Fallback para Catalog System tradicional
      const url = `https://www.obramax.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Referer: "https://www.obramax.com.br/",
          Origin: "https://www.obramax.com.br",
          Accept: "application/json",
        },
      });
      if (!Array.isArray(res.data)) return [];

      return res.data
        .map((item: any) => {
          const sku = item.items?.[0] || {};
          const seller = sku.sellers?.[0]?.commertialOffer || {};
          const image =
            sku.images?.[0]?.imageUrl ||
            item.items?.[0]?.images?.[0]?.imageUrl ||
            "";

          return {
            store: "Obramax",
            storeLogo: "https://lojaobramax.vteximg.com.br/arquivos/logo-obramax.png",
            productId: `obramax-${item.productId}`,
            name: this.cleanProductName(item.productName || item.name),
            brand: item.brand || "Obramax",
            ean: sku.ean || item.productReference || "",
            price: Number(seller.Price) || Number(seller.ListPrice) || 0,
            listPrice: Number(seller.ListPrice) || Number(seller.Price) || 0,
            available: seller.AvailableQuantity > 0,
            url: item.link || `https://www.obramax.com.br/${item.linkText}/p`,
            image: image,
            categories: item.categories || [],
            description: item.description || "",
          };
        })
        .filter((i: ExtractedProduct) => i.price > 0 && i.name.length > 0);
    } catch (err: any) {
      this.logger.warn(`[Obramax] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * 5. Conector JC Materiais de Construção (Nuvemshop)
   */
  async searchJCMateriais(query: string): Promise<ExtractedProduct[]> {
    try {
      const url = `https://www.jcmateriais.com.br/search/?q=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      const html = typeof res.data === "string" ? res.data : "";
      if (!html) return [];

      const products: ExtractedProduct[] = [];
      const jsonLdRegex =
        /<script\s+type=["']application\/ld\+json["']\s+data-component=['"]structured-data\.item['"]>([\s\S]*?)<\/script>/gi;
      let match: RegExpExecArray | null;

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const item = JSON.parse(match[1].trim());
          if (item["@type"] === "Product") {
            const offer = item.offers || {};
            const brand =
              typeof item.brand === "object"
                ? item.brand.name
                : item.brand || "JC Materiais";
            const price = parseFloat(offer.price) || 0;
            const urlProduct =
              offer.url || item.mainEntityOfPage?.["@id"] || "";
            let image = Array.isArray(item.image)
              ? item.image[0]
              : item.image || "";
            if (image && image.startsWith("//")) image = "https:" + image;

            const name = this.cleanProductName(this.decodeHtml(item.name || ""));
            const description = this.decodeHtml(item.description || "");

            if (price > 0 && name.length > 0) {
              products.push({
                store: "JC Materiais",
                storeLogo: "https://www.jcmateriais.com.br/favicon.ico",
                productId: `jc-${item.sku || Math.random().toString(36).slice(2, 8)}`,
                name: name,
                brand: brand,
                ean: item.sku || "",
                price: price,
                listPrice: price,
                available: offer.availability
                  ? offer.availability.includes("InStock")
                  : true,
                url: urlProduct,
                image: image,
                categories: [],
                description: description,
              });
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      return products;
    } catch (err: any) {
      this.logger.warn(`[JC Materiais] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * Busca Unificada nos Grandes Home Centers
   */
  async searchAllStores(query: string): Promise<{
    query: string;
    total: number;
    stores: { jc: number; carajas: number; acal: number; telhanorte: number; obramax: number };
    products: ExtractedProduct[];
  }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        query: "",
        total: 0,
        stores: { jc: 0, carajas: 0, acal: 0, telhanorte: 0, obramax: 0 },
        products: [],
      };
    }

    this.logger.log(`🔍 Buscando nos Home Centers: "${cleanQuery}"`);

    const [jc, carajas, acal, telhanorte, obramax] = await Promise.all([
      this.searchJCMateriais(cleanQuery),
      this.searchCarajas(cleanQuery),
      this.searchAcal(cleanQuery),
      this.searchTelhanorte(cleanQuery),
      this.searchObramax(cleanQuery),
    ]);

    const all = [...jc, ...carajas, ...acal, ...telhanorte, ...obramax];

    // Verificar se já existem no banco para sinalizar na UI
    const eans = all.map((p) => p.ean).filter(Boolean);
    const existingProducts = await this.prisma.product.findMany({
      where: {
        OR: [
          { barcode: { in: eans } },
          { name: { in: all.map((p) => p.name) } },
        ],
      },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        price: true,
      },
    });

    const existingMap = new Map<string, any>();
    for (const ex of existingProducts) {
      if (ex.barcode) existingMap.set(ex.barcode, ex);
      existingMap.set(ex.name.toLowerCase().trim(), ex);
    }

    const enrichedProducts = all.map((p) => {
      const isExisting =
        (p.ean && existingMap.has(p.ean)) ||
        existingMap.has(p.name.toLowerCase().trim());
      return {
        ...p,
        alreadyInCatalog: Boolean(isExisting),
        existingProduct: isExisting
          ? existingMap.get(p.ean) ||
            existingMap.get(p.name.toLowerCase().trim())
          : null,
      };
    });

    return {
      query: cleanQuery,
      total: enrichedProducts.length,
      stores: {
        jc: jc.length,
        carajas: carajas.length,
        acal: acal.length,
        telhanorte: telhanorte.length,
        obramax: obramax.length,
      },
      products: enrichedProducts as any,
    };
  }

  /**
   * Importa lista de produtos para o Banco de Dados
   */
  async importProducts(items: ExtractorImportDto[]): Promise<{
    success: boolean;
    imported: number;
    skipped: number;
    products: any[];
  }> {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, imported: 0, skipped: 0, products: [] };
    }

    let defaultCategory = await this.prisma.category.findFirst({
      where: { active: true },
    });

    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.create({
        data: {
          name: "Geral",
          slug: "geral",
          active: true,
        },
      });
    }

    // Carrega base de conhecimento de categorias para classificação precisa
    const knowledgeBase = await this.categoryClassifier.buildKnowledgeBase().catch(() => []);

    let importedCount = 0;
    let skippedCount = 0;
    const createdProducts: any[] = [];

    for (const item of items) {
      try {
        const sku =
          item.sku ||
          item.ean ||
          `EAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Checar duplicidade
        const existing = await this.prisma.product.findFirst({
          where: {
            OR: [
              { sku: sku },
              ...(item.ean ? [{ barcode: item.ean }] : []),
              { name: item.name },
            ],
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Categorização inteligente usando o CategoryClassifierService
        let categoryId = defaultCategory.id;
        if (knowledgeBase && knowledgeBase.length > 0) {
          const classification = this.categoryClassifier.classifyWithRules(
            {
              name: item.name,
              brand: item.brand,
              description: `${item.name} ${item.categoryName || ""} ${item.description || ""}`,
            },
            knowledgeBase
          );
          if (classification && classification.categoryId) {
            categoryId = classification.categoryId;
          }
        }

        const price = Number(item.price) || 49.9;
        const comparePrice =
          item.comparePrice && item.comparePrice > price
            ? Number(item.comparePrice)
            : Math.round(price * 1.15 * 100) / 100;
        const cost =
          item.cost && item.cost > 0
            ? Number(item.cost)
            : Math.round(price * 0.7 * 100) / 100;

        let unit = item.unit || "UN";
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes("piso") || lowerName.includes("porcelanato") || lowerName.includes("revestimento")) {
          unit = "M2";
        } else if (lowerName.includes("cimento") || lowerName.includes("argamassa")) {
          unit = "SACO";
        } else if (lowerName.includes("fio") || lowerName.includes("cabo") || lowerName.includes("tubo")) {
          unit = "BARRA/M";
        }

        const newProd = await this.prisma.product.create({
          data: {
            name: item.name,
            sku: sku,
            barcode: item.ean || null,
            brand: item.brand || "Marca Referência",
            price: price,
            comparePrice: comparePrice,
            cost: cost,
            stock: item.stock && item.stock > 0 ? Number(item.stock) : 50,
            unit: unit,
            specifications:
              item.description ||
              `Produto de alta qualidade ${item.brand || ""}. Referência de mercado: ${item.store || "Home Center"}.`,
            description:
              item.description ||
              `Produto original ${item.name}, ideal para sua obra ou reforma.`,
            categoryId: categoryId,
            active: true,
            images: item.image
              ? {
                  create: [
                    {
                      url: item.image,
                      alt: item.name,
                      order: 0,
                    },
                  ],
                }
              : undefined,
          },
        });

        createdProducts.push(newProd);
        importedCount++;
      } catch (err: any) {
        this.logger.error(`Erro ao importar produto (${item.name}): ${err.message}`);
      }
    }

    return {
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      products: createdProducts,
    };
  }
}

