import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PixService } from "./pix.service";
import { PaymentLinkService } from "./payment-link.service";
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PixPaymentDto,
  PaymentLinkDto,
} from "./dto/create-payment.dto";

@Controller("payments")
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private pixService: PixService,
    private paymentLinkService: PaymentLinkService,
  ) {}

  @Post()
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get(":id")
  async getPayment(@Param("id") id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Put(":id")
  async updatePayment(@Param("id") id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.updatePayment(id, dto);
  }

  @Post(":id/confirm")
  async confirmPayment(
    @Param("id") id: string,
    @Body() body: { transactionId?: string },
  ) {
    return this.paymentsService.confirmPayment(id, body.transactionId);
  }

  @Post(":id/cancel")
  async cancelPayment(
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.paymentsService.cancelPayment(id, body.reason);
  }

  @Get("order/:orderId")
  async getPaymentsByOrder(@Param("orderId") orderId: string) {
    return this.paymentsService.getPaymentsByOrder(orderId);
  }

  // Endpoints específicos para PIX
  @Post("pix")
  async createPixPayment(@Body() dto: PixPaymentDto) {
    return this.pixService.createPixPayment(dto);
  }

  @Post("pix/create")
  async createPixPaymentAlternative(@Body() dto: PixPaymentDto) {
    return this.pixService.createPixPayment(dto);
  }

  @Get("pix/:id")
  async getPixPayment(@Param("id") id: string) {
    try {
      const payment = await this.paymentsService.getPayment(id);
      if (!payment) {
        throw new NotFoundException("Pagamento não encontrado");
      }

      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

      return {
        id: payment.id,
        pixCode: metadata.pixCode || "",
        qrCode: metadata.qrCode || "",
        amount: payment.amount,
        expiresAt: metadata.expiresAt,
        status: payment.status,
        orderId: payment.orderId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Erro ao buscar pagamento PIX");
    }
  }

  @Get("pix/:id/status")
  async getPixStatus(@Param("id") id: string) {
    return this.pixService.getPixStatus(id);
  }

  @Post("pix/webhook")
  async pixWebhook(@Body() body: any) {
    return this.pixService.handleWebhook(body);
  }

  @Post("pix/:id/simulate")
  async simulatePixPayment(@Param("id") id: string) {
    if (process.env.NODE_ENV === "production") {
      throw new BadRequestException("Simulação não permitida em produção");
    }
    return this.pixService.simulatePixPayment(id);
  }

  // Endpoints específicos para Payment Link
  @Post("link/create")
  async createPaymentLink(@Body() dto: PaymentLinkDto) {
    return this.paymentLinkService.createPaymentLink(dto);
  }

  @Get("link/:id")
  async getPaymentLink(@Param("id") id: string) {
    return this.paymentLinkService.getPaymentLink(id);
  }

  @Post("link/:id/pay")
  async payWithLink(
    @Param("id") id: string,
    @Body() body: { method: string; cardData?: any },
  ) {
    return this.paymentLinkService.processPayment(
      id,
      body.method,
      body.cardData,
    );
  }

  // Endpoint público para verificar status de pagamento
  @Get("public/:id/status")
  async getPublicPaymentStatus(@Param("id") id: string) {
    try {
      const payment = await this.paymentsService.getPayment(id);
      if (!payment) {
        throw new NotFoundException("Pagamento não encontrado");
      }

      return {
        id: payment.id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Erro ao buscar status do pagamento");
    }
  }

  // Endpoint para dashboard admin
  @Get("admin/dashboard")
  async getPaymentsDashboard(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    try {
      // Implementar dashboard de pagamentos para admin
      const startDateObj = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDateObj = endDate ? new Date(endDate) : new Date();

      // Buscar estatísticas de pagamentos
      const stats = await this.paymentsService.getPaymentStats(
        startDateObj,
        endDateObj,
      );

      return {
        period: {
          startDate: startDateObj,
          endDate: endDateObj,
        },
        totalPayments: stats.totalPayments || 0,
        totalAmount: stats.totalAmount || 0,
        byMethod: stats.byMethod || {},
        byStatus: stats.byStatus || {},
        recentPayments: stats.recentPayments || [],
        averageAmount: stats.averageAmount || 0,
        successRate: stats.successRate || 0,
      };
    } catch (error) {
      throw new BadRequestException("Erro ao buscar dashboard de pagamentos");
    }
  }
}
