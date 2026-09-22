import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface HomeSection {
  id: string;
  type: "product_carousel" | "banner" | "department_shortcuts" | "hero" | "partner_bar";
  title?: string;
  subtitle?: string;
  titleColor?: string;
  enabled: boolean;
  order: number;
  productSource?: "category" | "manual" | "discount" | "featured" | "bestsellers" | "newest";
  categorySlug?: string;
  categoryName?: string;
  manualProductIds?: string[];
  minDiscountPercent?: number;
  limit?: number;
  bannerImageUrl?: string;
  bannerLinkUrl?: string;
  bannerAlt?: string;
  bannerHeight?: "compact" | "medium" | "full";
  products?: any[];
}

const DEFAULT_ACAL_SECTIONS: HomeSection[] = [
  {
    id: "hero-main",
    type: "hero",
    title: "Hero Principal",
    enabled: true,
    order: 1,
  },
  {
    id: "partner-network-bar",
    type: "partner_bar",
    title: "Rede de Lojas Parceiras & CEP",
    enabled: true,
    order: 2,
  },
  {
    id: "promo-banners-top",
    type: "banner",
    title: "Semana da Construção & Reforma - Até 20% OFF",
    bannerImageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80",
    bannerLinkUrl: "/produtos",
    bannerAlt: "Semana da Construção - Cimento, Argamassas e Estrutural",
    enabled: true,
    order: 3,
  },
  {
    id: "dept-shortcuts",
    type: "department_shortcuts",
    title: "Atalhos de Departamentos",
    enabled: true,
    order: 4,
  },
  {
    id: "section-ofertas-tempo-limitado",
    type: "product_carousel",
    title: "Ofertas Por Tempo Limitado!",
    titleColor: "#009de0",
    productSource: "discount",
    minDiscountPercent: 10,
    limit: 12,
    enabled: true,
    order: 5,
  },
  {
    id: "section-tintas-oferta",
    type: "product_carousel",
    title: "Tintas em Oferta",
    titleColor: "#009de0",
    productSource: "category",
    categorySlug: "tintas-e-vernizes",
    categoryName: "Tintas e Vernizes",
    limit: 12,
    enabled: true,
    order: 6,
  },
  {
    id: "banner-seguranca-meio",
    type: "banner",
    title: "Ferramentas & Elétrica Profissional - Descontos Exclusivos",
    bannerImageUrl: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=1200&auto=format&fit=crop&q=80",
    bannerLinkUrl: "/produtos",
    bannerAlt: "Linha de Ferramentas Elétricas, Iluminação e Segurança",
    enabled: true,
    order: 7,
  },
  {
    id: "section-mais-vendidos",
    type: "product_carousel",
    title: "Mais vendidos",
    titleColor: "#009de0",
    productSource: "bestsellers",
    limit: 12,
    enabled: true,
    order: 8,
  },
  {
    id: "section-ofertas-exclusivas",
    type: "product_carousel",
    title: "Ofertas Exclusivas",
    titleColor: "#009de0",
    productSource: "featured",
    limit: 12,
    enabled: true,
    order: 9,
  },
];

const SETTING_KEY = "home_sections_config";

