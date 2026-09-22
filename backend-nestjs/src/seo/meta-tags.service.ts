import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}

export interface SeoPage {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  metaTags: MetaTags;
  lastModified: Date;
  priority: number;
  changeFreq:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
}

@Injectable()
export class MetaTagsService {
  private readonly logger = new Logger(MetaTagsService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  // Gerar meta tags para páginas de produto
  async generateProductMetaTags(productId: string): Promise<MetaTags> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          images: true,
        },
      });

      if (!product) {
        return this.getDefaultMetaTags();
      }

      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
      const productUrl = `${baseUrl}/produtos/${productId}`;
      const mainImage =
        product.images[0]?.url || `${baseUrl}/images/default-product.jpg`;

      // Gerar keywords baseadas no produto
      const keywords = [
        product.name.toLowerCase(),
        product.category?.name.toLowerCase(),
        product.brand?.toLowerCase(),
        "material de construção",
        "loja de materiais",
        "construção",
        "reforma",
      ].filter(Boolean);

      // Descrição otimizada para SEO
      const description = product.description
        ? `${product.description.substring(0, 150)}... Compre ${product.name} na Loja Moderna com o melhor preço e entrega rápida.`
        : `${product.name} - R$ ${product.price.toFixed(2)} na Loja Moderna. Material de construção de qualidade com entrega rápida.`;

      // Structured Data para produto
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
          product.description ||
          `${product.name} - Material de construção de qualidade`,
        image: mainImage,
        brand: {
          "@type": "Brand",
          name: product.brand || "Loja Moderna",
        },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "BRL",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "Loja Moderna",
          },
        },
        category: product.category?.name,
        sku: product.sku,
      };

      return {
        title: `${product.name} - R$ ${product.price.toFixed(2)} | Loja Moderna`,
        description,
        keywords,
        ogTitle: `${product.name} - Loja Moderna`,
        ogDescription: description,
        ogImage: mainImage,
        ogUrl: productUrl,
        twitterCard: "summary_large_image",
        twitterTitle: `${product.name} - R$ ${product.price.toFixed(2)}`,
        twitterDescription: description,
        twitterImage: mainImage,
        canonical: productUrl,
        robots: "index, follow",
        structuredData,
      };
    } catch (error) {
      this.logger.error("Erro ao gerar meta tags do produto:", error);
      return this.getDefaultMetaTags();
    }
  }

  // Gerar meta tags para páginas de categoria
  async generateCategoryMetaTags(categorySlug: string): Promise<MetaTags> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          products: {
            take: 10,
            where: { active: true },
            include: { images: true },
          },
        },
      });

      if (!category) {
        return this.getDefaultMetaTags();
      }

      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
      const categoryUrl = `${baseUrl}/categoria/${categorySlug}`;
      const categoryImage =
        category.image || `${baseUrl}/images/default-category.jpg`;

      const keywords = [
        category.name.toLowerCase(),
        "material de construção",
        "loja de materiais",
        "construção",
        "reforma",
        ...category.products.map((p) => p.name.toLowerCase()).slice(0, 5),
      ];

      const description = category.description
        ? `${category.description.substring(0, 150)}... Encontre os melhores produtos de ${category.name} na Loja Moderna.`
        : `${category.name} - Materiais de construção de qualidade na Loja Moderna. ${category.products.length} produtos disponíveis com entrega rápida.`;

      // Structured Data para categoria
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: category.name,
        description: category.description || `Categoria ${category.name}`,
        url: categoryUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: category.products.length,
          itemListElement: category.products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: product.name,
              url: `${baseUrl}/produtos/${product.id}`,
              image: product.images[0]?.url,
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "BRL",
              },
            },
          })),
        },
      };

      return {
        title: `${category.name} - Materiais de Construção | Loja Moderna`,
        description,
        keywords,
        ogTitle: `${category.name} - Loja Moderna`,
        ogDescription: description,
        ogImage: categoryImage,
        ogUrl: categoryUrl,
        twitterCard: "summary_large_image",
        twitterTitle: `${category.name} - Materiais de Construção`,
        twitterDescription: description,
        twitterImage: categoryImage,
        canonical: categoryUrl,
        robots: "index, follow",
        structuredData,
      };
    } catch (error) {
      this.logger.error("Erro ao gerar meta tags da categoria:", error);
      return this.getDefaultMetaTags();
    }
  }

  // Gerar meta tags para página de busca
  generateSearchMetaTags(query: string, resultsCount: number): MetaTags {
    const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
    const searchUrl = `${baseUrl}/busca?q=${encodeURIComponent(query)}`;

    const title = `Busca por "${query}" - ${resultsCount} resultados | Loja Moderna`;
    const description = `Encontre ${query} na Loja Moderna. ${resultsCount} produtos encontrados com os melhores preços e entrega rápida.`;

    return {
      title,
      description,
      keywords: [
        query.toLowerCase(),
        "busca",
        "material de construção",
        "loja de materiais",
      ],
      ogTitle: title,
      ogDescription: description,
      ogUrl: searchUrl,
      canonical: searchUrl,
      robots: resultsCount > 0 ? "index, follow" : "noindex, follow",
    };
  }

  // Gerar meta tags para homepage
  getHomepageMetaTags(): MetaTags {
    const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Loja Moderna",
      url: baseUrl,
      logo: `${baseUrl}/images/logo.png`,
      description:
        "Loja de materiais de construção com os melhores preços e entrega rápida",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rua das Flores, 123",
        addressLocality: "São Paulo",
        addressRegion: "SP",
        postalCode: "01234-567",
        addressCountry: "BR",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+55-11-99999-9999",
        contactType: "customer service",
      },
      sameAs: [
        "https://facebook.com/lojamoderna",
        "https://instagram.com/lojamoderna",
        "https://twitter.com/lojamoderna",
      ],
    };

    return {
      title: "Loja Moderna - Materiais de Construção com os Melhores Preços",
      description:
        "Materiais de construção de qualidade com os melhores preços e entrega rápida. Cimento, tijolo, tinta, ferramentas e muito mais. Compre online!",
      keywords: [
        "material de construção",
        "loja de materiais",
        "cimento",
        "tijolo",
        "tinta",
        "ferramentas",
        "construção",
        "reforma",
        "entrega rápida",
        "melhor preço",
      ],
      ogTitle: "Loja Moderna - Materiais de Construção",
      ogDescription:
        "Materiais de construção de qualidade com os melhores preços e entrega rápida.",
      ogImage: `${baseUrl}/images/og-homepage.jpg`,
      ogUrl: baseUrl,
      twitterCard: "summary_large_image",
      twitterTitle: "Loja Moderna - Materiais de Construção",
      twitterDescription:
        "Materiais de construção de qualidade com os melhores preços.",
      twitterImage: `${baseUrl}/images/twitter-homepage.jpg`,
      canonical: baseUrl,
      robots: "index, follow",
      structuredData,
    };
  }

  // Meta tags padrão para páginas sem conteúdo específico
  getDefaultMetaTags(): MetaTags {
    const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";

    return {
      title: "Loja Moderna - Materiais de Construção",
      description:
        "Materiais de construção de qualidade com os melhores preços e entrega rápida.",
      keywords: [
        "material de construção",
        "loja de materiais",
        "construção",
        "reforma",
      ],
      ogTitle: "Loja Moderna",
      ogDescription: "Materiais de construção de qualidade.",
      ogImage: `${baseUrl}/images/og-default.jpg`,
      ogUrl: baseUrl,
      canonical: baseUrl,
      robots: "index, follow",
    };
  }

  // Gerar meta tags para páginas de blog/conteúdo (futuro)
  generateContentMetaTags(contentId: string): Promise<MetaTags> {
    // Implementar quando houver sistema de blog/conteúdo
    return Promise.resolve(this.getDefaultMetaTags());
  }

  // Validar e otimizar meta tags
  validateMetaTags(metaTags: MetaTags): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar título
    if (metaTags.title.length > 60) {
      warnings.push("Título muito longo (>60 caracteres)");
    }
    if (metaTags.title.length < 30) {
      warnings.push("Título muito curto (<30 caracteres)");
    }

    // Validar descrição
    if (metaTags.description.length > 160) {
      warnings.push("Descrição muito longa (>160 caracteres)");
    }
    if (metaTags.description.length < 120) {
      warnings.push("Descrição muito curta (<120 caracteres)");
    }

    // Validar keywords
    if (metaTags.keywords.length > 10) {
      suggestions.push("Considere reduzir o número de keywords (<10)");
    }

    // Validar Open Graph
    if (!metaTags.ogImage) {
      suggestions.push("Adicione uma imagem Open Graph");
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }

  // Gerar meta tags para páginas dinâmicas
  async generateDynamicMetaTags(
    pageType: "product" | "category" | "search" | "homepage" | "content",
    identifier?: string,
    additionalData?: Record<string, any>,
  ): Promise<MetaTags> {
    switch (pageType) {
      case "product":
        return identifier
          ? this.generateProductMetaTags(identifier)
          : this.getDefaultMetaTags();

      case "category":
        return identifier
          ? this.generateCategoryMetaTags(identifier)
          : this.getDefaultMetaTags();

      case "search":
        return identifier && additionalData?.resultsCount !== undefined
          ? this.generateSearchMetaTags(identifier, additionalData.resultsCount)
          : this.getDefaultMetaTags();

      case "homepage":
        return this.getHomepageMetaTags();

      case "content":
        return identifier
          ? this.generateContentMetaTags(identifier)
          : this.getDefaultMetaTags();

      default:
        return this.getDefaultMetaTags();
    }
  }
}
