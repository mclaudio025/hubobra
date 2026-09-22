import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";
import { CacheCategories, CacheEvict } from "../cache/cache.decorator";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  @CacheEvict("categories:*")
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId } = createCategoryDto;

    // Verificar se categoria já existe no mesmo nível
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingCategory) {
      throw new BadRequestException("Categoria já existe neste nível");
    }

    // Verificar se categoria pai existe (se fornecida)
    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException("Categoria pai não encontrada");
      }
    }

    const slug = this.generateSlug(name, parentId);

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });
  }

  private generateSlug(name: string, parentId?: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return parentId ? `${baseSlug}-sub` : baseSlug;
  }

  @CacheCategories(1800) // Cache por 30 minutos
  async findAll(active?: boolean, includeChildren = true) {
    const where = active !== undefined ? { active } : {};

    return this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: includeChildren
          ? {
              include: {
                _count: {
                  select: {
                    products: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            }
          : false,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }

  async findMainCategories(active?: boolean) {
    const where = {
      parentId: null,
      ...(active !== undefined ? { active } : {}),
    };

    return this.prisma.category.findMany({
      where,
      include: {
        children: {
          where: active !== undefined ? { active } : {},
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }

  async findSubcategories(parentId: string, active?: boolean) {
    const where = {
      parentId,
      ...(active !== undefined ? { active } : {}),
    };

    return this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }

    return category;
  }

  @CacheEvict("categories:*")
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);
    const { name } = updateCategoryDto;

    // Verificar se novo nome já existe
    if (name && name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name,
          id: { not: id }, // Excluir a categoria atual
        },
      });

      if (existingCategory) {
        throw new BadRequestException("Nome da categoria já existe");
      }
    }

    const slug = name
      ? name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
      : undefined;

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        ...(slug && { slug }),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  @CacheEvict("categories:*")
  async remove(id: string) {
    const category = await this.findById(id);

    // Verificar se há produtos associados
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir categoria com ${productsCount} produto(s) associado(s)`,
      );
    }

    // Verificar se há subcategorias
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir categoria com ${childrenCount} subcategoria(s)`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const category = await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: {
        active: !category.active,
      },
    });
  }

  async getCategoryStats() {
    const [total, active, withProducts] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.category.count({ where: { active: true } }),
      this.prisma.category.count({
        where: {
          products: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withProducts,
      empty: total - withProducts,
    };
  }
}
