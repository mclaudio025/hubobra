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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "../common/enums";

import { BannersService } from "./banners.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("banners")
@Controller("banners")
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar novo banner" })
  @ApiResponse({ status: 201, description: "Banner criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  @Get()
  @ApiOperation({ summary: "Listar banners" })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "active", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de banners" })
  findAll(@Query("type") type?: string, @Query("active") active?: boolean) {
    return this.bannersService.findAll(type, active);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas de banners" })
  @ApiResponse({ status: 200, description: "Estatísticas dos banners" })
  getStats() {
    return this.bannersService.getBannerStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar banner por ID" })
  @ApiResponse({ status: 200, description: "Banner encontrado" })
  @ApiResponse({ status: 404, description: "Banner não encontrado" })
  findOne(@Param("id") id: string) {
    return this.bannersService.findById(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar banner" })
  @ApiResponse({ status: 200, description: "Banner atualizado com sucesso" })
  @ApiResponse({ status: 404, description: "Banner não encontrado" })
  update(@Param("id") id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannersService.update(id, updateBannerDto);
  }

  @Patch(":id/toggle-active")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Alternar status ativo do banner" })
  @ApiResponse({ status: 200, description: "Status alterado com sucesso" })
  toggleActive(@Param("id") id: string) {
    return this.bannersService.toggleActive(id);
  }

  @Patch("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reordenar banners" })
  @ApiResponse({ status: 200, description: "Ordem atualizada com sucesso" })
  reorder(@Body("bannerIds") bannerIds: string[]) {
    return this.bannersService.updatePositions(bannerIds);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Excluir banner" })
  @ApiResponse({ status: 200, description: "Banner excluído com sucesso" })
  @ApiResponse({ status: 404, description: "Banner não encontrado" })
  remove(@Param("id") id: string) {
    return this.bannersService.remove(id);
  }
}
