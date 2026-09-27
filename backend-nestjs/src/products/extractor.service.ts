import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  private readonly axiosClient = axios.create({
    timeout: 10000,
    headers: {
      "User-Agent": this.userAgent,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Remove menções proprietárias de concorrentes no título
   */
  private cleanProductName(name: string): string {
    if (!name) return "";
    return name
      .replace(/\|\s*Normatel/gi, "")
      .replace(/\|\s*Acal/gi, "")
      .replace(/\|\s*Carajás/gi, "")
      .replace(/\|\s*Leroy Merlin/gi, "")
      .replace(/Exclusivo\s+(Acal|Normatel|Carajás|Leroy\s*Merlin)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * 1. Conector Carajás (VTEX Catalog System)
   */
  async searchCarajas(query: string): Promise<ExtractedProduct[]> {
    try {
      const url = `https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=20`;
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
      const url = `https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=20`;
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
   * 3. Conector Normatel (Storefront Search)
   */
  async searchNormatel(query: string): Promise<ExtractedProduct[]> {
    try {
      const url = `https://www.normatel.com.br/busca?termo=${encodeURIComponent(query)}`;
      const res = await this.axiosClient.get(url, {
        headers: {
          Referer: "https://www.normatel.com.br/",
        },
      });

      const html = typeof res.data === "string" ? res.data : "";
      if (!html) return [];

      const imgRegex =
        /https:\/\/normatel\.fbitsstatic\.net\/img\/p\/([a-z0-9-]+)\/(\d+)-1\.jpg[^\s"']*/gi;
      const products: ExtractedProduct[] = [];
      const seenSlugs = new Set<string>();
      let match: RegExpExecArray | null;

      while ((match = imgRegex.exec(html)) !== null) {
        const slug = match[1];
        const prodId = match[2];
        const fullImg = match[0].split("?")[0] + "?w=500&h=500";
        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        const cleanName = slug
          .replace(/-\d+$/, "")
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        const imgPos = match.index;
        const chunk = html.slice(imgPos, imgPos + 1500);
        const priceMatch =
          chunk.match(/data-price=([\d\.]+)/) ||
          chunk.match(/R\$\s*([\d\.,]+)/);
        let price = 0;
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(".", "").replace(",", "."));
        }

        products.push({
          store: "Normatel",
          storeLogo: "https://www.normatel.com.br/arquivos/logo-normatel.png",
          productId: `normatel-${prodId || slug}`,
          name: this.cleanProductName(cleanName),
          brand: "Normatel",
          ean: "",
          price: price > 0 ? price : 49.9,
          listPrice: price > 0 ? Math.round(price * 1.15 * 100) / 100 : 59.9,
          available: true,
          url: `https://www.normatel.com.br/${slug}`,
          image: fullImg,
          categories: [],
          description: `Produto ${cleanName} de alta qualidade disponível na Normatel Home Center.`,
        });

        if (products.length >= 20) break;
      }

      return products;
    } catch (err: any) {
      this.logger.warn(`[Normatel] Falha na busca (${query}): ${err.message}`);
      return [];
    }
  }

  /**
   * Busca Unificada nos Home Centers
   */
  async searchAllStores(query: string): Promise<{
    query: string;
    total: number;
    stores: { carajas: number; acal: number; normatel: number };
    products: ExtractedProduct[];
  }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        query: "",
        total: 0,
        stores: { carajas: 0, acal: 0, normatel: 0 },
        products: [],
      };
    }

    this.logger.log(`🔍 Buscando nos Home Centers: "${cleanQuery}"`);

    const [carajas, acal, normatel] = await Promise.all([
      this.searchCarajas(cleanQuery),
      this.searchAcal(cleanQuery),
      this.searchNormatel(cleanQuery),
    ]);

    const all = [...carajas, ...acal, ...normatel];

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
        carajas: carajas.length,
        acal: acal.length,
        normatel: normatel.length,
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

        // Categorização inteligente
        let categoryId = defaultCategory.id;
        const lowerName = (item.name + " " + (item.categoryName || "")).toLowerCase();

        const orConditions: Prisma.CategoryWhereInput[] = [
          { name: { contains: lowerName.split(" ")[0], mode: "insensitive" } },
        ];

        if (lowerName.includes("tinta") || lowerName.includes("verniz") || lowerName.includes("esmalte sint")) {
          orConditions.push({ name: { contains: "Tinta", mode: "insensitive" } });
        }
        if (lowerName.includes("piso") || lowerName.includes("porcelanato") || lowerName.includes("revestimento")) {
          orConditions.push({ name: { contains: "Piso", mode: "insensitive" } });
        }
        if (lowerName.includes("cimento") || lowerName.includes("argamassa")) {
          orConditions.push({ name: { contains: "Cimento", mode: "insensitive" } });
        }
        if (lowerName.includes("tubo") || lowerName.includes("conexão") || lowerName.includes("tigre") || lowerName.includes("torneira")) {
          orConditions.push({ name: { contains: "Hidráulica", mode: "insensitive" } });
        }
        if (lowerName.includes("fio") || lowerName.includes("cabo") || lowerName.includes("disjuntor") || lowerName.includes("tomada")) {
          orConditions.push({ name: { contains: "Elétrica", mode: "insensitive" } });
        }

        const matchedCategory = await this.prisma.category.findFirst({
          where: {
            OR: orConditions,
          },
        });

        if (matchedCategory) {
          categoryId = matchedCategory.id;
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
