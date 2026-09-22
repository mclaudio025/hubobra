import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PromptsService } from "./prompts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("prompts")
@Controller("prompts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  @ApiOperation({ summary: "Listar todos os prompts" })
  @ApiResponse({ status: 200, description: "Lista de prompts" })
  async getAllPrompts() {
    return this.promptsService.getAllPrompts();
  }

  @Get("lia")
  @ApiOperation({ summary: "Obter prompts da Lia" })
  @ApiResponse({ status: 200, description: "Prompts da Lia" })
  async getLiaPrompts() {
    return this.promptsService.getPromptsByPersona("lia");
  }

  @Get("ze")
  @ApiOperation({ summary: "Obter prompts do Zé da Obra" })
  @ApiResponse({ status: 200, description: "Prompts do Zé da Obra" })
  async getZePrompts() {
    return this.promptsService.getPromptsByPersona("ze");
  }

  @Get(":id")
  @ApiOperation({ summary: "Obter prompt por ID" })
  @ApiResponse({ status: 200, description: "Prompt encontrado" })
  @ApiResponse({ status: 404, description: "Prompt não encontrado" })
  async getPromptById(@Param("id") id: string) {
    return this.promptsService.getPrompt(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar prompt" })
  @ApiResponse({ status: 200, description: "Prompt atualizado" })
  @ApiResponse({ status: 404, description: "Prompt não encontrado" })
  async updatePrompt(
    @Param("id") id: string,
    @Body() body: { content: string },
  ) {
    await this.promptsService.updatePrompt(id, body.content);
    return { message: "Prompt atualizado com sucesso" };
  }
}
