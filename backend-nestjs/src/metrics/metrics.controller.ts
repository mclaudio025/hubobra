import { Controller, Get, UseGuards } from "@nestjs/common";
import { MetricsService, SystemMetrics } from "./metrics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@Controller("metrics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  async getCurrentMetrics(): Promise<SystemMetrics> {
    return this.metricsService.getCurrentMetrics();
  }

  @Get("history")
  getMetricsHistory(): SystemMetrics[] {
    return this.metricsService.getMetricsHistory();
  }

  @Get("alerts")
  async getAlerts(): Promise<{
    highMemoryUsage: boolean;
    highErrorRate: boolean;
    slowResponseTime: boolean;
    lowCacheHitRate: boolean;
  }> {
    return this.metricsService.getAlertMetrics();
  }

  @Get("export")
  async exportMetrics(): Promise<string> {
    return this.metricsService.exportMetrics();
  }

  @Get("dashboard")
  async getDashboardData(): Promise<{
    current: SystemMetrics;
    history: SystemMetrics[];
    alerts: any;
    summary: {
      totalRequests: number;
      errorRate: number;
      avgResponseTime: number;
      uptime: string;
    };
  }> {
    const current = await this.metricsService.getCurrentMetrics();
    const history = this.metricsService.getMetricsHistory();
    const alerts = await this.metricsService.getAlertMetrics();

    return {
      current,
      history,
      alerts,
      summary: {
        totalRequests: current.requests.total,
        errorRate: current.requests.errorRate,
        avgResponseTime: current.database.avgResponseTime,
        uptime: this.formatUptime(current.uptime),
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
