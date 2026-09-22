import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

import { CartService } from "./cart.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("cart")
@Controller("cart")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Obter carrinho do usuário" })
  @ApiResponse({ status: 200, description: "Carrinho do usuário" })
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post("items")
  @ApiOperation({ summary: "Adicionar item ao carrinho" })
  @ApiResponse({ status: 201, description: "Item adicionado com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Produto indisponível ou sem estoque",
  })
  addItem(
    @Request() req,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(req.user.id, body.productId, body.quantity);
  }

  @Patch("items/:productId")
  @ApiOperation({ summary: "Atualizar quantidade do item" })
  @ApiResponse({
    status: 200,
    description: "Quantidade atualizada com sucesso",
  })
  updateQuantity(
    @Request() req,
    @Param("productId") productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      productId,
      body.quantity,
    );
  }

  @Delete("items/:productId")
  @ApiOperation({ summary: "Remover item do carrinho" })
  @ApiResponse({ status: 200, description: "Item removido com sucesso" })
  removeItem(@Request() req, @Param("productId") productId: string) {
    return this.cartService.removeItem(req.user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: "Limpar carrinho" })
  @ApiResponse({ status: 200, description: "Carrinho limpo com sucesso" })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
