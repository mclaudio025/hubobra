import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateReviewDto {
  rating: number;
  title: string;
  comment: string;
  userName?: string;
  userId?: string;
  verified?: boolean;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, allReviews] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.productReview.count({ where: { productId } }),
      this.prisma.productReview.findMany({
        where: { productId },
        select: { rating: true },
      }),
    ]);

    // Calcular média e distribuição de notas
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    allReviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = allReviews.length > 0 ? Number((totalScore / allReviews.length).toFixed(1)) : 5.0;

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        userName: r.user?.name || "Cliente da Obra",
        userInitials: (r.user?.name || "Cliente")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        date: r.createdAt.toISOString(),
        helpful: r.helpful,
        notHelpful: r.notHelpful,
        verified: r.verified,
      })),
      stats: {
        averageRating,
        totalReviews: total,
        ratingDistribution: distribution,
      },
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createReview(productId: string, dto: CreateReviewDto, authenticatedUserId?: string) {
    // Validar se produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    if (!dto.title || !dto.comment || !dto.rating) {
      throw new BadRequestException("Título, comentário e nota são obrigatórios");
    }

    let targetUserId = authenticatedUserId || dto.userId;

    // Se nenhum userId fornecido, busca ou cria um usuário padrão de avaliações
    if (!targetUserId) {
      const existingUser = await this.prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const defaultUser = await this.prisma.user.findFirst();
        if (defaultUser) {
          targetUserId = defaultUser.id;
        }
      }
    }

    if (!targetUserId) {
      throw new BadRequestException("Não foi possível associar a avaliação a um usuário");
    }

    const review = await this.prisma.productReview.create({
      data: {
        productId,
        userId: targetUserId,
        rating: Math.min(5, Math.max(1, Math.round(dto.rating))),
        title: dto.title,
        comment: dto.comment,
        verified: dto.verified !== undefined ? dto.verified : true,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Recalcula rating do produto
    const allReviews = await this.prisma.productReview.findMany({
      where: { productId },
      select: { rating: true },
    });

    const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Number((totalScore / allReviews.length).toFixed(1));

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: newAverage,
        reviewCount: allReviews.length,
      },
    });

    this.logger.log(`Nova avaliação cadastrada para o produto ${product.name}. Nova média: ${newAverage}`);

    return review;
  }

  async voteReview(reviewId: string, helpful: boolean) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException("Avaliação não encontrada");
    }

    return this.prisma.productReview.update({
      where: { id: reviewId },
      data: {
        helpful: helpful ? { increment: 1 } : undefined,
        notHelpful: !helpful ? { increment: 1 } : undefined,
      },
    });
  }
}
