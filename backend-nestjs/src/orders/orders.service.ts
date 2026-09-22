import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  OrderStatus,
  PaymentStatus,
} from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const {
      items,
      shippingAddress,
      payment,
      notes,
      shipping,
      tax = 0,
    } = createOrderDto;

    // Validar produtos e calcular totais
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        "Um ou mais produtos não foram encontrados",
      );
    }

    // Verificar estoque
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(
          `Produto ${item.productId} não encontrado`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}`,
        );
      }
    }

    // Calcular totais
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = subtotal + shipping + tax;

    // Gerar número do pedido
    const orderNumber = await this.generateOrderNumber();

    // Criar pedido em transação
    const order = await this.prisma.$transaction(async (prisma) => {
      // Criar pedido
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping,
          tax,
          total,
          notes,
          status: OrderStatus.PENDING,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
          },
          shippingAddress: {
            create: {
              ...shippingAddress,
              country: shippingAddress.country || "Brasil",
            },
          },
          payment: {
            create: {
              method: payment.method,
              amount: payment.amount,
              status: PaymentStatus.PENDING,
              transactionId: payment.transactionId,
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                },
              },
            },
          },
          shippingAddress: true,
          payment: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Atualizar estoque dos produtos
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Limpar carrinho do usuário
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: productIds },
        },
      });

      return newOrder;
    });

    return order;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: string,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                },
              },
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
              amount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                sku: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        shippingAddress: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }

    return order;
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
    return this.findAll(page, limit, undefined, userId);
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    // Validar transições de status
    this.validateStatusTransition(order.status, updateStatusDto.status);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
        notes: updateStatusDto.notes
          ? `${order.notes || ""}\n[${new Date().toISOString()}] Status alterado para ${updateStatusDto.status}: ${updateStatusDto.notes}`.trim()
          : order.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    // Se o pedido foi cancelado, devolver estoque
    if (updateStatusDto.status === OrderStatus.CANCELLED) {
      await this.restoreStock(id);
    }

    return updatedOrder;
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentDto: UpdatePaymentStatusDto,
  ) {
    const order = await this.findById(id);

    const updatedPayment = await this.prisma.payment.update({
      where: { orderId: id },
      data: {
        status: updatePaymentDto.status,
        transactionId: updatePaymentDto.transactionId,
        paidAt:
          updatePaymentDto.status === PaymentStatus.PAID ? new Date() : null,
      },
    });

    // Se pagamento foi aprovado, confirmar pedido
    if (
      updatePaymentDto.status === PaymentStatus.PAID &&
      order.status === OrderStatus.PENDING
    ) {
      await this.updateStatus(id, { status: OrderStatus.CONFIRMED });
    }

    return updatedPayment;
  }

  async cancel(id: string, reason?: string) {
    return this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      notes: reason || "Pedido cancelado",
    });
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      ordersByStatus: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        monthly: monthlyRevenue._sum.total || 0,
      },
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");

    const prefix = `${year}${month}${day}`;

    // Buscar último pedido do dia
    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { orderNumber: "desc" },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, "0")}`;
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: OrderStatus,
  ) {
    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} → ${newStatus}`,
      );
    }
  }

  private async restoreStock(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    // Restaurar estoque dos produtos
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }
}
