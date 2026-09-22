import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DatabaseService } from "./database.service";
import { CustomLoggerService } from "../logging/logger.service";

export interface DatabaseHealthMetrics {
  timestamp: string;
  isHealthy: boolean;
  responseTime: number;
  connections: {
    active: number;
    idle: number;
    max: number;
    usage: number; // percentage
  };
  performance: {
    slowQueries: number;
    avgResponseTime: number;
    totalQueries: number;
  };
  storage: {
    databaseSize: string;
    totalTables: number;
    totalRecords: number;
  };
  alerts: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    value?: number;
    threshold?: number;
  }>;
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);
  private healthHistory: DatabaseHealthMetrics[] = [];
  private readonly maxHistorySize = 100; // Manter últimas 100 verificações

  constructor(
    private databaseService: DatabaseService,
    private customLogger: CustomLoggerService,
  ) {}

  // Verificação de saúde a cada 5 minutos
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthCheck() {
    try {
      const metrics = await this.collectHealthMetrics();

      // Adicionar ao histórico
      this.healthHistory.push(metrics);

      // Manter apenas as últimas verificações
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
      }

      // Log de alertas críticos
      const criticalAlerts = metrics.alerts.filter(
        (alert) => alert.severity === "critical" || alert.severity === "high",
      );

      if (criticalAlerts.length > 0) {
        for (const alert of criticalAlerts) {
          this.customLogger.logSecurityEvent(`Database Alert: ${alert.type}`, {
            severity: alert.severity,
            message: alert.message,
            value: alert.value,
            threshold: alert.threshold,
          });
        }
      }

      // Log métricas gerais
      this.customLogger.logPerformanceEvent(
        "Database Health Check",
        metrics.responseTime,
        {
          isHealthy: metrics.isHealthy,
          activeConnections: metrics.connections.active,
          connectionUsage: metrics.connections.usage,
          alertCount: metrics.alerts.length,
        },
      );
    } catch (error) {
      this.logger.error("Error during health check", error.stack);
      this.customLogger.error("Database health check failed", error.stack);
    }
  }

  // Coletar métricas de saúde
  async collectHealthMetrics(): Promise<DatabaseHealthMetrics> {
    const timestamp = new Date().toISOString();

    try {
      // Verificar conectividade básica
      const healthCheck = await this.databaseService.checkHealth();

      // Obter informações da conexão
      const dbInfo = await this.databaseService.getDatabaseInfo();

      // Obter estatísticas do banco
      const dbStats = await this.databaseService.getDatabaseStats();

      // Obter queries lentas
      const slowQueries = await this.databaseService.getSlowQueries(5);

      // Calcular métricas de conexão
      const connectionUsage =
        dbInfo.maxConnections > 0
          ? (dbInfo.activeConnections / dbInfo.maxConnections) * 100
          : 0;

      // Calcular performance
      const avgSlowQueryTime =
        slowQueries.length > 0
          ? slowQueries.reduce((sum, q) => sum + q.avgTime, 0) /
            slowQueries.length
          : 0;

      // Gerar alertas
      const alerts = this.generateAlerts({
        isHealthy: healthCheck.isHealthy,
        responseTime: healthCheck.responseTime,
        connectionUsage,
        activeConnections: dbInfo.activeConnections,
        slowQueries: slowQueries.length,
        avgSlowQueryTime,
      });

      const metrics: DatabaseHealthMetrics = {
        timestamp,
        isHealthy: healthCheck.isHealthy,
        responseTime: healthCheck.responseTime,
        connections: {
          active: dbInfo.activeConnections,
          idle: dbInfo.idleConnections,
          max: dbInfo.maxConnections,
          usage: connectionUsage,
        },
        performance: {
          slowQueries: slowQueries.length,
          avgResponseTime: avgSlowQueryTime,
          totalQueries: slowQueries.reduce((sum, q) => sum + q.calls, 0),
        },
        storage: {
          databaseSize: dbStats.databaseSize,
          totalTables: dbStats.totalTables,
          totalRecords: dbStats.totalRecords,
        },
        alerts,
      };

      return metrics;
    } catch (error) {
      // Retornar métricas de erro
      return {
        timestamp,
        isHealthy: false,
        responseTime: -1,
        connections: {
          active: 0,
          idle: 0,
          max: 0,
          usage: 0,
        },
        performance: {
          slowQueries: 0,
          avgResponseTime: 0,
          totalQueries: 0,
        },
        storage: {
          databaseSize: "Unknown",
          totalTables: 0,
          totalRecords: 0,
        },
        alerts: [
          {
            type: "connection_failed",
            severity: "critical",
            message: `Database connection failed: ${error.message}`,
          },
        ],
      };
    }
  }

  // Gerar alertas baseados nas métricas
  private generateAlerts(data: {
    isHealthy: boolean;
    responseTime: number;
    connectionUsage: number;
    activeConnections: number;
    slowQueries: number;
    avgSlowQueryTime: number;
  }): DatabaseHealthMetrics["alerts"] {
    const alerts: DatabaseHealthMetrics["alerts"] = [];

    // Alerta de conectividade
    if (!data.isHealthy) {
      alerts.push({
        type: "connection_failed",
        severity: "critical",
        message: "Database connection is not healthy",
      });
    }

    // Alerta de tempo de resposta
    if (data.responseTime > 1000) {
      alerts.push({
        type: "slow_response",
        severity: "high",
        message: "Database response time is too high",
        value: data.responseTime,
        threshold: 1000,
      });
    } else if (data.responseTime > 500) {
      alerts.push({
        type: "slow_response",
        severity: "medium",
        message: "Database response time is elevated",
        value: data.responseTime,
        threshold: 500,
      });
    }

    // Alerta de uso de conexões
    if (data.connectionUsage > 90) {
      alerts.push({
        type: "high_connection_usage",
        severity: "critical",
        message: "Database connection usage is critically high",
        value: data.connectionUsage,
        threshold: 90,
      });
    } else if (data.connectionUsage > 75) {
      alerts.push({
        type: "high_connection_usage",
        severity: "high",
        message: "Database connection usage is high",
        value: data.connectionUsage,
        threshold: 75,
      });
    }

    // Alerta de queries lentas
    if (data.slowQueries > 10) {
      alerts.push({
        type: "many_slow_queries",
        severity: "medium",
        message: "High number of slow queries detected",
        value: data.slowQueries,
        threshold: 10,
      });
    }

    // Alerta de tempo médio de query
    if (data.avgSlowQueryTime > 5000) {
      alerts.push({
        type: "very_slow_queries",
        severity: "high",
        message: "Queries are running very slowly",
        value: data.avgSlowQueryTime,
        threshold: 5000,
      });
    }

    return alerts;
  }

  // Obter métricas atuais
  async getCurrentMetrics(): Promise<DatabaseHealthMetrics> {
    return this.collectHealthMetrics();
  }

  // Obter histórico de métricas
  getHealthHistory(): DatabaseHealthMetrics[] {
    return [...this.healthHistory];
  }

  // Obter resumo de saúde
  async getHealthSummary(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    uptime: number;
    lastCheck: string;
    totalAlerts: number;
    criticalAlerts: number;
    avgResponseTime: number;
    connectionUsage: number;
  }> {
    const current = await this.getCurrentMetrics();
    const history = this.getHealthHistory();

    // Calcular tempo médio de resposta das últimas 10 verificações
    const recentHistory = history.slice(-10);
    const avgResponseTime =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, m) => sum + m.responseTime, 0) /
          recentHistory.length
        : current.responseTime;

    // Determinar status geral
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    const criticalAlerts = current.alerts.filter(
      (a) => a.severity === "critical",
    ).length;
    const highAlerts = current.alerts.filter(
      (a) => a.severity === "high",
    ).length;

    if (criticalAlerts > 0 || !current.isHealthy) {
      status = "unhealthy";
    } else if (highAlerts > 0 || current.alerts.length > 3) {
      status = "degraded";
    }

    return {
      status,
      uptime: process.uptime(),
      lastCheck: current.timestamp,
      totalAlerts: current.alerts.length,
      criticalAlerts,
      avgResponseTime,
      connectionUsage: current.connections.usage,
    };
  }

  // Limpar histórico (para testes)
  clearHistory(): void {
    this.healthHistory = [];
  }
}
