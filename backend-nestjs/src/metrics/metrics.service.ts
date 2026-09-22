import { Injectable } from "@nestjs/common";
import { CustomLoggerService } from "../logging/logger.service";

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    formatted: {
      used: string;
      total: string;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  requests: {
    total: number;
    perMinute: number;
    errors: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queries: number;
    avgResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  uploads: {
    total: number;
    totalSize: number;
    avgSize: number;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private requestTimes: number[] = [];
  private dbQueryTimes: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private uploadCount = 0;
  private uploadSizeTotal = 0;

  // Armazenar métricas dos últimos 60 minutos
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistorySize = 60;

  constructor(private logger: CustomLoggerService) {
    // Coletar métricas a cada minuto
    setInterval(() => {
      this.collectMetrics();
    }, 60000);
  }

  // Incrementar contadores
  incrementRequestCount(): void {
    this.requestCount++;
  }

  incrementErrorCount(): void {
    this.errorCount++;
  }

  recordRequestTime(time: number): void {
    this.requestTimes.push(time);
    // Manter apenas os últimos 1000 tempos
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }
  }

  recordDbQueryTime(time: number): void {
    this.dbQueryTimes.push(time);
    if (this.dbQueryTimes.length > 1000) {
      this.dbQueryTimes = this.dbQueryTimes.slice(-1000);
    }
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  recordUpload(size: number): void {
    this.uploadCount++;
    this.uploadSizeTotal += size;
  }

  // Obter métricas atuais do sistema
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require("os").totalmem();
    const loadAverage = require("os").loadavg();

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: totalMemory,
        percentage: (memoryUsage.heapUsed / totalMemory) * 100,
        formatted: {
          used: this.formatBytes(memoryUsage.heapUsed),
          total: this.formatBytes(totalMemory),
        },
      },
      cpu: {
        usage: this.getCpuUsage(),
        loadAverage,
      },
      requests: {
        total: this.requestCount,
        perMinute: this.getRequestsPerMinute(),
        errors: this.errorCount,
        errorRate:
          this.requestCount > 0
            ? (this.errorCount / this.requestCount) * 100
            : 0,
      },
      database: {
        connections: await this.getDatabaseConnections(),
        queries: this.dbQueryTimes.length,
        avgResponseTime: this.getAverageDbResponseTime(),
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate:
          this.getTotalCacheOperations() > 0
            ? (this.cacheHits / this.getTotalCacheOperations()) * 100
            : 0,
      },
      uploads: {
        total: this.uploadCount,
        totalSize: this.uploadSizeTotal,
        avgSize:
          this.uploadCount > 0 ? this.uploadSizeTotal / this.uploadCount : 0,
      },
    };

    return metrics;
  }

  // Obter histórico de métricas
  getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  // Obter métricas específicas para alertas
  async getAlertMetrics(): Promise<{
    highMemoryUsage: boolean;
    highErrorRate: boolean;
    slowResponseTime: boolean;
    lowCacheHitRate: boolean;
  }> {
    const current = await this.getCurrentMetrics();

    return {
      highMemoryUsage: current.memory.percentage > 80,
      highErrorRate: current.requests.errorRate > 5,
      slowResponseTime: this.getAverageResponseTime() > 1000,
      lowCacheHitRate: current.cache.hitRate < 70,
    };
  }

  // Coletar e armazenar métricas
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.getCurrentMetrics();

      // Adicionar ao histórico
      this.metricsHistory.push(metrics);

      // Manter apenas as últimas N métricas
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      // Log das métricas para monitoramento
      this.logger.logPerformanceEvent("System Metrics Collected", 0, {
        memoryUsage: metrics.memory.percentage,
        errorRate: metrics.requests.errorRate,
        cacheHitRate: metrics.cache.hitRate,
        avgResponseTime: this.getAverageResponseTime(),
      });

      // Verificar alertas
      const alerts = await this.getAlertMetrics();
      if (alerts.highMemoryUsage) {
        this.logger.warn("High memory usage detected", {
          memoryUsage: metrics.memory.percentage,
        });
      }

      if (alerts.highErrorRate) {
        this.logger.warn("High error rate detected", {
          errorRate: metrics.requests.errorRate,
        });
      }
    } catch (error) {
      this.logger.error("Error collecting metrics", error.stack);
    }
  }

  private getCpuUsage(): number {
    // Implementação simplificada - em produção usar bibliotecas específicas
    return require("os").loadavg()[0];
  }

  private getRequestsPerMinute(): number {
    // Calcular baseado no uptime e total de requests
    const uptimeMinutes = process.uptime() / 60;
    return uptimeMinutes > 0 ? this.requestCount / uptimeMinutes : 0;
  }

  private async getDatabaseConnections(): Promise<number> {
    // Em produção, isso seria obtido do pool de conexões do Prisma
    return 5; // Valor mock
  }

  private getAverageDbResponseTime(): number {
    if (this.dbQueryTimes.length === 0) return 0;
    const sum = this.dbQueryTimes.reduce((a, b) => a + b, 0);
    return sum / this.dbQueryTimes.length;
  }

  private getAverageResponseTime(): number {
    if (this.requestTimes.length === 0) return 0;
    const sum = this.requestTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestTimes.length;
  }

  private getTotalCacheOperations(): number {
    return this.cacheHits + this.cacheMisses;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Resetar métricas (útil para testes)
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.requestTimes = [];
    this.dbQueryTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.uploadCount = 0;
    this.uploadSizeTotal = 0;
    this.metricsHistory = [];
  }

  // Exportar métricas para sistemas externos (Prometheus, etc.)
  async exportMetrics(): Promise<string> {
    const metrics = await this.getCurrentMetrics();

    // Formato Prometheus
    return `
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes ${metrics.memory.used}

# HELP nodejs_requests_total Total number of requests
# TYPE nodejs_requests_total counter
nodejs_requests_total ${metrics.requests.total}

# HELP nodejs_request_errors_total Total number of request errors
# TYPE nodejs_request_errors_total counter
nodejs_request_errors_total ${metrics.requests.errors}

# HELP nodejs_cache_hits_total Total number of cache hits
# TYPE nodejs_cache_hits_total counter
nodejs_cache_hits_total ${metrics.cache.hits}

# HELP nodejs_cache_misses_total Total number of cache misses
# TYPE nodejs_cache_misses_total counter
nodejs_cache_misses_total ${metrics.cache.misses}

# HELP nodejs_uploads_total Total number of uploads
# TYPE nodejs_uploads_total counter
nodejs_uploads_total ${metrics.uploads.total}
    `.trim();
  }
}
