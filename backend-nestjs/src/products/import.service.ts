import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Readable } from "stream";
import * as csv from "csv-parser";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import { ImageSearchService } from "./image-search.service";

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string; data: any }>;
  warnings: Array<{ row: number; message: string; data: any }>;
  message: string;
}

export interface ImportedProduct {
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  specifications?: string;
  stock?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  images?: string;
  tags?: string;
  active?: boolean;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private prisma: PrismaService,
    private imageSearchService: ImageSearchService,
  ) {}

  async importProducts(
    file: Express.Multer.File,
    options: {
      updateExisting?: boolean;
      createCategories?: boolean;
      skipErrors?: boolean;
      batchSize?: number;
      autoFetchImages?: boolean;
    } = {},
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException("Nenhum arquivo enviado");
    }

    const defaultOptions = {
      updateExisting: true,
      createCategories: true,
      skipErrors: true,
      batchSize: 100,
      autoFetchImages: false,
      ...options,
    };

    let data: ImportedProduct[] = [];

    try {
      // Determinar tipo de arquivo e processar
      if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
        data = await this.parseCSV(file);
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.originalname.endsWith(".xlsx") ||
        file.originalname.endsWith(".xls")
      ) {
        data = await this.parseExcel(file);
      } else {
        throw new BadRequestException(
          "Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)",
        );
      }

      // Processar e validar dados
      return await this.processImportData(data, defaultOptions);
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao processar arquivo: ${error.message}`,
      );
    }
  }

  /**
   * Normaliza o nome da coluna para mapear sinônimos comuns de ERP
   */
  private normalizeHeader(header: string): string {
    const clean = header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, "");

    if (["sku", "codigo", "cod", "referencia", "ref", "codigointerno"].includes(clean)) return "sku";
    if (["barcode", "codigobarras", "codigodebarras", "ean", "ean13", "gtin"].includes(clean)) return "barcode";
    if (["name", "nome", "descricao", "desc", "produto", "descricaodoproduto", "titulodoproduto"].includes(clean)) return "name";
    if (["price", "preco", "valor", "precovenda", "unitario"].includes(clean)) return "price";
    if (["category", "categoria", "departamento", "secao", "grupo"].includes(clean)) return "category";
    if (["brand", "marca", "fabricante"].includes(clean)) return "brand";
    if (["stock", "estoque", "qtd", "quantidade", "saldo"].includes(clean)) return "stock";
    if (["images", "imagens", "foto", "fotos", "urlimagem"].includes(clean)) return "images";
    if (["active", "ativo", "status"].includes(clean)) return "active";

    return clean;
  }

  private async parseCSV(
    file: Express.Multer.File,
  ): Promise<ImportedProduct[]> {
    return new Promise((resolve, reject) => {
      const results: ImportedProduct[] = [];
      const stream = Readable.from(file.buffer.toString("utf-8"));

      stream
        .pipe(
          csv({
            mapHeaders: ({ header }) => this.normalizeHeader(header),
          }),
        )
        .on("data", (data) => {
          const rawName = (data.name || data.descricao || data.produto)?.toString().trim() || "";
          const rawBrand = (data.brand || data.marca)?.toString().trim() || this.extractBrandFromName(rawName);

          const cleanData: ImportedProduct = {
            name: rawName.replace(/[*#]/g, "").trim(),
            price: this.parseNumber(data.price || data.preco || data.valor),
            category: (data.category || data.categoria)?.toString().trim() || this.inferCategoryFromName(rawName),
            subcategory: (data.subcategory || data.subcategoria)?.toString().trim(),
            brand: rawBrand,
            description: (data.description || data.descricao)?.toString().trim() || rawName,
            specifications: (data.specifications || data.especificacoes)?.toString().trim(),
            stock: this.parseNumber(data.stock || data.estoque || data.qtd, 0),
            sku: (data.sku || data.codigo)?.toString().trim(),
            barcode: (data.barcode || data.codigobarras || data.ean)?.toString().trim(),
            weight: this.parseNumber(data.weight || data.peso),
            dimensions: (data.dimensions || data.dimensoes)?.toString().trim(),
            images: (data.images || data.imagens)?.toString().trim(),
            tags: data.tags?.toString().trim(),
            active: this.parseBoolean(data.active || data.status, true),
          };

          if (cleanData.name || cleanData.sku) {
            results.push(cleanData);
          }
        })
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });
  }

  private async parseExcel(
    file: Express.Multer.File,
  ): Promise<ImportedProduct[]> {
    try {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      return rows
        .map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header) {
              const normHeader = this.normalizeHeader(header.toString());
              obj[normHeader] = row[index];
            }
          });

          const rawName = (obj.name || obj.descricao || obj.produto)?.toString().trim() || "";
          const rawBrand = (obj.brand || obj.marca)?.toString().trim() || this.extractBrandFromName(rawName);

          return {
            name: rawName.replace(/[*#]/g, "").trim(),
            price: this.parseNumber(obj.price || obj.preco || obj.valor),
            category: (obj.category || obj.categoria)?.toString().trim() || this.inferCategoryFromName(rawName),
            subcategory: (obj.subcategory || obj.subcategoria)?.toString().trim(),
            brand: rawBrand,
            description: (obj.description || obj.descricao)?.toString().trim() || rawName,
            specifications: (obj.specifications || obj.especificacoes)?.toString().trim(),
            stock: this.parseNumber(obj.stock || obj.estoque || obj.qtd, 0),
            sku: (obj.sku || obj.codigo)?.toString().trim(),
            barcode: (obj.barcode || obj.codigobarras || obj.ean)?.toString().trim(),
            weight: this.parseNumber(obj.weight || obj.peso),
            dimensions: (obj.dimensions || obj.dimensoes)?.toString().trim(),
            images: (obj.images || obj.imagens)?.toString().trim(),
            tags: obj.tags?.toString().trim(),
            active: this.parseBoolean(obj.active || obj.status, true),
          };
        })
        .filter((p) => p.name || p.sku);
    } catch (error: any) {
      throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
    }
  }

  private extractBrandFromName(name: string): string {
    const upper = name.toUpperCase();
    const commonBrands = [
      "TRAMONTINA", "TIGRE", "AMMANCO", "AMANCO", "ROMAZI", "PIAL", "LEGRAND",
      "DECA", "CORONA", "LORENZETTI", "VOTORAN", "QUARTZOLIT", "SUVINIL",
      "CORAL", "BOSCH", "MAKITA", "DEWALT", "STELLA", "TASCHIBRA", "SOPRANO",
      "FORTLEV", "SIEMENS", "SCHNEIDER", "KRONA", "PLASBIL", "ARGAMASSA"
    ];
    for (const brand of commonBrands) {
      if (upper.includes(brand)) {
        return brand;
      }
    }
    return "";
  }

  private inferCategoryFromName(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes("PLACA") || upper.includes("INTERRUPTOR") || upper.includes("TOMADA") || upper.includes("FIO") || upper.includes("CABO") || upper.includes("DISJUNTOR") || upper.includes("LAMPADA") || upper.includes("LED")) {
      return "Materiais Elétricos";
    }
    if (upper.includes("TUBO") || upper.includes("CONEXAO") || upper.includes("JOELHO") || upper.includes("CURVA") || upper.includes("REGISTRO") || upper.includes("VALVULA") || upper.includes("TORNEIRA") || upper.includes("SIFAO")) {
      return "Hidráulica";
    }
    if (upper.includes("TINTA") || upper.includes("VERNIZ") || upper.includes("MASSA CORRIDA") || upper.includes("SELADOR") || upper.includes("PINCEL") || upper.includes("ROLO")) {
      return "Tintas e Acessórios";
    }
    if (upper.includes("CIMENTO") || upper.includes("ARGAMASSA") || upper.includes("TIJOLO") || upper.includes("BLOCO") || upper.includes("AREIA")) {
      return "Construção Básica";
    }
    if (upper.includes("BROCA") || upper.includes("PARAFUSO") || upper.includes("ALICATE") || upper.includes("CHAVE") || upper.includes("MARTELO") || upper.includes("DISCO")) {
      return "Ferramentas";
    }
    return "Geral";
  }

  private async processImportData(
    data: ImportedProduct[],
    options: any,
  ): Promise<ImportResult> {
    const errors: Array<{ row: number; message: string; data: any }> = [];
    const warnings: Array<{ row: number; message: string; data: any }> = [];
    const validProducts: any[] = [];

    // Cache para categorias
    const categoryCache = new Map<string, string>();
    const skuSet = new Set<string>();

    // Buscar todas as categorias existentes
    const existingCategories = await this.prisma.category.findMany({
      select: { id: true, name: true },
    });

    existingCategories.forEach((cat) => {
      categoryCache.set(cat.name.toLowerCase(), cat.id);
    });

    // Buscar SKUs existentes no banco
    const existingSkus = await this.prisma.product.findMany({
      select: { sku: true },
    });
    const existingSkuSet = new Set(existingSkus.map((p) => p.sku));

    // Validar cada produto
    for (let i = 0; i < data.length; i++) {
      const product = data[i];
      const row = i + 2; // +2 porque linha 1 é header e arrays começam em 0

      try {
        // Validações obrigatórias
        if (!product.name) {
          errors.push({ row, message: "Nome é obrigatório", data: product });
          continue;
        }

        if (!product.price || product.price <= 0) {
          errors.push({
            row,
            message: "Preço deve ser maior que zero",
            data: product,
          });
          continue;
        }

        if (!product.sku) {
          errors.push({ row, message: "SKU é obrigatório", data: product });
          continue;
        }

        if (!product.category) {
          errors.push({
            row,
            message: "Categoria é obrigatória",
            data: product,
          });
          continue;
        }

        // Verificar SKU duplicado no banco
        if (existingSkuSet.has(product.sku)) {
          errors.push({
            row,
            message: `SKU ${product.sku} já existe no sistema`,
            data: product,
          });
          continue;
        }

        // Verificar SKU duplicado no lote atual
        if (skuSet.has(product.sku)) {
          errors.push({
            row,
            message: `SKU ${product.sku} duplicado no arquivo`,
            data: product,
          });
          continue;
        }
        skuSet.add(product.sku);

        // Buscar ou criar categoria
        let categoryId = categoryCache.get(product.category.toLowerCase());
        if (!categoryId) {
          try {
            const newCategory = await this.prisma.category.create({
              data: {
                name: product.category,
                slug: this.generateSlug(product.category),
                description: `Categoria criada automaticamente durante importação`,
                active: true,
              },
            });
            categoryId = newCategory.id;
            categoryCache.set(product.category.toLowerCase(), categoryId);

            warnings.push({
              row,
              message: `Categoria "${product.category}" criada automaticamente`,
              data: product,
            });
          } catch (error) {
            errors.push({
              row,
              message: `Erro ao criar categoria: ${error.message}`,
              data: product,
            });
            continue;
          }
        }

        // Processar imagens
        const images = product.images
          ? product.images.split("|").map((url, index) => ({
              url: url.trim(),
              alt: product.name,
              order: index,
            }))
          : [];

        // Processar tags
        const tags = product.tags
          ? product.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : [];

        // Avisos
        if (!product.description) {
          warnings.push({
            row,
            message: "Descrição não informada",
            data: product,
          });
        }

        if (!product.stock || product.stock === 0) {
          warnings.push({ row, message: "Produto sem estoque", data: product });
        }

        if (images.length === 0) {
          warnings.push({ row, message: "Produto sem imagens", data: product });
        }

        // Produto válido
        validProducts.push({
          name: product.name,
          description: product.description || "",
          specifications: product.specifications || "",
          price: product.price,
          stock: product.stock || 0,
          sku: product.sku,
          barcode: product.barcode || "",
          brand: product.brand || "",
          weight: product.weight || 0,
          dimensions: product.dimensions || "",
          categoryId,
          active: product.active !== false,
          featured: false,
          images,
          tags,
        });
      } catch (error) {
        errors.push({
          row,
          message: `Erro na validação: ${error.message}`,
          data: product,
        });
      }
    }

    // Se há erros críticos e NÃO devemos pular erros, não criar produtos
    if (errors.length > 0 && !options.skipErrors) {
      return {
        success: 0,
        errors,
        warnings,
        message: `${errors.length} erros encontrados. Nenhum produto foi criado. Corrija os erros ou use a opção de ignorar erros.`,
      };
    }

    if (validProducts.length === 0) {
      return {
        success: 0,
        errors,
        warnings,
        message: "Nenhum produto válido encontrado para importação.",
      };
    }

    // Criar produtos válidos
    let successCount = 0;
    for (const product of validProducts) {
      try {
        let productImages = [...product.images];

        // Se o produto não tem imagens e a opção de auto-download estiver ativa
        if (productImages.length === 0 && options.autoFetchImages) {
          try {
            this.logger.log(
              `Buscando imagem automaticamente para o produto importado: "${product.name}"`,
            );
            const searchResults = await this.imageSearchService.searchImages({
              query: product.name,
              ean: product.barcode || undefined,
              brand: product.brand || undefined,
              limit: 1,
            });

            if (searchResults.length > 0) {
              const { uploadResult } =
                await this.imageSearchService.downloadAndSaveProductImage(
                  searchResults[0].url,
                  { alt: product.name },
                );

              productImages = [
                {
                  url: uploadResult.url,
                  alt: product.name,
                  order: 0,
                },
              ];
            }
          } catch (imgErr: any) {
            this.logger.warn(
              `Não foi possível obter imagem automática para "${product.name}": ${imgErr.message}`,
            );
          }
        }

        await this.prisma.product.create({
          data: {
            ...product,
            images: {
              create: productImages,
            },
            tags: {
              create: product.tags.map((tagName: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      slug: this.generateSlug(tagName),
                    },
                  },
                },
              })),
            },
          },
        });
        successCount++;
      } catch (error) {
        const rowIndex = validProducts.indexOf(product) + 2;
        errors.push({
          row: rowIndex,
          message: `Erro ao criar produto: ${error.message}`,
          data: product,
        });
      }
    }

    return {
      success: successCount,
      errors,
      warnings,
      message: `${successCount} produtos importados com sucesso${errors.length > 0 ? `, ${errors.length} falharam` : ""}`,
    };
  }

  private parseNumber(value: any, defaultValue?: number): number {
    if (value === null || value === undefined || value === "") {
      return defaultValue || 0;
    }

    const parsed = parseFloat(value.toString().replace(",", "."));
    return isNaN(parsed) ? defaultValue || 0 : parsed;
  }

  private parseBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }

    const str = value.toString().toLowerCase();
    return str === "true" || str === "1" || str === "sim" || str === "yes";
  }

  async generateTemplate(): Promise<Buffer> {
    const templateData = [
      {
        name: "Cimento Portland CP II-E 32 50kg",
        price: "25.90",
        category: "Cimentos",
        subcategory: "Cimento Portland",
        brand: "Votorantim",
        description:
          "Cimento Portland composto com escória, ideal para uso geral em construção civil",
        specifications:
          "Resistência: 32 MPa aos 28 dias. Norma: NBR 11578. Composição: Clínquer + escória + gesso",
        stock: "100",
        sku: "CIM-CP2-50KG-001",
        barcode: "7891234567890",
        weight: "50",
        dimensions: "60x40x10 cm",
        images:
          "https://exemplo.com/cimento1.jpg|https://exemplo.com/cimento2.jpg",
        tags: "cimento,construção,portland,50kg",
        active: "true",
      },
      {
        name: "Tijolo Cerâmico 6 Furos 9x14x19cm",
        price: "0.45",
        category: "Tijolos e Blocos",
        subcategory: "Tijolo Cerâmico",
        brand: "Cerâmica São João",
        description: "Tijolo cerâmico de 6 furos para alvenaria de vedação",
        specifications:
          "Dimensões: 9x14x19cm. Resistência à compressão: 3,0 MPa. Absorção de água: 22%",
        stock: "5000",
        sku: "TIJ-CER-6F-001",
        barcode: "7891234567891",
        weight: "2.5",
        dimensions: "19x14x9 cm",
        images: "https://exemplo.com/tijolo1.jpg",
        tags: "tijolo,cerâmico,alvenaria,vedação",
        active: "true",
      },
      {
        name: "Tinta Acrílica Premium Branco 18L",
        price: "89.90",
        category: "Tintas",
        subcategory: "Tinta Acrílica",
        brand: "Suvinil",
        description: "Tinta acrílica premium para paredes internas e externas",
        specifications:
          "Rendimento: 200-250 m²/L. Secagem: 30 min ao toque. Diluição: até 20% com água",
        stock: "50",
        sku: "TIN-ACR-BR-18L-001",
        barcode: "7891234567892",
        weight: "20",
        dimensions: "25x25x35 cm",
        images: "https://exemplo.com/tinta1.jpg|https://exemplo.com/tinta2.jpg",
        tags: "tinta,acrílica,branco,parede",
        active: "true",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    // Adicionar aba de instruções
    const instructionsData = [
      ["GUIA DE IMPORTAÇÃO DE PRODUTOS", ""],
      ["", ""],
      ["CAMPOS OBRIGATÓRIOS:", ""],
      ["name", "Nome completo do produto"],
      ["price", "Preço de venda (use ponto para decimal: 25.90)"],
      ["category", "Categoria principal do produto"],
      ["sku", "Código único do produto (não pode repetir)"],
      ["", ""],
      ["CAMPOS OPCIONAIS:", ""],
      ["subcategory", "Subcategoria do produto"],
      ["brand", "Marca/fabricante"],
      ["description", "Descrição detalhada"],
      ["specifications", "Especificações técnicas"],
      ["stock", "Quantidade em estoque (número inteiro)"],
      ["barcode", "Código de barras"],
      ["weight", "Peso em kg (use ponto: 2.5)"],
      ["dimensions", "Dimensões do produto"],
      ["images", "URLs das imagens separadas por | (pipe)"],
      ["tags", "Tags separadas por vírgula"],
      ["active", "true ou false (produto ativo)"],
      ["", ""],
      ["DICAS IMPORTANTES:", ""],
      ["✓ SKUs devem ser únicos em todo o sistema", ""],
      ["✓ Categorias serão criadas automaticamente se não existirem", ""],
      ["✓ Use ponto (.) para números decimais, não vírgula", ""],
      ["✓ Para múltiplas imagens, separe URLs com | (pipe)", ""],
      ["✓ Tags ajudam na busca, separe com vírgula", ""],
      ["✓ Produtos duplicados (mesmo SKU) serão atualizados", ""],
      ["✓ Deixe campos vazios se não tiver a informação", ""],
      ["", ""],
      ["EXEMPLO DE PREENCHIMENTO:", ""],
      ["name: Cimento Portland CP II-E 32 50kg", ""],
      ["price: 25.90", ""],
      ["category: Cimentos", ""],
      ["sku: CIM-CP2-50KG-001", ""],
      ["stock: 100", ""],
      ["weight: 50", ""],
      ["images: https://site.com/img1.jpg|https://site.com/img2.jpg", ""],
      ["tags: cimento,construção,portland", ""],
      ["active: true", ""],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instruções");

    // Adicionar aba de categorias sugeridas
    const categoriesData = [
      ["CATEGORIAS SUGERIDAS PARA MATERIAIS DE CONSTRUÇÃO", ""],
      ["", ""],
      ["CATEGORIA PRINCIPAL", "SUBCATEGORIAS SUGERIDAS"],
      ["Cimentos", "Cimento Portland, Cimento Branco, Argamassa"],
      ["Tijolos e Blocos", "Tijolo Cerâmico, Bloco de Concreto, Tijolo Maciço"],
      ["Tintas", "Tinta Acrílica, Tinta Látex, Esmalte, Verniz"],
      ["Ferragens", "Parafusos, Pregos, Dobradiças, Fechaduras"],
      ["Tubos e Conexões", "Tubos PVC, Conexões, Registros, Válvulas"],
      ["Pisos e Revestimentos", "Cerâmica, Porcelanato, Azulejo, Pedras"],
      ["Madeiras", "Madeira Tratada, Compensado, MDF, Ripas"],
      ["Ferramentas", "Ferramentas Manuais, Elétricas, Medição"],
      ["Elétrica", "Fios, Cabos, Interruptores, Tomadas"],
      ["Hidráulica", "Torneiras, Chuveiros, Sifões, Ralos"],
      ["Telhas", "Telha Cerâmica, Telha Fibrocimento, Telha Metálica"],
      ["Areia e Pedra", "Areia Fina, Areia Grossa, Brita, Pedra"],
      ["Impermeabilizantes", "Manta Asfáltica, Tinta Impermeável, Selantes"],
    ];

    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categorias");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .trim();
  }
}
