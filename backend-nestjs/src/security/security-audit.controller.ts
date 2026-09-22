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
import {
  SecurityAuditService,
  SecuritySeverity,
  SecurityEventType,
} from "./security-audit.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums";

@ApiTags("security")
@Controller("security")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class SecurityAuditController {
  constructor(private readonly securityAuditService: SecurityAuditService) {}

  @Get("logs")
  @ApiOperation({ summary: "Obter logs de segurança" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "severity", required: false, enum: SecuritySeverity })
  @ApiQuery({ name: "eventType", required: false, enum: SecurityEventType })
  @ApiQuery({ name: "userId", required: false, type: String })
  @ApiResponse({ status: 200, description: "Lista de logs de segurança" })
  async getSecurityLogs(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
    @Query("severity") severity?: SecuritySeverity,
    @Query("eventType") eventType?: SecurityEventType,
    @Query("userId") userId?: string,
  ) {
    return this.securityAuditService.getSecurityLogs(
      page,
      limit,
      severity,
      eventType,
      userId,
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Obter estatísticas de segurança" })
  @ApiResponse({ status: 200, description: "Estatísticas de segurança" })
  async getSecurityStats() {
    return this.securityAuditService.getSecurityStats();
  }
}
