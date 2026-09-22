import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  DATA_EXPORT = "DATA_EXPORT",
  ADMIN_ACTION = "ADMIN_ACTION",
  API_KEY_USED = "API_KEY_USED",
  CORS_VIOLATION = "CORS_VIOLATION",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ip: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private prisma: PrismaService) {}

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log no console para desenvolvimento
      this.logger.warn(`Security Event: ${event.type}`, {
        severity: event.severity,
        userId: event.userId,
        ip: event.ip,
        details: event.details,
      });

      // Salvar no banco de dados
      await this.prisma.securityLog.create({
        data: {
          event: event.type,
          severity: event.severity,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          details: JSON.stringify(event.details),
          timestamp: event.timestamp || new Date(),
        },
      });

      // Alertas para eventos críticos
      if (event.severity === SecuritySeverity.CRITICAL) {
        await this.handleCriticalEvent(event);
      }
    } catch (error) {
      this.logger.error("Failed to log security event:", error);
    }
  }

  async logLoginAttempt(
    success: boolean,
    email: string,
    ip: string,
    userAgent?: string,
    userId?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: success
        ? SecurityEventType.LOGIN_SUCCESS
        : SecurityEventType.LOGIN_FAILED,
      severity: success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM,
      userId,
      ip,
      userAgent,
      details: {
        email,
        success,
      },
    });
  }

  async logRateLimitExceeded(
    route: string,
    ip: string,
    userAgent?: string,
    userId?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ip,
      userAgent,
      details: {
        route,
        message: "Rate limit exceeded",
      },
    });
  }

  async logUnauthorizedAccess(
    route: string,
    ip: string,
    userAgent?: string,
    userId?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.HIGH,
      userId,
      ip,
      userAgent,
      details: {
        route,
        message: "Unauthorized access attempt",
      },
    });
  }

  async logCorsViolation(
    origin: string,
    ip: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.CORS_VIOLATION,
      severity: SecuritySeverity.MEDIUM,
      ip,
      userAgent,
      details: {
        origin,
        message: "CORS policy violation",
      },
    });
  }

  async logAdminAction(
    action: string,
    userId: string,
    ip: string,
    details: Record<string, any>,
    userAgent?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.ADMIN_ACTION,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ip,
      userAgent,
      details: {
        action,
        ...details,
      },
    });
  }

  async getSecurityLogs(
    page = 1,
    limit = 50,
    severity?: SecuritySeverity,
    eventType?: SecurityEventType,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (severity) where.severity = severity;
    if (eventType) where.event = eventType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      }),
      this.prisma.securityLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        details: JSON.parse(log.details || "{}"),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSecurityStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      last24hEvents,
      last7dEvents,
      criticalEvents,
      eventsByType,
      eventsBySeverity,
    ] = await Promise.all([
      this.prisma.securityLog.count(),
      this.prisma.securityLog.count({
        where: { timestamp: { gte: last24h } },
      }),
      this.prisma.securityLog.count({
        where: { timestamp: { gte: last7d } },
      }),
      this.prisma.securityLog.count({
        where: { severity: SecuritySeverity.CRITICAL },
      }),
      this.prisma.securityLog.groupBy({
        by: ["event"],
        _count: { event: true },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      this.prisma.securityLog.groupBy({
        by: ["severity"],
        _count: { severity: true },
      }),
    ]);

    return {
      totalEvents,
      last24hEvents,
      last7dEvents,
      criticalEvents,
      eventsByType: eventsByType.map((item) => ({
        type: item.event,
        count: item._count.event,
      })),
      eventsBySeverity: eventsBySeverity.map((item) => ({
        severity: item.severity,
        count: item._count.severity,
      })),
    };
  }

  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // Implementar alertas para eventos críticos
    // Por exemplo: enviar email, notificação Slack, etc.
    this.logger.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, event);

    // Aqui você pode implementar:
    // - Envio de email para administradores
    // - Notificação para Slack/Discord
    // - Bloqueio automático de IP
    // - Etc.
  }
}
