import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthAlertsController } from "./health-alerts.controller";
import { HealthService } from "./health.service";
import { HealthMonitorService } from "./health-monitor.service";
import { HealthLoggerMiddleware } from "./health-logger.middleware";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [PrismaModule, CacheModule, SecurityModule],
  controllers: [HealthController, HealthAlertsController],
  providers: [HealthService, HealthMonitorService, HealthLoggerMiddleware],
  exports: [HealthService, HealthMonitorService],
})
export class HealthModule {}
