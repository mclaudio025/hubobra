import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Res,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import {
  PriceManagementService,
  PriceUpdateDto,
  BulkPriceUpdateDto,
  PriceReportFilter,
} from "./price-management.service";

@ApiTags("price-management")
@Controller("price-management")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PriceManagementController {
  private readonly logger = new Logger(PriceManagementController.name);

  constructor(
    private readonly priceManagementService: PriceManagementService,
  ) {}

  @Post("update-single")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Atualizar preço de um produto" })
  @ApiResponse({ status: 200, description: "Preço atualizado com sucesso" })
  async updateSinglePrice(@Body() dto: PriceUpdateDto, @Request() req) {
    return this.priceManagementService.updateSinglePrice(dto, req.user.id);
  }

  @Post("bulk-update")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Atualização em massa de preços" })
  @ApiResponse({ status: 200, description: "Preços atualizados em massa" })
  async bulkUpdatePrices(@Body() dto: BulkPriceUpdateDto, @Request() req) {
    return this.priceManagementService.bulkUpdatePrices(dto, req.user.id);
  }

  @Get("report")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Gerar relatório de preços" })
  @ApiResponse({ status: 200, description: "Relatório gerado com sucesso" })
  async generateReport(@Query() filters: PriceReportFilter) {
    // Converter strings para Date se necessário
    if (filters.lastUpdated) {
      if (typeof filters.lastUpdated.from === "string") {
        filters.lastUpdated.from = new Date(filters.lastUpdated.from);
      }
      if (typeof filters.lastUpdated.to === "string") {
        filters.lastUpdated.to = new Date(filters.lastUpdated.to);
      }
    }

    return this.priceManagementService.generatePriceReport(filters);
  }

  @Get("export/excel")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Exportar relatório para Excel" })
  @ApiResponse({ status: 200, description: "Arquivo Excel gerado" })
  async exportToExcel(
    @Query() filters: PriceReportFilter,
    @Res() res: Response,
  ) {
    try {
      // Converter strings para Date se necessário
      if (filters.lastUpdated) {
        if (typeof filters.lastUpdated.from === "string") {
          filters.lastUpdated.from = new Date(filters.lastUpdated.from);
        }
        if (typeof filters.lastUpdated.to === "string") {
          filters.lastUpdated.to = new Date(filters.lastUpdated.to);
        }
      }

      const buffer = await this.priceManagementService.exportToExcel(filters);

      const filename = `relatorio-precos-${new Date().toISOString().split("T")[0]}.xlsx`;

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length,
      });

      res.send(buffer);
    } catch (error) {
      this.logger.error("Erro ao exportar Excel:", error);
      res.status(500).json({ error: "Erro ao gerar arquivo Excel" });
    }
  }

  @Post("import/excel")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Importar preços via Excel" })
  @ApiResponse({ status: 200, description: "Preços importados com sucesso" })
  async importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new Error("Arquivo não fornecido");
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new Error("Apenas arquivos Excel são permitidos");
    }

    return this.priceManagementService.importFromExcel(
      file.buffer,
      req.user.id,
    );
  }

  @Get("history/:productId")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Histórico de preços de um produto" })
  @ApiResponse({ status: 200, description: "Histórico de preços" })
  async getPriceHistory(
    @Param("productId") productId: string,
    @Query("limit") limit?: number,
  ) {
    return this.priceManagementService.getPriceHistory(
      productId,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Get("categories-summary")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Resumo de preços por categoria" })
  @ApiResponse({ status: 200, description: "Resumo por categoria" })
  async getCategoriesSummary() {
    // Implementar resumo por categoria
    return { message: "Em desenvolvimento" };
  }

  @Post("preview-bulk-update")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Prévia da atualização em massa" })
  @ApiResponse({ status: 200, description: "Prévia gerada" })
  async previewBulkUpdate(@Body() dto: BulkPriceUpdateDto) {
    // Implementar prévia sem salvar
    return { message: "Prévia em desenvolvimento" };
  }
}
