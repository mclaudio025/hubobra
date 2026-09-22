import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ReviewsService, CreateReviewDto } from "./reviews.service";

@ApiTags("reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  @ApiOperation({ summary: "Listar avaliações de um produto com estatísticas e distribuição" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getProductReviews(
    @Param("productId") productId: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getProductReviews(productId, page, limit);
  }

  @Post("products/:productId/reviews")
  @ApiOperation({ summary: "Criar uma avaliação para o produto" })
  async createReview(
    @Param("productId") productId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || dto.userId;
    return this.reviewsService.createReview(productId, dto, userId);
  }

  @Post("reviews/:reviewId/vote")
  @ApiOperation({ summary: "Votar em uma avaliação (útil / não útil)" })
  async voteReview(
    @Param("reviewId") reviewId: string,
    @Body("helpful") helpful: boolean,
  ) {
    return this.reviewsService.voteReview(reviewId, !!helpful);
  }
}