@Injectable()
export class ComponentsService {
  private readonly logger = new Logger(ComponentsService.name);
  private memoryCache: HomeSection[] = DEFAULT_ACAL_SECTIONS;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém a lista bruta de seções configuradas (para o painel Admin)
   */
  async getAdminSections(): Promise<HomeSection[]> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: SETTING_KEY },
      });

      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryCache = parsed;
          return parsed.sort((a, b) => a.order - b.order);
        }
      }

      // Se não existir no banco, inicializa com o padrão
      await this.saveSections(DEFAULT_ACAL_SECTIONS);
      return DEFAULT_ACAL_SECTIONS;
    } catch (error) {
      this.logger.warn(`Erro ao ler seções do banco, usando cache: ${error.message}`);
      return this.memoryCache.sort((a, b) => a.order - b.order);
    }
  }

  /**
   * Obtém as seções ativas com os produtos pré-resolvidos para a Home Page
   */
  async getPublicSections(): Promise<HomeSection[]> {
    const rawSections = await this.getAdminSections();
    const enabledSections = rawSections
      .filter((s) => s.enabled)
      .sort((a, b) => a.order - b.order);

    // Resolver produtos para cada carrossel em paralelo
    const enrichedSections = await Promise.all(
      enabledSections.map(async (section) => {
        if (section.type === "product_carousel") {
          const products = await this.resolveProductsForSection(section);
          return {
            ...section,
            products,
          };
        }
        return section;
      })
    );

    return enrichedSections;
  }

  /**
   * Salva a lista completa e ordem das seções
   */
  async saveSections(sections: HomeSection[]): Promise<HomeSection[]> {
    const ordered = sections.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    this.memoryCache = ordered;

    try {
      await this.prisma.setting.upsert({
        where: { key: SETTING_KEY },
        update: {
          value: JSON.stringify(ordered),
          updatedAt: new Date(),
        },
        create: {
          key: SETTING_KEY,
          value: JSON.stringify(ordered),
          type: "JSON",
          category: "HOME_LAYOUT",
          label: "Configuração de Camadas da Home",
          description: "Estrutura de seções, vitrines e banners da página principal",
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao salvar seções no banco: ${error.message}`);
    }

    return ordered;
  }

  /**
   * Adiciona uma nova seção
   */
  async addSection(sectionData: Partial<HomeSection>): Promise<HomeSection[]> {
    const current = await this.getAdminSections();
    const newSection: HomeSection = {
      id: sectionData.id || `section-${Date.now()}`,
      type: sectionData.type || "product_carousel",
      title: sectionData.title || "Nova Vitrine",
      titleColor: sectionData.titleColor || "#009de0",
      enabled: sectionData.enabled ?? true,
      order: current.length + 1,
      productSource: sectionData.productSource || "featured",
      categorySlug: sectionData.categorySlug,
      categoryName: sectionData.categoryName,
      manualProductIds: sectionData.manualProductIds || [],
      minDiscountPercent: sectionData.minDiscountPercent || 0,
      limit: sectionData.limit || 12,
      bannerImageUrl: sectionData.bannerImageUrl,
      bannerLinkUrl: sectionData.bannerLinkUrl,
      bannerAlt: sectionData.bannerAlt,
      bannerHeight: sectionData.bannerHeight || "medium",
    };

    current.push(newSection);
    return this.saveSections(current);
  }

  /**
   * Atualiza uma seção existente
   */
  async updateSection(id: string, updateData: Partial<HomeSection>): Promise<HomeSection[]> {
    const current = await this.getAdminSections();
    const index = current.findIndex((s) => s.id === id);

    if (index !== -1) {
      current[index] = {
        ...current[index],
        ...updateData,
        id, // preserva ID
      };
      return this.saveSections(current);
    }

    return current;
  }

  /**
   * Remove uma seção
   */
  async deleteSection(id: string): Promise<HomeSection[]> {
    const current = await this.getAdminSections();
    const filtered = current.filter((s) => s.id !== id);
    return this.saveSections(filtered);
  }

  /**
   * Restaura o layout padrão inspirado na Acal
   */
  async resetDefault(): Promise<HomeSection[]> {
    return this.saveSections(DEFAULT_ACAL_SECTIONS);
  }

  /**
   * Resolve e busca os produtos correspondentes à regra da seção
   */
  private async resolveProductsForSection(section: HomeSection): Promise<any[]> {
    const limit = section.limit || 12;

    try {
      // 1. Seleção Manual
      if (
        section.productSource === "manual" &&
        Array.isArray(section.manualProductIds) &&
        section.manualProductIds.length > 0
      ) {
        const products = await this.prisma.product.findMany({
          where: {
            id: { in: section.manualProductIds },
            active: true,
          },
          include: {
            images: { select: { url: true, alt: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: limit,
        });

        if (products.length > 0) return products;
      }

      // 2. Por Categoria
      if (section.productSource === "category" && section.categorySlug) {
        const category = await this.prisma.category.findUnique({
          where: { slug: section.categorySlug },
        });

        if (category) {
          const products = await this.prisma.product.findMany({
            where: {
              categoryId: category.id,
              active: true,
            },
            include: {
              images: { select: { url: true, alt: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          });

          if (products.length > 0) return products;
        }
      }

      // 3. Por Regra de Desconto
      if (section.productSource === "discount") {
        const products = await this.prisma.product.findMany({
          where: {
            active: true,
            comparePrice: { gt: 0 },
          },
          include: {
            images: { select: { url: true, alt: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: limit,
          orderBy: { updatedAt: "desc" },
        });

        if (products.length > 0) return products;
      }

      // 4. Mais Vendidos
      if (section.productSource === "bestsellers") {
        const products = await this.prisma.product.findMany({
          where: { active: true },
          include: {
            images: { select: { url: true, alt: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          take: limit,
          orderBy: [{ saleCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
        });

        if (products.length > 0) return products;
      }

      // 5. Destaques / Padrão
      const products = await this.prisma.product.findMany({
        where: { active: true },
        include: {
          images: { select: { url: true, alt: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        take: limit,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });

      return products;
    } catch (error) {
      this.logger.error(
        `Erro ao resolver produtos para a seção "${section.title}": ${error.message}`
      );
      return [];
    }
  }
}
