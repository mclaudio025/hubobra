import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { HealthMonitorService } from "./health-monitor.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("health")
@Controller("health/alerts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@ApiBearerAuth()
export class HealthAlertsController {
  constructor(private readonly healthMonitorService: HealthMonitorService) {}

  @Get()
  @ApiOperation({ summary: "Obter histórico de alertas de saúde" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Histórico de alertas" })
  async getAlerts(
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
  ): Promise<any> {
    return {
      alerts: this.healthMonitorService.getAlertHistory(limit),
      stats: this.healthMonitorService.getAlertStats(),
    };
  }

  @Get("stats")
  @ApiOperation({ summary: "Obter estatísticas de alertas" })
  @ApiResponse({ status: 200, description: "Estatísticas de alertas" })
  async getAlertStats() {
    return this.healthMonitorService.getAlertStats();
  }
}
