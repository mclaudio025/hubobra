import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";
import { CacheProducts, CacheEvict } from "../cache/cache.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { BulkCreateProductDto } from "./dto/bulk-create-product.dto";
import {
  normalizeProductName,
  normalizeDescription,
  normalizeBrand,
} from "../common/text-normalizer";

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  @CacheEvict("products:*")
  async create(createProductDto: CreateProductDto) {
    const { images, tags, categoryId, ...productData } = createProductDto;

    // Normalização automática de texto para padrão Title Case / Sentence Case
    if (productData.name) productData.name = normalizeProductName(productData.name);
    if (productData.description) productData.description = normalizeDescription(productData.description);
    if (productData.brand) productData.brand = normalizeBrand(productData.brand);

    // Verificar se categoria existe
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new BadRequestException("Categoria não encontrada");
    }

    // Verificar se SKU já existe
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: productData.sku },
    });

    if (existingSku) {
      throw new BadRequestException("SKU já existe");
    }

    const createData: any = {
      ...productData,
      categoryId,
    };

    if (images && images.length > 0) {
      createData.images = {
        create: images.map((image, index) => ({
          url: image.url,
          alt: image.alt || productData.name,
          order: index,
        })),
      };
    }

    if (tags && tags.length > 0) {
      createData.tags = {
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, "-"),
              },
            },
          },
        })),
      };
    }

    return this.prisma.product.create({
      data: createData,
      include: {
        category: true,
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  @CacheProducts(600) // Cache por 10 minutos
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    categoryId?: string,
    active?: boolean,
    featured?: boolean,
  ) {
    const skip = (page - 1) * limit;

    // Extrai palavras-chave relevantes removendo stopwords comuns
    const stopWords = new Set(['foto', 'quero', 'fotos', 'imagem', 'imagens', 'vocês', 'voces', 'tem', 'qual', 'preco', 'preço', 'quanto', 'custa', 'para', 'com', 'uma', 'uns', 'ver', 'sobre']);
    const searchWords = search
      ? search
          .trim()
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !stopWords.has(w.toLowerCase()))
      : [];

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } },
          { sku: { contains: search.trim(), mode: 'insensitive' } },
          { brand: { contains: search.trim(), mode: 'insensitive' } },
          { barcode: { contains: search.trim(), mode: 'insensitive' } },
          ...searchWords.map((word) => ({
            name: { contains: word, mode: 'insensitive' as const },
          })),
          ...searchWords.map((word) => ({
            description: { contains: word, mode: 'insensitive' as const },
          })),
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(active !== undefined && { active }),
      ...(featured !== undefined && { featured }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          images: {
            orderBy: { order: "asc" },
            take: 1,
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              cartItems: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { order: "asc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    return product;
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findById(id);
    const { images, tags, categoryId, ...productData } = updateProductDto;

    // Normalização automática de texto para padrão Title Case / Sentence Case
    if (productData.name) productData.name = normalizeProductName(productData.name);
    if (productData.description) productData.description = normalizeDescription(productData.description);
    if (productData.brand) productData.brand = normalizeBrand(productData.brand);

    // Verificar categoria se fornecida
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new BadRequestException("Categoria não encontrada");
      }
    }

    // Verificar SKU se alterado
    if (productData.sku && productData.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (existingSku) {
        throw new BadRequestException("SKU já existe");
      }
    }

    const updateData: any = {
      ...productData,
    };

    if (categoryId) {
      updateData.categoryId = categoryId;
    }

    if (images) {
      updateData.images = {
        deleteMany: {},
        create: images.map((image, index) => ({
          url: image.url,
          alt: image.alt || product.name,
          order: index,
        })),
      };
    }

    if (tags) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, "-"),
              },
            },
          },
        })),
      };
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const product = await this.findById(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async bulkCreate(bulkCreateDto: BulkCreateProductDto) {
    const { products } = bulkCreateDto;
    const errors: Array<{ row: number; message: string; data: any }> = [];
    const warnings: Array<{ row: number; message: string; data: any }> = [];
    const validProducts: any[] = [];

    // Validar produtos
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const row = i + 1;

      try {
        // Verificar campos obrigatórios
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

        if (!product.categoryId) {
          errors.push({
            row,
            message: "Categoria é obrigatória",
            data: product,
          });
          continue;
        }

        // Verificar se categoria existe
        const category = await this.prisma.category.findUnique({
          where: { id: product.categoryId },
        });

        if (!category) {
          errors.push({
            row,
            message: "Categoria não encontrada",
            data: product,
          });
          continue;
        }

        // Verificar SKU duplicado
        const existingSku = await this.prisma.product.findUnique({
          where: { sku: product.sku },
        });

        if (existingSku) {
          errors.push({
            row,
            message: `SKU ${product.sku} já existe`,
            data: product,
          });
          continue;
        }

        // Verificar SKU duplicado no lote atual
        const duplicateInBatch = validProducts.find(
          (p) => p.sku === product.sku,
        );
        if (duplicateInBatch) {
          errors.push({
            row,
            message: `SKU ${product.sku} duplicado no lote`,
            data: product,
          });
          continue;
        }

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

        validProducts.push(product);
      } catch (error) {
        errors.push({ row, message: "Erro na validação", data: product });
      }
    }

    // Se há erros, retornar sem criar produtos
    if (errors.length > 0) {
      return {
        success: 0,
        errors,
        warnings,
        message: `${errors.length} erros encontrados. Nenhum produto foi criado.`,
      };
    }

    // Criar produtos válidos
    const createdProducts = [];
    for (const product of validProducts) {
      try {
        const created = await this.create(product);
        createdProducts.push(created);
      } catch (error) {
        errors.push({
          row: validProducts.indexOf(product) + 1,
          message: error.message,
          data: product,
        });
      }
    }

    return {
      success: createdProducts.length,
      errors,
      warnings,
      message: `${createdProducts.length} produtos criados com sucesso`,
      products: createdProducts,
    };
  }

  async getProductStats() {
    const [total, active, outOfStock, featured, categories] = await Promise.all(
      [
        this.prisma.product.count(),
        this.prisma.product.count({ where: { active: true } }),
        this.prisma.product.count({ where: { stock: 0 } }),
        this.prisma.product.count({ where: { featured: true } }),
        this.prisma.category.count(),
      ],
    );

    return {
      total,
      active,
      inactive: total - active,
      outOfStock,
      featured,
      categories,
    };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  async toggleFeatured(id: string) {
    const product = await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        featured: !product.featured,
      },
    });
  }

  async toggleActive(id: string) {
    const product = await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        active: !product.active,
      },
    });
  }

  @CacheEvict("products:*")
  async normalizeAllExistingProducts() {
    const allProducts = await this.prisma.product.findMany();
    let updatedCount = 0;

    for (const p of allProducts) {
      const newName = normalizeProductName(p.name);
      const newDescription = p.description ? normalizeDescription(p.description) : p.description;
      const newBrand = p.brand ? normalizeBrand(p.brand) : p.brand;

      if (newName !== p.name || newDescription !== p.description || newBrand !== p.brand) {
        await this.prisma.product.update({
          where: { id: p.id },
          data: {
            name: newName,
            description: newDescription,
            brand: newBrand,
          },
        });
        updatedCount++;
      }
    }

    return {
      total: allProducts.length,
      updatedCount,
      message: `${updatedCount} produto(s) de ${allProducts.length} foram normalizados com sucesso para o padrão Title Case / Sentence Case.`,
    };
  }
}
