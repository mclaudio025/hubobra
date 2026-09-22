import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { HealthService } from "./health.service";
import {
  SecurityAuditService,
  SecurityEventType,
  SecuritySeverity,
} from "../security/security-audit.service";

interface HealthAlert {
  type:
    | "service_down"
    | "service_degraded"
    | "high_memory"
    | "high_cpu"
    | "slow_response";
  service: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  details: Record<string, any>;
}

@Injectable()
export class HealthMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthMonitorService.name);
  private monitoringInterval: NodeJS.Timeout;
  private readonly intervalMs = 30000; // 30 segundos
  private lastHealthStatus: any = null;
  private alertHistory: HealthAlert[] = [];
  private readonly maxAlertHistory = 100;

  constructor(
    private healthService: HealthService,
    private securityAuditService: SecurityAuditService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV !== "test") {
      this.startMonitoring();
    }
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  private startMonitoring() {
    this.logger.log("Starting health monitoring...");

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error("Error during health monitoring:", error);
      }
    }, this.intervalMs);
  }

  private stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.logger.log("Health monitoring stopped");
    }
  }

  private async performHealthCheck() {
    try {
      const currentHealth = await this.healthService.getHealthStatus();

      // Verificar mudanças de status
      if (this.lastHealthStatus) {
        await this.detectStatusChanges(this.lastHealthStatus, currentHealth);
      }

      // Verificar alertas baseados em métricas
      await this.checkMetricAlerts(currentHealth);

      // Verificar performance dos serviços
      await this.checkServicePerformance(currentHealth);

      this.lastHealthStatus = currentHealth;

      // Log apenas se houver problemas
      if (currentHealth.status !== "healthy") {
        this.logger.warn(`System health: ${currentHealth.status}`, {
          failedServices: Object.entries(currentHealth.services)
            .filter(([, service]) => service.status !== "up")
            .map(([name, service]) => ({
              name,
              status: service.status,
              error: service.error,
            })),
          checks: currentHealth.checks,
        });
      }
    } catch (error) {
      this.logger.error("Health check failed:", error);

      await this.createAlert({
        type: "service_down",
        service: "health_monitor",
        message: "Health monitoring system failed",
        severity: "critical",
        timestamp: new Date(),
        details: { error: error.message },
      });
    }
  }

  private async detectStatusChanges(previous: any, current: any) {
    for (const [serviceName, currentService] of Object.entries(
      current.services,
    )) {
      const previousService = previous.services[serviceName];

      if (
        previousService &&
        previousService.status !== (currentService as any).status
      ) {
        const severity = this.getAlertSeverity(
          serviceName,
          (currentService as any).status,
        );

        await this.createAlert({
          type:
            (currentService as any).status === "down"
              ? "service_down"
              : "service_degraded",
          service: serviceName,
          message: `Service ${serviceName} changed from ${previousService.status} to ${(currentService as any).status}`,
          severity,
          timestamp: new Date(),
          details: {
            previousStatus: previousService.status,
            currentStatus: (currentService as any).status,
            error: (currentService as any).error,
            responseTime: (currentService as any).responseTime,
          },
        });
      }
    }
  }

  private async checkMetricAlerts(health: any) {
    const { metrics } = health;

    // Verificar uso de memória
    const heapUsedPercent =
      (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (heapUsedPercent > 85) {
      await this.createAlert({
        type: "high_memory",
        service: "system",
        message: `High memory usage: ${heapUsedPercent.toFixed(1)}%`,
        severity: heapUsedPercent > 95 ? "critical" : "high",
        timestamp: new Date(),
        details: {
          heapUsedPercent: heapUsedPercent.toFixed(1),
          heapUsed: metrics.memoryUsage.heapUsed,
          heapTotal: metrics.memoryUsage.heapTotal,
        },
      });
    }

    // Verificar CPU
    const avgCpuUsage =
      metrics.cpuUsage.reduce((a, b) => a + b, 0) / metrics.cpuUsage.length;
    if (avgCpuUsage > 80) {
      await this.createAlert({
        type: "high_cpu",
        service: "system",
        message: `High CPU usage: ${avgCpuUsage.toFixed(1)}%`,
        severity: avgCpuUsage > 95 ? "critical" : "high",
        timestamp: new Date(),
        details: {
          avgCpuUsage: avgCpuUsage.toFixed(1),
          cpuUsage: metrics.cpuUsage,
          loadAverage: metrics.loadAverage,
        },
      });
    }
  }

  private async checkServicePerformance(health: any) {
    for (const [serviceName, service] of Object.entries(health.services)) {
      const responseTime = (service as any).responseTime;

      if (responseTime && responseTime > this.getSlowThreshold(serviceName)) {
        await this.createAlert({
          type: "slow_response",
          service: serviceName,
          message: `Slow response time: ${responseTime}ms`,
          severity:
            responseTime > this.getCriticalThreshold(serviceName)
              ? "critical"
              : "medium",
          timestamp: new Date(),
          details: {
            responseTime,
            threshold: this.getSlowThreshold(serviceName),
            status: (service as any).status,
          },
        });
      }
    }
  }

  private async createAlert(alert: HealthAlert) {
    // Adicionar ao histórico
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory);
    }

    // Log do alerta
    const logLevel =
      alert.severity === "critical"
        ? "error"
        : alert.severity === "high"
          ? "warn"
          : "debug";

    this.logger[logLevel](`Health Alert: ${alert.message}`, {
      type: alert.type,
      service: alert.service,
      severity: alert.severity,
      details: alert.details,
    });

    // Registrar no sistema de auditoria de segurança se for crítico
    if (alert.severity === "critical") {
      await this.securityAuditService.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.HIGH,
        ip: "system",
        details: {
          alertType: alert.type,
          service: alert.service,
          message: alert.message,
          healthAlert: true,
          ...alert.details,
        },
      });
    }

    // Aqui você pode implementar notificações externas
    // await this.sendSlackNotification(alert);
    // await this.sendEmailAlert(alert);
  }

  private getAlertSeverity(
    serviceName: string,
    status: string,
  ): "low" | "medium" | "high" | "critical" {
    if (status === "down") {
      // Serviços críticos
      if (["database", "redis"].includes(serviceName)) {
        return "critical";
      }
      return "high";
    }

    if (status === "degraded") {
      return "medium";
    }

    return "low";
  }

  private getSlowThreshold(serviceName: string): number {
    const thresholds = {
      database: 1000, // 1 segundo
      redis: 500, // 500ms
      fileSystem: 200, // 200ms
      externalAPIs: 2000, // 2 segundos
      memory: 100, // 100ms
      disk: 300, // 300ms
    };

    return thresholds[serviceName] || 1000;
  }

  private getCriticalThreshold(serviceName: string): number {
    return this.getSlowThreshold(serviceName) * 3;
  }

  // Métodos públicos para consulta
  getAlertHistory(limit = 50): HealthAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  getAlertStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);

    const recent24h = this.alertHistory.filter(
      (alert) => alert.timestamp >= last24h,
    );
    const recent1h = this.alertHistory.filter(
      (alert) => alert.timestamp >= last1h,
    );

    return {
      total: this.alertHistory.length,
      last24h: recent24h.length,
      last1h: recent1h.length,
      bySeverity: {
        critical: this.alertHistory.filter((a) => a.severity === "critical")
          .length,
        high: this.alertHistory.filter((a) => a.severity === "high").length,
        medium: this.alertHistory.filter((a) => a.severity === "medium").length,
        low: this.alertHistory.filter((a) => a.severity === "low").length,
      },
      byType: this.alertHistory.reduce(
        (acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
