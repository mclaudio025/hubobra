import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Post,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { CacheService } from "./cache.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("cache")
@Controller("cache")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get("stats")
  @ApiOperation({ summary: "Obter estatísticas do cache" })
  @ApiResponse({ status: 200, description: "Estatísticas do cache" })
  async getStats() {
    return this.cacheService.getStats();
  }

  @Post("clear")
  @ApiOperation({ summary: "Limpar todo o cache" })
  @ApiResponse({ status: 200, description: "Cache limpo com sucesso" })
  async clearCache() {
    await this.cacheService.reset();
    return { message: "Cache cleared successfully" };
  }

  @Delete("key/:key")
  @ApiOperation({ summary: "Deletar chave específica do cache" })
  @ApiParam({ name: "key", description: "Chave do cache para deletar" })
  @ApiResponse({ status: 200, description: "Chave deletada com sucesso" })
  async deleteKey(@Param("key") key: string) {
    await this.cacheService.del(key);
    return { message: `Key '${key}' deleted successfully` };
  }

  @Delete("pattern/:pattern")
  @ApiOperation({ summary: "Invalidar cache por padrão" })
  @ApiParam({
    name: "pattern",
    description: "Padrão para invalidar (ex: products:*)",
  })
  @ApiResponse({ status: 200, description: "Padrão invalidado com sucesso" })
  async invalidatePattern(@Param("pattern") pattern: string) {
    await this.cacheService.invalidatePattern(pattern);
    return { message: `Pattern '${pattern}' invalidated successfully` };
  }

  @Get("key/:key/exists")
  @ApiOperation({ summary: "Verificar se chave existe no cache" })
  @ApiParam({ name: "key", description: "Chave para verificar" })
  @ApiResponse({ status: 200, description: "Status da chave" })
  async keyExists(@Param("key") key: string) {
    const exists = await this.cacheService.exists(key);
    return { key, exists };
  }

  @Post("warmup")
  @ApiOperation({ summary: "Aquecer cache com dados frequentes" })
  @ApiResponse({ status: 200, description: "Cache aquecido com sucesso" })
  async warmupCache() {
    // Implementar lógica de aquecimento do cache
    // Por exemplo, carregar produtos mais acessados, categorias, etc.

    const warmupTasks = [
      // Aqui você pode adicionar tarefas específicas de aquecimento
      // this.productsService.findFeatured(),
      // this.categoriesService.findActive(),
    ];

    try {
      await Promise.all(warmupTasks);
      return { message: "Cache warmed up successfully" };
    } catch (error) {
      return {
        message: "Cache warmup completed with some errors",
        error: error.message,
      };
    }
  }
}
