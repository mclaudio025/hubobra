import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { GestaoclickService } from "./gestaoclick.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@Controller("gestaoclick")
export class GestaoclickController {
  constructor(private readonly gestaoclickService: GestaoclickService) {}

  @Get("status")
  async getStatus() {
    const isConfigured = this.gestaoclickService.isConfigured();
    const health = await this.gestaoclickService.checkHealth();
    return {
      configured: isConfigured,
      health,
    };
  }

  @Post("test-order")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async testOrderSync(@Body() testOrderDto: any) {
    return await this.gestaoclickService.syncOrderToGestaoClick(testOrderDto);
  }
}
