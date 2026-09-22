import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addItem(userId: string, productId: string, quantity: number) {
    // Verificar se produto existe e está ativo
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.active) {
      throw new NotFoundException("Produto não encontrado ou inativo");
    }

    // Verificar estoque
    if (product.stock < quantity) {
      throw new BadRequestException(
        "Quantidade solicitada maior que o estoque disponível",
      );
    }

    // Verificar se item já existe no carrinho
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      // Atualizar quantidade
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          "Quantidade total maior que o estoque disponível",
        );
      }

      return this.prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
    }

    // Criar novo item
    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      total,
      totalItems,
    };
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        "Quantidade maior que o estoque disponível",
      );
    }

    return this.prisma.cartItem.update({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      data: { quantity },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    return this.prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }
}
