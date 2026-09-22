import { Module } from "@nestjs/common";
import { SecurityAuditService } from "./security-audit.service";
import { SecurityAuditController } from "./security-audit.controller";
import { CustomThrottlerGuard } from "./custom-throttler.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SecurityAuditController],
  providers: [SecurityAuditService, CustomThrottlerGuard],
  exports: [SecurityAuditService, CustomThrottlerGuard],
})
export class SecurityModule {}
