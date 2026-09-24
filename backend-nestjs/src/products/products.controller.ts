import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "../common/enums";

import { ProductsService } from "./products.service";
import { ImportService } from "./import.service";
import { ImageSearchService } from "./image-search.service";
import { SpecsEnrichmentService } from "./specs-enrichment.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { BulkCreateProductDto } from "./dto/bulk-create-product.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly importService: ImportService,
    private readonly imageSearchService: ImageSearchService,
    private readonly specsEnrichmentService: SpecsEnrichmentService,
  ) {}

  @Post("normalize-all")
  @ApiOperation({ summary: "Normaliza todos os produtos existentes para o padrão Title Case e Sentence Case" })
  async normalizeAll() {
    return this.productsService.normalizeAllExistingProducts();
  }

  @Post(":id/auto-specs")
  @ApiOperation({ summary: "Auto-preencher especificações técnicas do produto via inteligência de catálogo/web" })
  async autoEnrichSpecs(@Param("id") id: string) {
    return this.specsEnrichmentService.enrichProductSpecs(id);
  }

  @Get("search-specs/preview")
  @ApiOperation({ summary: "Pré-visualizar especificações de um produto a partir de nome e dados técnicos" })
  async previewSpecs(
    @Query("name") name: string,
    @Query("brand") brand?: string,
    @Query("barcode") barcode?: string,
    @Query("categoryName") categoryName?: string,
  ) {
    return this.specsEnrichmentService.generateSpecsForProduct({
      name,
      brand,
      barcode,
      categoryName,
    });
  }

  @Get("images/search")
  @ApiOperation({ summary: "Buscar sugestões de imagens na web e catálogos (por EAN/Nome/Marca)" })
  @ApiQuery({ name: "query", required: false, description: "Nome ou descrição do produto" })
  @ApiQuery({ name: "ean", required: false, description: "Código de barras EAN-13" })
  @ApiQuery({ name: "brand", required: false, description: "Marca do produto" })
  @ApiQuery({ name: "limit", required: false, description: "Limite de resultados (padrão: 12)" })
  async searchImages(
    @Query("query") query?: string,
    @Query("ean") ean?: string,
    @Query("brand") brand?: string,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 12;
    return this.imageSearchService.searchImages({
      query,
      ean,
      brand,
      limit: parsedLimit,
    });
  }

  @Post("images/download-from-url")
  @ApiOperation({ summary: "Baixar imagem de URL externa, converter para WebP e salvar no storage" })
  async downloadImageFromUrl(
    @Body() body: { imageUrl: string; productId?: string; alt?: string; isMain?: boolean },
  ) {
    return this.imageSearchService.downloadAndSaveProductImage(body.imageUrl, {
      productId: body.productId,
      alt: body.alt,
      isMain: body.isMain,
    });
  }

  @Post("images/bulk-fetch-missing")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Varredura automática para buscar fotos de produtos sem imagem" })
  async bulkFetchMissingImages(
    @Body() body: { limit?: number; forceUpdate?: boolean },
  ) {
    return this.imageSearchService.bulkFetchImagesForMissing(body);
  }

  @Post("import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Importar produtos em massa via Excel/CSV" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Arquivo CSV ou Excel com os produtos",
        },
        options: {
          type: "string",
          description: "Opções de importação em JSON (opcional)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Produtos importados com sucesso" })
  async importProducts(
    @UploadedFile() file: Express.Multer.File,
    @Body("options") optionsStr?: string,
  ) {
    const options = optionsStr ? JSON.parse(optionsStr) : {};
    return this.importService.importProducts(file, options);
  }

  @Get("import/template")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Baixar template de importação" })
  @ApiResponse({
    status: 200,
    description: "Template Excel para importação",
    content: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        schema: { type: "string", format: "binary" },
      },
    },
  })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateTemplate();

    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-importacao-produtos.xlsx"',
      "Content-Length": buffer.length,
    });

    res.send(buffer);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar novo produto" })
  @ApiResponse({ status: 201, description: "Produto criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post("bulk")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar produtos em massa" })
  @ApiResponse({ status: 201, description: "Produtos criados com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  bulkCreate(@Body() bulkCreateDto: BulkCreateProductDto) {
    return this.productsService.bulkCreate(bulkCreateDto);
  }

  @Get()
  @ApiOperation({ summary: "Listar produtos" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "categoryId", required: false, type: String })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiQuery({ name: "featured", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de produtos" })
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
    @Query("active", new ParseBoolPipe({ optional: true })) active?: boolean,
    @Query("featured", new ParseBoolPipe({ optional: true })) featured?: boolean,
  ) {
    return this.productsService.findAll(
      page,
      limit,
      search,
      categoryId,
      active,
      featured,
    );
  }


  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas de produtos" })
  @ApiResponse({ status: 200, description: "Estatísticas dos produtos" })
  getStats() {
    return this.productsService.getProductStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar produto por ID" })
  @ApiResponse({ status: 200, description: "Produto encontrado" })
  @ApiResponse({ status: 404, description: "Produto não encontrado" })
  findOne(@Param("id") id: string) {
    return this.productsService.findById(id);
  }

  @Get("sku/:sku")
  @ApiOperation({ summary: "Buscar produto por SKU" })
  @ApiResponse({ status: 200, description: "Produto encontrado" })
  @ApiResponse({ status: 404, description: "Produto não encontrado" })
  findBySku(@Param("sku") sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar produto" })
  @ApiResponse({ status: 200, description: "Produto atualizado com sucesso" })
  @ApiResponse({ status: 404, description: "Produto não encontrado" })
  update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(":id/stock")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar estoque do produto" })
  @ApiResponse({ status: 200, description: "Estoque atualizado com sucesso" })
  updateStock(
    @Param("id") id: string,
    @Body("quantity", ParseIntPipe) quantity: number,
  ) {
    return this.productsService.updateStock(id, quantity);
  }

  @Patch(":id/toggle-featured")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Alternar status de destaque do produto" })
  @ApiResponse({ status: 200, description: "Status alterado com sucesso" })
  toggleFeatured(@Param("id") id: string) {
    return this.productsService.toggleFeatured(id);
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Alternar status ativo do produto" })
  @ApiResponse({ status: 200, description: "Status alterado com sucesso" })
  toggleActive(@Param("id") id: string) {
    return this.productsService.toggleActive(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Excluir produto" })
  @ApiResponse({ status: 200, description: "Produto excluído com sucesso" })
  @ApiResponse({ status: 404, description: "Produto não encontrado" })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
