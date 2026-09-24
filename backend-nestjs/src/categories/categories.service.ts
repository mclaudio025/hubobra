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
    const { name } = createCategoryDto;
    const parentId = createCategoryDto.parentId && createCategoryDto.parentId.trim() !== "" ? createCategoryDto.parentId : null;

    // Verificar se categoria já existe no mesmo nível
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingCategory) {
      throw new BadRequestException("Já existe uma categoria com este nome neste nível");
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

    const slug = await this.generateUniqueSlug(name, parentId);

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        parentId,
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

  private async generateUniqueSlug(name: string, parentId?: string | null, excludeId?: string): Promise<string> {
    const baseSlug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos (é->e, á->a, ç->c)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const rootSlug = baseSlug || "categoria";

    let candidate = rootSlug;
    let count = 0;

    while (true) {
      const existing = await this.prisma.category.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });

      if (!existing) {
        return candidate;
      }

      count++;
      candidate = `${rootSlug}-${count}`;
    }
  }

  @CacheCategories(1800) // Cache por 30 minutos
  async findAll(active?: boolean, includeChildren = true) {
    const where = active !== undefined ? { active } : {};

    const categories = await this.prisma.category.findMany({
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

    return categories.map((cat) => {
      const directProducts = cat._count?.products || 0;
      const childrenProducts = (cat.children || []).reduce(
        (sum: number, child: any) => sum + (child._count?.products || 0),
        0
      );
      return {
        ...cat,
        _count: {
          ...cat._count,
          products: directProducts + childrenProducts,
          directProducts,
        },
      };
    });
  }

  async findMainCategories(active?: boolean) {
    const where = {
      parentId: null,
      ...(active !== undefined ? { active } : {}),
    };

    const categories = await this.prisma.category.findMany({
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

    return categories.map((cat) => {
      const directProducts = cat._count?.products || 0;
      const childrenProducts = (cat.children || []).reduce(
        (sum: number, child: any) => sum + (child._count?.products || 0),
        0
      );
      return {
        ...cat,
        _count: {
          ...cat._count,
          products: directProducts + childrenProducts,
          directProducts,
        },
      };
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

    const directProducts = category._count?.products || 0;
    const childrenProducts = (category.children || []).reduce(
      (sum: number, child: any) => sum + (child._count?.products || 0),
      0
    );

    return {
      ...category,
      _count: {
        ...category._count,
        products: directProducts + childrenProducts,
        directProducts,
      },
    };
  }

  async findBySlug(slug: string) {
    let category = await this.prisma.category.findUnique({
      where: { slug },
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
      const cleanSlug = slug.replace(/-sub$/, "");
      category = await this.prisma.category.findFirst({
        where: {
          OR: [
            { slug: cleanSlug },
            { slug: `${cleanSlug}-sub` },
          ],
        },
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
    }

    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }

    const directProducts = category._count?.products || 0;
    const childrenProducts = (category.children || []).reduce(
      (sum: number, child: any) => sum + (child._count?.products || 0),
      0
    );

    return {
      ...category,
      _count: {
        ...category._count,
        products: directProducts + childrenProducts,
        directProducts,
      },
    };
  }

  @CacheEvict("categories:*")
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);
    const { name } = updateCategoryDto;
    
    // Normalizar parentId se fornecido
    let targetParentId = category.parentId;
    if (updateCategoryDto.parentId !== undefined) {
      targetParentId = updateCategoryDto.parentId && updateCategoryDto.parentId.trim() !== "" 
        ? updateCategoryDto.parentId 
        : null;
    }

    // Não permitir que seja pai de si mesma
    if (targetParentId === id) {
      throw new BadRequestException("Uma categoria não pode ser pai de si mesma");
    }

    // Verificar se categoria pai existe (se fornecida)
    if (targetParentId && targetParentId !== category.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: targetParentId },
      });

      if (!parentCategory) {
        throw new BadRequestException("Categoria pai não encontrada");
      }
    }

    const targetName = name || category.name;

    // Verificar se já existe outra categoria com mesmo nome e mesmo pai
    if ((name && name !== category.name) || (targetParentId !== category.parentId)) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: targetName,
          parentId: targetParentId || null,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new BadRequestException("Já existe uma categoria com este nome neste nível");
      }
    }

    // Gerar novo slug se nome ou parentId mudaram
    let slug: string | undefined;
    if (name || targetParentId !== category.parentId) {
      slug = await this.generateUniqueSlug(targetName, targetParentId, id);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        parentId: targetParentId,
        ...(slug && { slug }),
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
