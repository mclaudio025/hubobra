import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { UploadService, UploadResult } from "../upload/upload.service";
import { PrismaService } from "../prisma/prisma.service";

export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface ImageSearchParams {
  query?: string;
  ean?: string;
  brand?: string;
  limit?: number;
}

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);

  // User-Agents para rotação
  private readonly userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/123.0.0.0 Safari/537.36",
  ];

  constructor(
    private configService: ConfigService,
    private uploadService: UploadService,
    private prisma: PrismaService,
  ) {}

  private getRandomUserAgent(): string {
    const idx = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[idx];
  }

  /**
   * Sanitiza a consulta de busca removendo caracteres de controle e termos indesejados
   */
  private sanitizeQuery(params: ImageSearchParams): string {
    if (params.query && params.query.trim()) {
      const cleanName = params.query
        .replace(/[*#_\\/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return cleanName;
    }

    if (params.ean && params.ean.trim().length >= 8) {
      return params.ean.trim();
    }

    if (params.brand && params.brand.trim()) {
      return params.brand.trim();
    }

    return "";
  }

  /**
   * Busca imagens utilizando múltiplos provedores em cascata
   */
  async searchImages(params: ImageSearchParams): Promise<ImageSearchResult[]> {
    const rawQuery = this.sanitizeQuery(params);
    if (!rawQuery) {
      throw new BadRequestException("Nenhum termo ou código de barras fornecido para busca");
    }

    const limit = Math.min(params.limit || 12, 30);
    this.logger.log(`Buscando imagens para o termo: "${rawQuery}" (limite: ${limit})`);

    // Lista de termos para tentar em cascata
    const queryAttempts: string[] = [rawQuery];

    // Se temos EAN e query, tentar ambos
    if (params.query && params.ean && params.ean.trim().length >= 8) {
      queryAttempts.push(params.ean.trim());
    }

    // Tentar versão simplificada (sem pesos/medidas finais como 17G, 50KG, 18L)
    const simplified = rawQuery.replace(/\b\d+\s*(g|kg|ml|l|m|cm|mm|un|pcs|pc)\b/gi, '').trim();
    if (simplified && simplified !== rawQuery) {
      queryAttempts.push(simplified);
    }

    // Provedor 1: Google Custom Search API (se configurado)
    const googleApiKey = this.configService.get<string>("GOOGLE_SEARCH_API_KEY");
    const googleCx = this.configService.get<string>("GOOGLE_SEARCH_CX") || this.configService.get<string>("GOOGLE_CSE_ID");

    for (const currentQuery of queryAttempts) {
      if (googleApiKey && googleCx) {
        try {
          const googleResults = await this.searchGoogleCustomSearch(currentQuery, googleApiKey, googleCx, limit);
          if (googleResults.length > 0) {
            this.logger.log(`Google CSE retornou ${googleResults.length} imagens para "${currentQuery}"`);
            return googleResults;
          }
        } catch (err: any) {
          this.logger.warn(`Falha na busca Google CSE: ${err.message}. Tentando próximo provedor...`);
        }
      }

      // Provedor 2: Serper API (se configurado)
      const serperApiKey = this.configService.get<string>("SERPER_API_KEY");
      if (serperApiKey) {
        try {
          const serperResults = await this.searchSerper(currentQuery, serperApiKey, limit);
          if (serperResults.length > 0) {
            this.logger.log(`Serper API retornou ${serperResults.length} imagens para "${currentQuery}"`);
            return serperResults;
          }
        } catch (err: any) {
          this.logger.warn(`Falha na busca Serper: ${err.message}. Tentando próximo provedor...`);
        }
      }

      // Provedor 3: Bing Images Engine
      try {
        const bingResults = await this.searchBingImages(currentQuery, limit);
        if (bingResults.length > 0) {
          this.logger.log(`Bing Images retornou ${bingResults.length} imagens para "${currentQuery}"`);
          return bingResults;
        }
      } catch (err: any) {
        this.logger.warn(`Falha no Bing Images para "${currentQuery}": ${err.message}`);
      }

      // Provedor 4: DuckDuckGo Web Engine
      try {
        const webResults = await this.searchWebEngine(currentQuery, limit);
        if (webResults.length > 0) {
          this.logger.log(`Web Engine retornou ${webResults.length} imagens para "${currentQuery}"`);
          return webResults;
        }
      } catch (err: any) {
        this.logger.warn(`Falha no Web Engine para "${currentQuery}": ${err.message}`);
      }
    }

    // 5. Fallback Garantido: Banco de Imagens Curado para Materiais de Construção
    const curated = this.getCuratedBuildingMaterialImage(rawQuery, params.brand);
    if (curated) {
      this.logger.log(`Banco Curado retornou imagem temática para "${rawQuery}"`);
      return [curated];
    }

    return [];
  }

  /**
   * Busca imagens no Bing Images
   */
  private async searchBingImages(query: string, limit: number): Promise<ImageSearchResult[]> {
    const userAgent = this.getRandomUserAgent();
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 10000,
    });

    const html = res.data;
    if (typeof html !== "string") return [];

    const results: ImageSearchResult[] = [];
    const seen = new Set<string>();

    // Regex para extrair murl (Media URL) do HTML do Bing
    const regex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/g;
    let match;

    while ((match = regex.exec(html)) !== null && results.length < limit) {
      const imgUrl = match[1];
      if (imgUrl && !seen.has(imgUrl)) {
        // Filtrar extensões indesejadas
        const lower = imgUrl.toLowerCase();
        if (!lower.includes(".svg") && !lower.includes("favicon") && !lower.includes("pixel")) {
          seen.add(imgUrl);
          results.push({
            url: imgUrl,
            title: query,
            thumbnailUrl: imgUrl,
            source: "Bing",
          });
        }
      }
    }

    return results;
  }

  /**
   * Banco Curado de Imagens em Alta Resolução para Materiais de Construção
   */
  private getCuratedBuildingMaterialImage(query: string, brand?: string): ImageSearchResult | null {
    const q = (query || '').toLowerCase();
    const b = (brand || '').toLowerCase();

    // Adesivos, Colas e Polytubes
    if (q.includes('adesivo') || q.includes('cola') || q.includes('polytubes') || q.includes('silicone') || q.includes('vedante') || q.includes('fita veda')) {
      return {
        url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
        title: 'Adesivo Plástico para Tubos e Conexões PVC',
        source: 'Catálogo Oficial'
      };
    }

    // Tubos, Conexões e Joelhos
    if (q.includes('joelho') || q.includes('curva') || q.includes('cotovelo') || q.includes('conexao') || q.includes('soldavel') || q.includes('soldável') || q.includes('tubo')) {
      return {
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
        title: 'Conexão Hidráulica PVC Tigre',
        source: 'Catálogo Oficial'
      };
    }

    // Cimento e Argamassa
    if (q.includes('cimento') || q.includes('portland') || q.includes('votoran') || q.includes('cp ii') || q.includes('cau') || q.includes('cal')) {
      return {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        title: 'Cimento Estrutural 50kg Votoran',
        source: 'Catálogo Oficial'
      };
    }

    // Tijolos e Blocos
    if (q.includes('tijolo') || q.includes('bloco') || q.includes('ceramico') || q.includes('cerâmico') || q.includes('alvenaria')) {
      return {
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',
        title: 'Tijolo Cerâmico de Construção',
        source: 'Catálogo Oficial'
      };
    }

    // Tintas e Vernizes
    if (q.includes('tinta') || q.includes('suvinil') || q.includes('coral') || q.includes('verniz') || q.includes('esmalte') || q.includes('latex')) {
      return {
        url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
        title: 'Tinta Acrílica Premium 18L',
        source: 'Catálogo Oficial'
      };
    }

    // Argamassas e Rejuntes
    if (q.includes('argamassa') || q.includes('quartzolit') || q.includes('rejunte') || q.includes('aciii') || q.includes('acii')) {
      return {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        title: 'Argamassa Colante ACIII Quartzolit',
        source: 'Catálogo Oficial'
      };
    }

    // Pisos e Revestimentos
    if (q.includes('piso') || q.includes('porcelanato') || q.includes('ceramica') || q.includes('cerâmica') || q.includes('revestimento')) {
      return {
        url: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&auto=format&fit=crop&q=80',
        title: 'Piso e Revestimento Cerâmico',
        source: 'Catálogo Oficial'
      };
    }

    // Elétrica e Fios
    if (q.includes('fio') || q.includes('cabo') || q.includes('eletric') || q.includes('disjuntor') || q.includes('tomada') || q.includes('interruptor')) {
      return {
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
        title: 'Material Elétrico e Condutores',
        source: 'Catálogo Oficial'
      };
    }

    // Ferramentas
    if (q.includes('ferramenta') || q.includes('furadeira') || q.includes('martelo') || q.includes('serra') || q.includes('chave')) {
      return {
        url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
        title: 'Ferramentas de Construção',
        source: 'Catálogo Oficial'
      };
    }

    // Telhas
    if (q.includes('telha') || q.includes('cobertura') || q.includes('cumeeira')) {
      return {
        url: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&auto=format&fit=crop&q=80',
        title: 'Telhas e Coberturas',
        source: 'Catálogo Oficial'
      };
    }

    return null;
  }

  /**
   * Busca imagens no Web Engine
   */
  private async searchWebEngine(query: string, limit: number): Promise<ImageSearchResult[]> {
    const userAgent = this.getRandomUserAgent();
    const instance = axios.create({
      headers: {
        "User-Agent": userAgent,
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 10000,
    });

    // 1. Obter VQD token
    const initialUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=images&iax=images&ia=images`;
    const res1 = await instance.get(initialUrl);
    const cookies = res1.headers["set-cookie"];

    const match = res1.data.match(/vqd="([^"]+)"/) || res1.data.match(/vqd=([\d-]+)/);
    if (!match) {
      this.logger.warn(`Não foi possível extrair token VQD para query: "${query}"`);
      return [];
    }

    const vqd = match[1];
    const cookieHeader = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";

    // 2. Buscar imagens JSON
    const searchUrl = `https://duckduckgo.com/i.js?l=br-pt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const res2 = await instance.get(searchUrl, {
      headers: {
        Cookie: cookieHeader,
        Referer: "https://duckduckgo.com/",
        Authority: "duckduckgo.com",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const items = res2.data?.results || [];
    const validResults: ImageSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const item of items) {
      if (!item.image || typeof item.image !== "string") continue;
      if (!item.image.startsWith("http://") && !item.image.startsWith("https://")) continue;

      // Ignorar extensões inválidas como SVGs ou GIFs pesados
      const lower = item.image.toLowerCase();
      if (lower.includes(".svg") || lower.includes("tracking") || lower.includes("pixel")) continue;

      if (seenUrls.has(item.image)) continue;
      seenUrls.add(item.image);

      validResults.push({
        url: item.image,
        title: item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, "") : query,
        thumbnailUrl: item.thumbnail || item.image,
        width: item.width,
        height: item.height,
        source: item.source || "Web",
      });

      if (validResults.length >= limit) break;
    }

    return validResults;
  }

  /**
   * Busca imagens usando a API Google Custom Search
   */
  private async searchGoogleCustomSearch(
    query: string,
    apiKey: string,
    cx: string,
    limit: number,
  ): Promise<ImageSearchResult[]> {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=${Math.min(limit, 10)}&gl=br&hl=pt`;
    const res = await axios.get(url, { timeout: 10000 });
    const items = res.data?.items || [];

    return items.map((item: any) => ({
      url: item.link,
      title: item.title,
      thumbnailUrl: item.image?.thumbnailLink || item.link,
      width: item.image?.width,
      height: item.image?.height,
      source: item.displayLink || "Google",
    }));
  }

  /**
   * Busca imagens usando a API Serper.dev
   */
  private async searchSerper(query: string, apiKey: string, limit: number): Promise<ImageSearchResult[]> {
    const res = await axios.post(
      "https://google.serper.dev/images",
      { q: query, gl: "br", hl: "pt-br", num: limit },
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    const items = res.data?.images || [];
    return items.map((item: any) => ({
      url: item.imageUrl,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl || item.imageUrl,
      width: item.imageWidth,
      height: item.imageHeight,
      source: item.source || "Google",
    }));
  }

  /**
   * Baixa uma imagem de uma URL externa, otimiza via Sharp e vincula ao produto (opcional)
   */
  async downloadAndSaveProductImage(
    imageUrl: string,
    options: {
      productId?: string;
      alt?: string;
      isMain?: boolean;
    } = {},
  ): Promise<{ uploadResult: UploadResult; productImage?: any }> {
    // 1. Realizar download e conversão para WebP / Upload para storage
    const uploadResult = await this.uploadService.uploadImageFromUrl(imageUrl, options.alt);

    let productImage = null;

    // 2. Se o productId foi informado, salvar na tabela ProductImage
    if (options.productId) {
      // Contar quantas imagens o produto já tem para definir o order
      const count = await this.prisma.productImage.count({
        where: { productId: options.productId },
      });

      productImage = await this.prisma.productImage.create({
        data: {
          productId: options.productId,
          url: uploadResult.url,
          alt: options.alt || "Imagem do produto",
          order: options.isMain ? 0 : count,
        },
      });
    }

    return { uploadResult, productImage };
  }

  /**
   * Varredura em lote: busca e adiciona fotos automaticamente para produtos sem imagem
   */
  async bulkFetchImagesForMissing(options: {
    limit?: number;
    forceUpdate?: boolean;
  } = {}): Promise<{
    totalProcessed: number;
    success: number;
    failed: number;
    details: Array<{ productId: string; name: string; status: "success" | "not_found" | "error"; imageUrl?: string; message?: string }>;
  }> {
    const limit = Math.min(options.limit || 50, 200);

    // Buscar produtos com 0 imagens
    const productsWithoutImages = await this.prisma.product.findMany({
      where: options.forceUpdate
        ? {}
        : {
            images: {
              none: {},
            },
          },
      take: limit,
      include: {
        images: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    this.logger.log(`Iniciando preenchimento em lote para ${productsWithoutImages.length} produtos sem foto`);

    const details: Array<{
      productId: string;
      name: string;
      status: "success" | "not_found" | "error";
      imageUrl?: string;
      message?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const product of productsWithoutImages) {
      // Se forceUpdate for falso e o produto já tiver imagem, pular
      if (!options.forceUpdate && product.images && product.images.length > 0) {
        continue;
      }

      try {
        // Pausa de 600ms entre requisições para evitar bloqueios de taxa
        await new Promise((resolve) => setTimeout(resolve, 600));

        const searchResults = await this.searchImages({
          query: product.name,
          ean: product.barcode || undefined,
          brand: product.brand || undefined,
          limit: 3,
        });

        if (searchResults.length === 0) {
          details.push({
            productId: product.id,
            name: product.name,
            status: "not_found",
            message: "Nenhuma imagem encontrada na busca",
          });
          failedCount++;
          continue;
        }

        // Selecionar a primeira imagem relevante
        const topImage = searchResults[0];

        const { uploadResult, productImage } = await this.downloadAndSaveProductImage(topImage.url, {
          productId: product.id,
          alt: product.name,
          isMain: true,
        });

        details.push({
          productId: product.id,
          name: product.name,
          status: "success",
          imageUrl: uploadResult.url,
        });
        successCount++;
      } catch (err: any) {
        this.logger.error(`Erro ao processar imagem para o produto "${product.name}" (${product.id}): ${err.message}`);
        details.push({
          productId: product.id,
          name: product.name,
          status: "error",
          message: err.message,
        });
        failedCount++;
      }
    }

    return {
      totalProcessed: productsWithoutImages.length,
      success: successCount,
      failed: failedCount,
      details,
    };
  }
}
