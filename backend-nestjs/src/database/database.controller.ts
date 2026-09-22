import { Controller, Get, Post, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { DatabaseService } from "./database.service";
import { DatabaseHealthService } from "./database-health.service";

@Controller("database")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DatabaseController {
  constructor(
    private databaseService: DatabaseService,
    private databaseHealthService: DatabaseHealthService,
  ) {}

  @Get("info")
  async getDatabaseInfo() {
    return this.databaseService.getDatabaseInfo();
  }

  @Get("stats")
  async getDatabaseStats() {
    return this.databaseService.getDatabaseStats();
  }

  @Get("health")
  async getHealth() {
    return this.databaseService.checkHealth();
  }

  @Get("health/metrics")
  async getHealthMetrics() {
    return this.databaseHealthService.getCurrentMetrics();
  }

  @Get("health/history")
  async getHealthHistory() {
    return this.databaseHealthService.getHealthHistory();
  }

  @Get("health/summary")
  async getHealthSummary() {
    return this.databaseHealthService.getHealthSummary();
  }

  @Get("slow-queries")
  async getSlowQueries(@Query("limit") limit?: string) {
    const queryLimit = limit ? parseInt(limit, 10) : 10;
    return this.databaseService.getSlowQueries(queryLimit);
  }

  @Post("backup")
  async createBackup() {
    return this.databaseService.createBackup();
  }

  @Post("optimize")
  async optimizeDatabase() {
    return this.databaseService.optimizeDatabase();
  }

  @Get("dashboard")
  async getDashboardData() {
    const [info, stats, health, summary, slowQueries] = await Promise.all([
      this.databaseService.getDatabaseInfo(),
      this.databaseService.getDatabaseStats(),
      this.databaseService.checkHealth(),
      this.databaseHealthService.getHealthSummary(),
      this.databaseService.getSlowQueries(5),
    ]);

    return {
      info,
      stats,
      health,
      summary,
      slowQueries,
      timestamp: new Date().toISOString(),
    };
  }
}
