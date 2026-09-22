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
  ParseBoolPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "../common/enums";

import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar nova categoria" })
  @ApiResponse({ status: 201, description: "Categoria criada com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: "Listar categorias" })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiQuery({ name: "includeChildren", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de categorias" })
  findAll(
    @Query("active") active?: boolean,
    @Query("includeChildren") includeChildren?: boolean,
  ) {
    return this.categoriesService.findAll(active, includeChildren);
  }

  @Get("main")
  @ApiOperation({ summary: "Listar apenas categorias principais (sem pai)" })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de categorias principais" })
  findMainCategories(@Query("active") active?: boolean) {
    return this.categoriesService.findMainCategories(active);
  }

  @Get(":parentId/subcategories")
  @ApiOperation({ summary: "Listar subcategorias de uma categoria" })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de subcategorias" })
  findSubcategories(
    @Param("parentId") parentId: string,
    @Query("active") active?: boolean,
  ) {
    return this.categoriesService.findSubcategories(parentId, active);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas de categorias" })
  @ApiResponse({ status: 200, description: "Estatísticas das categorias" })
  getStats() {
    return this.categoriesService.getCategoryStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar categoria por ID" })
  @ApiResponse({ status: 200, description: "Categoria encontrada" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  findOne(@Param("id") id: string) {
    return this.categoriesService.findById(id);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Buscar categoria por slug" })
  @ApiResponse({ status: 200, description: "Categoria encontrada" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar categoria" })
  @ApiResponse({ status: 200, description: "Categoria atualizada com sucesso" })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  update(
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Alternar status ativo da categoria" })
  @ApiResponse({ status: 200, description: "Status alterado com sucesso" })
  toggleActive(@Param("id") id: string) {
    return this.categoriesService.toggleActive(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Excluir categoria" })
  @ApiResponse({ status: 200, description: "Categoria excluída com sucesso" })
  @ApiResponse({
    status: 400,
    description: "Categoria possui produtos associados",
  })
  @ApiResponse({ status: 404, description: "Categoria não encontrada" })
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
