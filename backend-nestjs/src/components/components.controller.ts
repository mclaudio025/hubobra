import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { ComponentsService, HomeSection } from "./components.service";

@Controller("components")
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  /**
   * Endpoint público para a Home Page:
   * Retorna as camadas ativas ordenadas com os produtos pré-resolvidos
   */
  @Get("home-sections")
  async getPublicHomeSections(): Promise<HomeSection[]> {
    return this.componentsService.getPublicSections();
  }

  /**
   * Endpoint administrativo:
   * Retorna a lista completa de camadas e suas configurações
   */
  @Get("home-sections/admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminHomeSections(): Promise<HomeSection[]> {
    return this.componentsService.getAdminSections();
  }

  /**
   * Salva a lista completa e ordem das camadas
   */
  @Put("home-sections")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async saveHomeSections(@Body() sections: HomeSection[]): Promise<{
    message: string;
    sections: HomeSection[];
  }> {
    const updated = await this.componentsService.saveSections(sections);
    return { message: "Camadas da Home salvas com sucesso", sections: updated };
  }

  /**
   * Adiciona uma nova camada
   */
  @Post("home-sections")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async addHomeSection(@Body() section: Partial<HomeSection>): Promise<{
    message: string;
    sections: HomeSection[];
  }> {
    const updated = await this.componentsService.addSection(section);
    return { message: "Camada adicionada com sucesso", sections: updated };
  }

  /**
   * Atualiza uma camada existente
   */
  @Put("home-sections/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateHomeSection(
    @Param("id") id: string,
    @Body() section: Partial<HomeSection>
  ): Promise<{
    message: string;
    sections: HomeSection[];
  }> {
    const updated = await this.componentsService.updateSection(id, section);
    return { message: "Camada atualizada com sucesso", sections: updated };
  }

  /**
   * Remove uma camada
   */
  @Delete("home-sections/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteHomeSection(@Param("id") id: string): Promise<{
    message: string;
    sections: HomeSection[];
  }> {
    const updated = await this.componentsService.deleteSection(id);
    return { message: "Camada removida com sucesso", sections: updated };
  }

  /**
   * Restaura layout padrão inspirado na Acal
   */
  @Post("home-sections/reset-default")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetDefaultSections(): Promise<{
    message: string;
    sections: HomeSection[];
  }> {
    const updated = await this.componentsService.resetDefault();
    return { message: "Layout padrão Acal restaurado com sucesso", sections: updated };
  }

  // --- Endpoints Legados para Compatibilidade ---

  @Get("config-public")
  async getComponentsConfigPublic() {
    const sections = await this.componentsService.getAdminSections();
    return sections.map((s) => ({
      id: s.id,
      name: s.title || s.type,
      enabled: s.enabled,
      order: s.order,
    }));
  }

  @Get("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getComponentsConfig() {
    const sections = await this.componentsService.getAdminSections();
    return sections.map((s) => ({
      id: s.id,
      name: s.title || s.type,
      enabled: s.enabled,
      order: s.order,
    }));
  }

  @Put("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateComponentsConfig(@Body() config: any[]) {
    // Sincroniza habilitado/ordem se chamado pelo painel legado
    const current = await this.componentsService.getAdminSections();
    const updated = current.map((s) => {
      const match = config.find((c) => c.id === s.id);
      if (match) {
        return { ...s, enabled: match.enabled, order: match.order };
      }
      return s;
    });
    await this.componentsService.saveSections(updated);
    return { message: "Configuração atualizada com sucesso" };
  }
}
