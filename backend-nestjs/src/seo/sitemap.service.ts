import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

export interface SitemapIndex {
  loc: string;
  lastmod?: string;
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);

  constructor(
    private prisma: PrismaService,
    private customLogger: CustomLoggerService,
  ) {}

  // Gerar sitemap principal
  async generateMainSitemap(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
      const urls: SitemapUrl[] = [];

      // Homepage
      urls.push({
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      });

      // Páginas estáticas importantes
      const staticPages = [
        { path: "/sobre", priority: 0.8, changefreq: "monthly" as const },
        { path: "/contato", priority: 0.8, changefreq: "monthly" as const },
        {
          path: "/politica-privacidade",
          priority: 0.5,
          changefreq: "yearly" as const,
        },
        { path: "/termos-uso", priority: 0.5, changefreq: "yearly" as const },
        { path: "/faq", priority: 0.7, changefreq: "monthly" as const },
        { path: "/calculadora", priority: 0.9, changefreq: "weekly" as const },
      ];

      staticPages.forEach((page) => {
        urls.push({
          loc: `${baseUrl}${page.path}`,
          lastmod: new Date().toISOString(),
          changefreq: page.changefreq,
          priority: page.priority,
        });
      });

      // Categorias
      const categories = await this.prisma.category.findMany({
        where: { active: true },
        select: {
          slug: true,
          updatedAt: true,
        },
      });

      categories.forEach((category) => {
        urls.push({
          loc: `${baseUrl}/categoria/${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.8,
        });
      });

      return this.generateSitemapXml(urls);
    } catch (error) {
      this.logger.error("Erro ao gerar sitemap principal:", error);
      throw error;
    }
  }

  // Gerar sitemap de produtos
  async generateProductsSitemap(
    page: number = 1,
    limit: number = 1000,
  ): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
      const offset = (page - 1) * limit;

      const products = await this.prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          images: {
            select: {
              url: true,
              alt: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      const urls: SitemapUrl[] = products.map((product) => ({
        loc: `${baseUrl}/produtos/${product.id}`,
        lastmod: product.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: 0.7,
        images: product.images.map((image) => ({
          loc: image.url,
          title: image.alt || product.name,
          caption: `${product.name} - Loja Moderna`,
        })),
      }));

      return this.generateSitemapXml(urls);
    } catch (error) {
      this.logger.error("Erro ao gerar sitemap de produtos:", error);
      throw error;
    }
  }

  // Gerar sitemap de imagens
  async generateImagesSitemap(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";

      const products = await this.prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          images: {
            select: {
              url: true,
              alt: true,
            },
          },
        },
      });

      const urls: SitemapUrl[] = [];

      products.forEach((product) => {
        if (product.images.length > 0) {
          urls.push({
            loc: `${baseUrl}/produtos/${product.id}`,
            images: product.images.map((image) => ({
              loc: image.url,
              title: image.alt || product.name,
              caption: `${product.name} - Material de construção na Loja Moderna`,
            })),
          });
        }
      });

      return this.generateImageSitemapXml(urls);
    } catch (error) {
      this.logger.error("Erro ao gerar sitemap de imagens:", error);
      throw error;
    }
  }

  // Gerar índice de sitemaps
  async generateSitemapIndex(): Promise<string> {
    try {
      const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";
      const sitemaps: SitemapIndex[] = [];

      // Sitemap principal
      sitemaps.push({
        loc: `${baseUrl}/sitemap.xml`,
        lastmod: new Date().toISOString(),
      });

      // Calcular quantos sitemaps de produtos são necessários
      const totalProducts = await this.prisma.product.count({
        where: { active: true },
      });

      const productsPerSitemap = 1000;
      const productSitemapCount = Math.ceil(totalProducts / productsPerSitemap);

      for (let i = 1; i <= productSitemapCount; i++) {
        sitemaps.push({
          loc: `${baseUrl}/sitemap-products-${i}.xml`,
          lastmod: new Date().toISOString(),
        });
      }

      // Sitemap de imagens
      sitemaps.push({
        loc: `${baseUrl}/sitemap-images.xml`,
        lastmod: new Date().toISOString(),
      });

      return this.generateSitemapIndexXml(sitemaps);
    } catch (error) {
      this.logger.error("Erro ao gerar índice de sitemaps:", error);
      throw error;
    }
  }

  // Gerar robots.txt
  generateRobotsTxt(): string {
    const baseUrl = process.env.FRONTEND_URL || "https://lojamoderna.com";

    return `User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /carrinho/
Disallow: /pedidos/

# Allow important pages
Allow: /produtos/
Allow: /categoria/
Allow: /busca/
Allow: /calculadora/

# Sitemap
Sitemap: ${baseUrl}/sitemap-index.xml

# Crawl delay
Crawl-delay: 1

# Specific rules for different bots
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /
`;
  }

  // Gerar XML do sitemap
  private generateSitemapXml(urls: SitemapUrl[]): string {
    const urlElements = urls
      .map((url) => {
        let urlXml = `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>`;

        if (url.lastmod) {
          urlXml += `\n    <lastmod>${url.lastmod}</lastmod>`;
        }

        if (url.changefreq) {
          urlXml += `\n    <changefreq>${url.changefreq}</changefreq>`;
        }

        if (url.priority !== undefined) {
          urlXml += `\n    <priority>${url.priority}</priority>`;
        }

        if (url.images && url.images.length > 0) {
          url.images.forEach((image) => {
            urlXml += `\n    <image:image>
      <image:loc>${this.escapeXml(image.loc)}</image:loc>`;

            if (image.title) {
              urlXml += `\n      <image:title>${this.escapeXml(image.title)}</image:title>`;
            }

            if (image.caption) {
              urlXml += `\n      <image:caption>${this.escapeXml(image.caption)}</image:caption>`;
            }

            urlXml += `\n    </image:image>`;
          });
        }

        urlXml += `\n  </url>`;
        return urlXml;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
  }

  // Gerar XML do sitemap de imagens
  private generateImageSitemapXml(urls: SitemapUrl[]): string {
    return this.generateSitemapXml(urls);
  }

  // Gerar XML do índice de sitemaps
  private generateSitemapIndexXml(sitemaps: SitemapIndex[]): string {
    const sitemapElements = sitemaps
      .map((sitemap) => {
        let sitemapXml = `  <sitemap>
    <loc>${this.escapeXml(sitemap.loc)}</loc>`;

        if (sitemap.lastmod) {
          sitemapXml += `\n    <lastmod>${sitemap.lastmod}</lastmod>`;
        }

        sitemapXml += `\n  </sitemap>`;
        return sitemapXml;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  // Escapar caracteres especiais para XML
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Obter estatísticas do sitemap
  async getSitemapStats(): Promise<{
    totalUrls: number;
    lastGenerated: Date;
    categories: number;
    products: number;
    images: number;
  }> {
    try {
      const [categoriesCount, productsCount, imagesCount] = await Promise.all([
        this.prisma.category.count({ where: { active: true } }),
        this.prisma.product.count({ where: { active: true } }),
        this.prisma.productImage.count(),
      ]);

      const staticPages = 6; // Homepage + páginas estáticas

      return {
        totalUrls: staticPages + categoriesCount + productsCount,
        lastGenerated: new Date(),
        categories: categoriesCount,
        products: productsCount,
        images: imagesCount,
      };
    } catch (error) {
      this.logger.error("Erro ao obter estatísticas do sitemap:", error);
      return {
        totalUrls: 0,
        lastGenerated: new Date(),
        categories: 0,
        products: 0,
        images: 0,
      };
    }
  }

  // Validar URLs do sitemap
  async validateSitemapUrls(): Promise<{
    validUrls: number;
    invalidUrls: number;
    errors: string[];
  }> {
    // Implementar validação de URLs (verificar se respondem 200)
    // Por enquanto, retornar dados mock
    return {
      validUrls: 0,
      invalidUrls: 0,
      errors: [],
    };
  }
}
