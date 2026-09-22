import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("settings")
@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Listar todas as configurações" })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiResponse({ status: 200, description: "Lista de configurações" })
  async getAllSettings(@Query("category") category?: string) {
    return this.settingsService.getAllSettings(category);
  }

  @Get("ai")
  @ApiOperation({ summary: "Obter configurações de IA" })
  @ApiResponse({ status: 200, description: "Configurações de IA" })
  async getAISettings() {
    return this.settingsService.getAISettings();
  }

  @Get("whatsapp")
  @ApiOperation({ summary: "Obter configurações do WhatsApp" })
  @ApiResponse({ status: 200, description: "Configurações do WhatsApp" })
  async getWhatsAppSettings() {
    return this.settingsService.getWhatsAppSettings();
  }

  @Get(":key")
  @ApiOperation({ summary: "Obter configuração por chave" })
  @ApiResponse({ status: 200, description: "Configuração encontrada" })
  @ApiResponse({ status: 404, description: "Configuração não encontrada" })
  async getSettingByKey(@Param("key") key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @Put(":key")
  @ApiOperation({ summary: "Atualizar configuração" })
  @ApiResponse({ status: 200, description: "Configuração atualizada" })
  @ApiResponse({ status: 404, description: "Configuração não encontrada" })
  async updateSetting(@Param("key") key: string, @Body() body: { value: any }) {
    return this.settingsService.updateSetting(key, body.value);
  }

  @Post()
  @ApiOperation({ summary: "Criar nova configuração" })
  @ApiResponse({ status: 201, description: "Configuração criada" })
  async createSetting(
    @Body()
    data: {
      key: string;
      value: any;
      type?: string;
      category?: string;
      label: string;
      description?: string;
      required?: boolean;
      encrypted?: boolean;
      order?: number;
    },
  ) {
    return this.settingsService.createSetting(data);
  }

  @Delete(":key")
  @ApiOperation({ summary: "Deletar configuração" })
  @ApiResponse({ status: 200, description: "Configuração deletada" })
  @ApiResponse({ status: 404, description: "Configuração não encontrada" })
  async deleteSetting(@Param("key") key: string) {
    return this.settingsService.deleteSetting(key);
  }

  @Put("bulk")
  @ApiOperation({ summary: "Atualizar múltiplas configurações" })
  @ApiResponse({ status: 200, description: "Configurações atualizadas" })
  async bulkUpdateSettings(
    @Body() body: { settings: Array<{ key: string; value: any }> },
  ) {
    return this.settingsService.bulkUpdateSettings(body.settings);
  }

  @Post("initialize")
  @ApiOperation({ summary: "Inicializar configurações padrão" })
  @ApiResponse({ status: 200, description: "Configurações inicializadas" })
  async initializeDefaultSettings() {
    return this.settingsService.initializeDefaultSettings();
  }
}
