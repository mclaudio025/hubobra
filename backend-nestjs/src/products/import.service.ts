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
  cost?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  description?: string;
  specifications?: string;
  stock?: number;
  sku: string;
  barcode?: string;
  ncm?: string;
  unit?: string;
  storeId?: string;
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
      storeId?: string;
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

  private cleanText(text?: any): string {
    if (!text) return "";
    return text
      .toString()
      .replace(/\s*\(\d+\)\s*$/g, "") // remove sufixos como (1)
      .replace(/[*#]/g, "")
      .trim();
  }

  /**
   * Normaliza o nome da coluna para mapear sinônimos comuns de ERPs brasileiros
   */
  private normalizeHeader(header: string): string {
    const clean = header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, "");

    if (["sku", "codigo", "cod", "referencia", "ref", "codigointerno", "codprod", "item", "coda"].includes(clean)) return "sku";
    if (["barcode", "codigobarras", "codigodebarras", "ean", "ean13", "gtin", "codbarras", "barras"].includes(clean)) return "barcode";
    if (["name", "nome", "descricao", "desc", "produto", "descricaodoproduto", "titulodoproduto"].includes(clean)) return "name";
    if (["precomediovenda", "precovenda", "preco", "price", "unitario", "precomedio", "pvenda"].includes(clean)) return "price";
    if (["customedio", "custo", "cost", "precocusto", "custounitario", "pcusto"].includes(clean)) return "cost";
    if (["totvenda", "totalvenda"].includes(clean)) return "totvenda";
    if (["totcusto", "totalcusto"].includes(clean)) return "totcusto";
    if (["category", "categoria", "departamento", "secao", "grupo", "subgrupo", "familia", "depto"].includes(clean)) return "category";
    if (["brand", "marca", "fabricante", "fornecedor"].includes(clean)) return "brand";
    if (["stock", "estoque", "qtd", "quantidade", "saldo", "estoquea", "estoqueatual", "saldoatual", "estq"].includes(clean)) return "stock";
    if (["ncm", "classfiscal", "classificacaofiscal"].includes(clean)) return "ncm";
    if (["unit", "unidade", "unid", "medida", "um"].includes(clean)) return "unit";
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
          const rawName = this.cleanText(data.name || data.descricao || data.produto);
          const rawBrand = this.cleanText(data.brand || data.marca) || this.extractBrandFromName(rawName);
          const rawCategory = this.cleanText(data.category || data.categoria || data.grupo) || this.inferCategoryFromName(rawName);
          const rawNcm = (data.ncm || data.classfiscal)?.toString().trim() || "";
          let spec = (data.specifications || data.especificacoes)?.toString().trim() || "";
          if (rawNcm && !spec.includes("NCM")) {
            spec = spec ? `${spec} | NCM: ${rawNcm}` : `NCM: ${rawNcm}`;
          }

          const cleanData: ImportedProduct = {
            name: rawName,
            price: this.parseNumber(data.price || data.preco || data.valor || data.precomediovenda),
            cost: this.parseNumber(data.cost || data.customedio || data.custo),
            category: rawCategory,
            subcategory: (data.subcategory || data.subcategoria)?.toString().trim(),
            brand: rawBrand,
            description: (data.description || data.descricao)?.toString().trim() || rawName,
            specifications: spec,
            stock: this.parseNumber(data.stock || data.estoque || data.estoquea || data.qtd, 0),
            sku: (data.sku || data.codigo)?.toString().trim(),
            barcode: (data.barcode || data.codbarras || data.codigobarras || data.ean)?.toString().trim(),
            ncm: rawNcm,
            unit: (data.unit || data.unidade)?.toString().trim() || "UN",
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

          const rawName = this.cleanText(obj.name || obj.descricao || obj.produto);
          const rawBrand = this.cleanText(obj.brand || obj.marca) || this.extractBrandFromName(rawName);
          const rawCategory = this.cleanText(obj.category || obj.categoria || obj.grupo) || this.inferCategoryFromName(rawName);
          const rawNcm = (obj.ncm || obj.classfiscal)?.toString().trim() || "";
          let spec = (obj.specifications || obj.especificacoes)?.toString().trim() || "";
          if (rawNcm && !spec.includes("NCM")) {
            spec = spec ? `${spec} | NCM: ${rawNcm}` : `NCM: ${rawNcm}`;
          }

          return {
            name: rawName,
            price: this.parseNumber(obj.price || obj.preco || obj.valor || obj.precomediovenda),
            cost: this.parseNumber(obj.cost || obj.customedio || obj.custo),
            category: rawCategory,
            subcategory: (obj.subcategory || obj.subcategoria)?.toString().trim(),
            brand: rawBrand,
            description: (obj.description || obj.descricao)?.toString().trim() || rawName,
            specifications: spec,
            stock: this.parseNumber(obj.stock || obj.estoque || obj.estoquea || obj.qtd, 0),
            sku: (obj.sku || obj.codigo)?.toString().trim(),
            barcode: (obj.barcode || obj.codbarras || obj.codigobarras || obj.ean)?.toString().trim(),
            ncm: rawNcm,
            unit: (obj.unit || obj.unidade)?.toString().trim() || "UN",
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

        // Verificar se SKU já existe no banco
        const isExistingInDb = existingSkuSet.has(product.sku);
        if (isExistingInDb && !options.updateExisting) {
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
            message: `SKU ${product.sku} duplicado no próprio arquivo`,
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

        // Produto válido
        validProducts.push({
          name: product.name,
          description: product.description || "",
          specifications: product.specifications || "",
          price: product.price,
          cost: product.cost || undefined,
          stock: product.stock || 0,
          sku: product.sku,
          barcode: product.barcode || "",
          ncm: product.ncm || undefined,
          brand: product.brand || "",
          unit: product.unit || "UN",
          storeId: options.storeId || undefined,
          weight: product.weight || 0,
          dimensions: product.dimensions || "",
          categoryId,
          active: product.active !== false,
          featured: false,
          images,
          tags,
          isUpdate: isExistingInDb,
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
        message: `${errors.length} erros encontrados. Nenhum produto foi criado/atualizado. Corrija os erros ou use a opção de ignorar erros.`,
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

    // Criar ou atualizar produtos válidos
    let successCount = 0;
    let updatedCount = 0;

    for (const product of validProducts) {
      try {
        const { isUpdate, images: productImagesList, tags: productTagsList, ...productData } = product;

        if (isUpdate) {
          // Atualizar produto existente (preço, custo, estoque, etc.)
          await this.prisma.product.update({
            where: { sku: product.sku },
            data: {
              price: product.price,
              cost: product.cost,
              stock: product.stock,
              barcode: product.barcode || undefined,
              ncm: product.ncm || undefined,
              brand: product.brand || undefined,
              unit: product.unit || undefined,
              specifications: product.specifications || undefined,
              updatedAt: new Date(),
            },
          });
          updatedCount++;
        } else {
          // Criar novo produto
          let productImages = [...productImagesList];

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
              ...productData,
              images: {
                create: productImages,
              },
              tags: {
                create: productTagsList.map((tagName: string) => ({
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
        }
      } catch (error: any) {
        const rowIndex = validProducts.indexOf(product) + 2;
        errors.push({
          row: rowIndex,
          message: `Erro ao processar produto (${product.sku}): ${error.message}`,
          data: product,
        });
      }
    }

    const totalProcessed = successCount + updatedCount;
    return {
      success: totalProcessed,
      errors,
      warnings,
      message: `${successCount} produtos novos criados, ${updatedCount} produtos atualizados${errors.length > 0 ? `, ${errors.length} falharam` : ""}`,
    };
  }

  private parseNumber(value: any, defaultValue?: number): number {
    if (value === null || value === undefined || value === "") {
      return defaultValue ?? 0;
    }
    if (typeof value === "number") {
      return isNaN(value) ? (defaultValue ?? 0) : value;
    }

    // Tratamento robusto para formatos BR: "R$ 1.250,50", "38,50" ou "25.90"
    let str = value.toString().replace(/[R$\s]/gi, "").trim();
    if (str.includes(".") && str.includes(",")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else if (str.includes(",")) {
      str = str.replace(",", ".");
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? (defaultValue ?? 0) : parsed;
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
