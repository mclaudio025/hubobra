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
      shipping = 0,
      tax = 0,
    } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException("O pedido deve conter pelo menos um item");
    }

    // Validar produtos e calcular totais
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Produtos não encontrados no catálogo: ${missingIds.join(", ")}`,
      );
    }

    // Verificar estoque quando aplicável
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(
          `Produto ${item.productId} não encontrado`,
        );
      }
      if (typeof product.stock === "number" && product.stock > 0 && product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name} (Disponível: ${product.stock}, Solicitado: ${item.quantity})`,
        );
      }
    }

    // Calcular totais
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0,
    );
    const total = subtotal + (Number(shipping) || 0) + (Number(tax) || 0);

    // Gerar número do pedido
    const orderNumber = await this.generateOrderNumber();

    // Criar pedido diretamente (compatível com Supabase PgBouncer / Pooler)
    try {
      const newOrder = await this.prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping: Number(shipping) || 0,
          tax: Number(tax) || 0,
          total,
          notes: notes ? String(notes).trim() : null,
          status: OrderStatus.PENDING,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
              total: (Number(item.price) || 0) * (Number(item.quantity) || 1),
            })),
          },
          shippingAddress: {
            create: {
              street: shippingAddress?.street || "Retirada no CD",
              number: shippingAddress?.number || "S/N",
              complement: shippingAddress?.complement ? String(shippingAddress.complement).trim() : null,
              district: shippingAddress?.district || "Centro",
              city: shippingAddress?.city || "Fortaleza",
              state: shippingAddress?.state || "CE",
              zipCode: shippingAddress?.zipCode || "60000-000",
              country: shippingAddress?.country || "Brasil",
            },
          },
          payment: {
            create: {
              method: payment?.method || "CASH",
              amount: Number(payment?.amount) || total,
              status: PaymentStatus.PENDING,
              transactionId: payment?.transactionId || null,
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

      // Atualizar estoque dos produtos de forma não-bloqueante
      for (const item of items) {
        try {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: Number(item.quantity) || 1,
              },
            },
          });
        } catch (stockErr: any) {
          console.warn(`[OrdersService] Não foi possível decrementar estoque do produto ${item.productId}:`, stockErr?.message);
        }
      }

      // Limpar carrinho do usuário
      try {
        await this.prisma.cartItem.deleteMany({
          where: {
            userId,
            productId: { in: productIds },
          },
        });
      } catch (cartErr: any) {
        console.warn("[OrdersService] Aviso ao limpar itens do carrinho:", cartErr?.message);
      }

      return newOrder;
    } catch (dbErr: any) {
      console.error("[OrdersService.create] Erro ao registrar pedido no banco de dados:", dbErr);
      throw new BadRequestException(
        dbErr?.message || "Falha ao registrar pedido no banco de dados",
      );
    }
  }

  async createBotOrder(data: {
    customerName?: string;
    customerPhone: string;
    customerEmail?: string;
    items?: Array<{
      productId?: string;
      productName?: string;
      name?: string;
      quantity?: number;
      price?: number;
    }>;
    deliveryType?: string;
    shippingAddress?: {
      street?: string;
      number?: string;
      complement?: string;
      district?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      reference?: string;
    };
    paymentMethod?: string;
    notes?: string;
  }) {
    const cleanPhone = (data.customerPhone || '').replace(/\D/g, '');
    const email = data.customerEmail || (cleanPhone ? `${cleanPhone}@hubobra.com.br` : `cliente_${Date.now()}@hubobra.com.br`);
    const name = data.customerName || 'Cliente WhatsApp';

    // 1. Localizar ou Criar Usuário
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          ...(cleanPhone ? [{ email: { contains: cleanPhone } }] : [])
        ]
      }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: 'hubobra_temp_pwd_' + Math.random().toString(36).slice(2, 8),
          role: 'USER',
        }
      });
    }

    // 2. Processar itens e resolver produtos
    const orderItemsToCreate: Array<{ productId: string; quantity: number; price: number; total: number; name: string }> = [];
    
    for (const item of (data.items || [])) {
      const qty = Number(item.quantity) || 1;
      let unitPrice = Number(item.price) || 0;
      let resolvedProduct: any = null;

      if (item.productId) {
        resolvedProduct = await this.prisma.product.findUnique({ where: { id: item.productId } });
      }

      const searchName = item.productName || item.name || '';
      if (!resolvedProduct && searchName) {
        resolvedProduct = await this.prisma.product.findFirst({
          where: {
            OR: [
              { name: { contains: searchName, mode: 'insensitive' } },
              { description: { contains: searchName, mode: 'insensitive' } }
            ]
          }
        });
      }

      if (!resolvedProduct) {
        resolvedProduct = await this.prisma.product.findFirst({
          where: { active: true }
        });
      }

      if (resolvedProduct) {
        if (!unitPrice || unitPrice <= 0) {
          unitPrice = Number(resolvedProduct.price) || 0;
        }
        orderItemsToCreate.push({
          productId: resolvedProduct.id,
          name: resolvedProduct.name,
          quantity: qty,
          price: unitPrice,
          total: unitPrice * qty
        });
      }
    }

    if (orderItemsToCreate.length === 0) {
      const defaultProduct = await this.prisma.product.findFirst({ where: { active: true } });
      if (defaultProduct) {
        orderItemsToCreate.push({
          productId: defaultProduct.id,
          name: defaultProduct.name,
          quantity: 1,
          price: defaultProduct.price || 32.00,
          total: defaultProduct.price || 32.00
        });
      }
    }

    const subtotal = orderItemsToCreate.reduce((sum, i) => sum + i.total, 0);
    const isPix = (data.paymentMethod || '').toUpperCase() === 'PIX';
    const total = isPix ? (subtotal * 0.90) : subtotal;

    const orderNumber = await this.generateOrderNumber();
    const isPickup = (data.deliveryType || '').toUpperCase() === 'PICKUP';

    const newOrder = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        total,
        shipping: 0,
        tax: 0,
        notes: data.notes || `Pedido gerado pela IA WhatsApp (${data.paymentMethod || 'Cartão na Entrega'})`,
        status: OrderStatus.PENDING,
        items: {
          create: orderItemsToCreate.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            total: i.total
          }))
        },
        shippingAddress: {
          create: {
            street: isPickup ? 'Retirada Express no Centro de Distribuição HubObra' : (data.shippingAddress?.street || 'Endereço informado na obra'),
            number: data.shippingAddress?.number || 'S/N',
            complement: data.shippingAddress?.complement || null,
            district: data.shippingAddress?.district || data.shippingAddress?.neighborhood || 'Messejana',
            city: data.shippingAddress?.city || 'Fortaleza',
            state: data.shippingAddress?.state || 'CE',
            zipCode: data.shippingAddress?.zipCode || '60000-000',
            country: 'Brasil'
          }
        },
        payment: {
          create: {
            method: isPix ? 'PIX' : (data.paymentMethod || 'CREDIT_CARD'),
            amount: total,
            status: PaymentStatus.PENDING,
          }
        }
      },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        payment: true,
        user: true
      }
    });

    return {
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        subtotal: newOrder.subtotal,
        status: newOrder.status,
        paymentMethod: newOrder.payment?.method,
        receiptUrl: `https://hubobra.com.br/pedidos/${newOrder.id}/recibo`,
        items: newOrder.items.map(i => ({
          name: i.product?.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total
        })),
        shippingAddress: newOrder.shippingAddress
      }
    };
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
          shippingAddress: true,
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
    try {
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
      if (lastOrder && lastOrder.orderNumber) {
        const lastSequence = parseInt(lastOrder.orderNumber.slice(-4), 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }

      return `${prefix}${sequence.toString().padStart(4, "0")}`;
    } catch (e) {
      return `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    }
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: OrderStatus,
  ) {
    // Permite transições flexíveis na gestão do painel administrativo
    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PROCESSING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.SHIPPED]: [
        OrderStatus.PROCESSING,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.DELIVERED]: [
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CANCELLED]: [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
      ],
    };

    const allowedTransitions = validTransitions[currentStatus] || Object.values(OrderStatus);

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
