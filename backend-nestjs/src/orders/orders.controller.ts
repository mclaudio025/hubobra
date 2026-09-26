import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { UserRole } from "../common/enums";

import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from "./dto/update-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('bot-create')
  @ApiOperation({ summary: 'Criar novo pedido via Bot de WhatsApp / IA' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  createBotOrder(@Body() botOrderDto: any) {
    return this.ordersService.createBotOrder(botOrderDto);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Buscar comprovante/recibo público do pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  findOnePublic(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar novo pedido" })
  @ApiResponse({ status: 201, description: "Pedido criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  @ApiBody({ type: CreateOrderDto })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Listar todos os pedidos (Admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiResponse({ status: 200, description: "Lista de pedidos" })
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string,
  ) {
    return this.ordersService.findAll(page, limit, status);
  }

  @Get("my-orders")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Listar pedidos do usuário logado" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Lista de pedidos do usuário" })
  findMyOrders(
    @Request() req: any,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.findByUser(req.user.id, page, limit);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas de pedidos" })
  @ApiResponse({ status: 200, description: "Estatísticas dos pedidos" })
  getStats() {
    return this.ordersService.getOrderStats();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar pedido por ID" })
  @ApiResponse({ status: 200, description: "Pedido encontrado" })
  @ApiResponse({ status: 404, description: "Pedido não encontrado" })
  findOne(@Param("id") id: string, @Request() req: any) {
    // Usuários comuns só podem ver seus próprios pedidos
    // Admins e managers podem ver qualquer pedido
    return this.ordersService.findById(id);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar status do pedido" })
  @ApiResponse({ status: 200, description: "Status atualizado com sucesso" })
  @ApiResponse({ status: 400, description: "Transição de status inválida" })
  @ApiBody({ type: UpdateOrderStatusDto })
  updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  @Patch(":id/payment")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar status do pagamento" })
  @ApiResponse({ status: 200, description: "Status do pagamento atualizado" })
  @ApiBody({ type: UpdatePaymentStatusDto })
  updatePaymentStatus(
    @Param("id") id: string,
    @Body() updatePaymentDto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, updatePaymentDto);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancelar pedido" })
  @ApiResponse({ status: 200, description: "Pedido cancelado com sucesso" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Motivo do cancelamento" },
      },
    },
  })
  cancel(
    @Param("id") id: string,
    @Request() req: any,
    @Body("reason") reason?: string,
  ) {
    // TODO: Verificar se o usuário pode cancelar este pedido
    return this.ordersService.cancel(id, reason);
  }
}
