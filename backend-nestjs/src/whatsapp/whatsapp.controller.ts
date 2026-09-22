import {
  Controller,
  Post,
  Body,
  Get,
  Logger,
  HttpStatus,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import { WhatsAppService, WhatsAppMessage } from "./whatsapp.service";
import { WhatsAppAIService } from "./whatsapp-ai.service";
import { AIPersonasService } from "../ai-personas/ai-personas.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("whatsapp")
@Controller("whatsapp")
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly whatsappAIService: WhatsAppAIService,
    private readonly aiPersonasService: AIPersonasService,
  ) {}

  @Post("webhook")
  @ApiOperation({ summary: "Webhook para receber mensagens do WhatsApp" })
  @ApiResponse({ status: 200, description: "Webhook processado com sucesso" })
  async webhook(@Body() body: any, @Res() res: Response) {
    try {
      this.logger.debug("Webhook received:", JSON.stringify(body, null, 2));

      // Verificar se é uma mensagem
      if (body.event === "messages.upsert" && body.data?.messages) {
        for (const message of body.data.messages) {
          await this.processMessage(message);
        }
      }

      // Verificar se é atualização de QR Code
      if (body.event === "qrcode.updated") {
        this.logger.log(
          "QR Code updated:",
          body.data?.qrcode ? "Available" : "Not available",
        );
      }

      // Verificar se é atualização de conexão
      if (body.event === "connection.update") {
        this.logger.log("Connection status:", body.data?.state);
      }

      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      this.logger.error("Webhook processing error:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  @Get("status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verificar status da instância WhatsApp" })
  @ApiResponse({ status: 200, description: "Status da instância" })
  async getStatus() {
    try {
      const status = await this.whatsappService.getInstanceStatus();
      return {
        success: true,
        status,
      };
    } catch (error) {
      this.logger.error("Failed to get WhatsApp status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get("qrcode")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter QR Code para conectar WhatsApp" })
  @ApiResponse({ status: 200, description: "QR Code" })
  async getQRCode() {
    try {
      const qrcode = await this.whatsappService.getQRCode();
      return {
        success: true,
        qrcode,
      };
    } catch (error) {
      this.logger.error("Failed to get QR code:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("create-instance")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar instância WhatsApp" })
  @ApiResponse({ status: 200, description: "Instância criada" })
  async createInstance() {
    try {
      const instance = await this.whatsappService.createInstance();
      return {
        success: true,
        instance,
      };
    } catch (error) {
      this.logger.error("Failed to create WhatsApp instance:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("test-message")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enviar mensagem de teste" })
  @ApiResponse({ status: 200, description: "Mensagem enviada" })
  async sendTestMessage(@Body() body: { phone: string; message: string }) {
    try {
      const response = await this.whatsappService.sendMessage(
        body.phone,
        body.message,
      );
      return {
        success: true,
        response,
      };
    } catch (error) {
      this.logger.error("Failed to send test message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async processMessage(message: WhatsAppMessage) {
    try {
      // Validar mensagem
      if (!this.whatsappService.isValidMessage(message)) {
        this.logger.debug("Invalid message, skipping");
        return;
      }

      const phoneNumber = this.whatsappService.extractPhoneNumber(
        message.key.remoteJid,
      );
      const messageText = this.whatsappService.extractMessageText(message);
      const userName = message.pushName || "Cliente";

      this.logger.log(
        `Processing message from ${userName} (${phoneNumber}): ${messageText}`,
      );

      // Enviar indicador de digitação
      await this.whatsappService.sendTyping(message.key.remoteJid);

      // Processar com IA
      const aiResponse = await this.whatsappAIService.processMessage({
        phone: phoneNumber,
        message: messageText,
        userName,
        sessionId: `whatsapp_${phoneNumber}`,
      });

      // Enviar resposta
      await this.whatsappService.sendMessage(message.key.remoteJid, aiResponse);

      this.logger.log(
        `Response sent to ${userName}: ${aiResponse.substring(0, 100)}...`,
      );
    } catch (error) {
      this.logger.error("Error processing message:", error);

      // Enviar mensagem de erro amigável
      try {
        await this.whatsappService.sendMessage(
          message.key.remoteJid,
          "🤖 Ops! Tive um probleminha técnico. Pode tentar novamente em alguns segundos? Obrigado pela paciência!",
        );
      } catch (sendError) {
        this.logger.error("Failed to send error message:", sendError);
      }
    }
  }
}
