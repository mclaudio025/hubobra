import { Controller, Post, Body, Get, Param, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AIPersonasService, PersonaResponse } from "./ai-personas.service";

import { IsString, IsOptional } from "class-validator";

export class ChatWithPersonasDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}

export class SwitchPersonaDto {
  @IsString()
  sessionId: string;

  @IsString()
  targetPersona: "lia" | "ze";
}

@ApiTags("ai-personas")
@Controller("ai-personas")
export class AIPersonasController {
  private readonly logger = new Logger(AIPersonasController.name);

  constructor(private readonly aiPersonasService: AIPersonasService) {}

  @Post("chat")
  @ApiOperation({ summary: "Chat com sistema de personas (Lia + Zé da Obra)" })
  @ApiResponse({ status: 200, description: "Resposta gerada com sucesso" })
  async chatWithPersonas(
    @Body() dto: ChatWithPersonasDto,
  ): Promise<PersonaResponse> {
    const sessionId = dto.sessionId || `session_${Date.now()}`;

    this.logger.log(
      `Chat request - Session: ${sessionId}, Message: ${dto.message}`,
    );

    return this.aiPersonasService.processMessage(
      sessionId,
      dto.message,
      dto.userName || "Cliente",
      dto.channel || "web",
    );
  }

  @Post("switch-persona")
  @ApiOperation({ summary: "Alternar entre personas manualmente" })
  @ApiResponse({ status: 200, description: "Persona alterada com sucesso" })
  async switchPersona(
    @Body() dto: SwitchPersonaDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.aiPersonasService.switchPersona(
      dto.sessionId,
      dto.targetPersona,
    );

    return {
      success: true,
      message: `Persona alterada para ${dto.targetPersona === "lia" ? "Lia (Atendente)" : "Zé da Obra (Especialista)"}`,
    };
  }

  @Get("conversation/:sessionId")
  @ApiOperation({ summary: "Obter contexto da conversa" })
  @ApiResponse({ status: 200, description: "Contexto da conversa" })
  async getConversationContext(@Param("sessionId") sessionId: string) {
    const context =
      await this.aiPersonasService.getConversationContext(sessionId);

    if (!context) {
      return { message: "Conversa não encontrada" };
    }

    return {
      sessionId: context.sessionId,
      currentPersona: context.currentPersona,
      conversationLength: context.conversationHistory.length,
      userProfile: context.userProfile,
      currentTopic: context.currentTopic,
      needsSpecialist: context.needsSpecialist,
    };
  }

  @Post("conversation/:sessionId/clear")
  @ApiOperation({ summary: "Limpar conversa" })
  @ApiResponse({ status: 200, description: "Conversa limpa com sucesso" })
  async clearConversation(@Param("sessionId") sessionId: string) {
    await this.aiPersonasService.clearConversation(sessionId);

    return {
      success: true,
      message: "Conversa limpa com sucesso",
    };
  }

  @Get("test/scenarios")
  @ApiOperation({ summary: "Cenários de teste para as personas" })
  @ApiResponse({ status: 200, description: "Cenários de teste" })
  async getTestScenarios() {
    return {
      scenarios: [
        {
          name: "Saudação inicial",
          messages: ["Olá!", "Bom dia!", "Oi, tudo bem?"],
          expectedPersona: "lia",
          description: "Deve ser atendido pela Lia com boas-vindas",
        },
        {
          name: "Informações gerais",
          messages: [
            "Qual o horário de funcionamento?",
            "Como faço um pedido?",
            "Vocês fazem entrega?",
          ],
          expectedPersona: "lia",
          description: "Lia deve responder informações básicas da loja",
        },
        {
          name: "Questões técnicas",
          messages: [
            "Quanto cimento preciso para uma laje?",
            "Qual tijolo é melhor?",
            "Como calcular tinta?",
          ],
          expectedPersona: "ze",
          description: "Deve ser transferido para o Zé da Obra",
        },
        {
          name: "Cálculos específicos",
          messages: [
            "Preciso calcular material para uma casa de 100m²",
            "Quantos tijolos para um muro de 20m?",
          ],
          expectedPersona: "ze",
          description: "Zé da Obra deve fazer cálculos detalhados",
        },
      ],
    };
  }
}
