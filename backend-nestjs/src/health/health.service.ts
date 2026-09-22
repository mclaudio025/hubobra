import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";
import * as os from "os";
import * as fs from "fs/promises";

export interface ServiceHealth {
  status: "up" | "down" | "degraded";
  responseTime?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number[];
  uptime: number;
  platform: string;
  nodeVersion: string;
  processId: number;
  activeHandles: number;
  freeMemory: number;
  totalMemory: number;
  loadAverage: number[];
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    fileSystem: ServiceHealth;
    externalAPIs: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
  metrics: SystemMetrics;
  checks: {
    total: number;
    passed: number;
    failed: number;
    degraded: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly version = process.env.npm_package_version || "1.0.0";
  private readonly environment = process.env.NODE_ENV || "development";

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    this.logger.debug("Starting health check...");

    // Executar todos os checks em paralelo
    const [database, redis, fileSystem, externalAPIs, memory, disk] =
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkFileSystem(),
        this.checkExternalAPIs(),
        this.checkMemory(),
        this.checkDisk(),
      ]);

    const services = {
      database: this.mapResult(database),
      redis: this.mapResult(redis),
      fileSystem: this.mapResult(fileSystem),
      externalAPIs: this.mapResult(externalAPIs),
      memory: this.mapResult(memory),
      disk: this.mapResult(disk),
    };

    const checks = this.calculateChecks(services);
    const overallStatus = this.calculateOverallStatus(services);
    const metrics = await this.getSystemMetrics();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.version,
      environment: this.environment,
      services,
      metrics,
      checks,
    };

    const totalTime = Date.now() - startTime;
    this.logger.debug(
      `Health check completed in ${totalTime}ms - Status: ${overallStatus}`,
    );

    return healthStatus;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Teste básico de conexão
      await this.prisma.$queryRaw`SELECT 1 as test`;

      // Teste de performance - contar usuários
      const userCount = await this.prisma.user.count();

      // Teste de escrita (se necessário)
      // await this.prisma.$queryRaw`SELECT pg_is_in_recovery()`;

      const responseTime = Date.now() - start;

      return {
        status: responseTime < 1000 ? "up" : "degraded",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          userCount,
          connectionPool: "active",
          query: "SELECT 1",
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: {
          errorCode: error.code,
          errorType: error.constructor.name,
        },
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Teste de escrita/leitura
      const testKey = "health-check";
      const testValue = `test-${Date.now()}`;

      await this.cacheService.set(testKey, testValue, { ttl: 10 });
      const result = await this.cacheService.get(testKey);

      if (result !== testValue) {
        throw new Error("Redis read/write test failed");
      }

      // Limpar chave de teste
      await this.cacheService.del(testKey);

      // Obter estatísticas do Redis
      const stats = await this.cacheService.getStats();

      const responseTime = Date.now() - start;

      return {
        status: responseTime < 500 ? "up" : "degraded",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          stats,
          testKey,
          operation: "set/get/del",
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: {
          operation: "redis-test",
          errorType: error.constructor.name,
        },
      };
    }
  }

  private async checkFileSystem(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const uploadsDir = process.env.UPLOAD_DEST || "./uploads";

      // Verificar se diretório existe e é acessível
      await fs.access(uploadsDir, fs.constants.W_OK | fs.constants.R_OK);

      // Teste de escrita
      const testFile = `${uploadsDir}/health-check-${Date.now()}.tmp`;
      const testContent = "health check test";

      await fs.writeFile(testFile, testContent);
      const readContent = await fs.readFile(testFile, "utf8");

      if (readContent !== testContent) {
        throw new Error("File system read/write test failed");
      }

      // Limpar arquivo de teste
      await fs.unlink(testFile);

      // Obter informações do diretório
      const stats = await fs.stat(uploadsDir);

      const responseTime = Date.now() - start;

      return {
        status: responseTime < 200 ? "up" : "degraded",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          uploadsDir,
          permissions: "read/write",
          created: stats.birthtime,
          operation: "write/read/delete",
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: {
          operation: "filesystem-test",
          errorType: error.constructor.name,
        },
      };
    }
  }

  private async checkExternalAPIs(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Aqui você pode adicionar checks para APIs externas
      // Por exemplo: APIs de pagamento, correios, etc.

      // Simulação de check de API externa
      const checks = await Promise.allSettled([
        // this.checkPaymentAPI(),
        // this.checkShippingAPI(),
        // this.checkEmailAPI(),
        Promise.resolve({ status: "up", service: "mock" }),
      ]);

      const failedChecks = checks.filter(
        (check) => check.status === "rejected",
      ).length;
      const responseTime = Date.now() - start;

      return {
        status:
          failedChecks === 0
            ? "up"
            : failedChecks < checks.length
              ? "degraded"
              : "down",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          totalChecks: checks.length,
          failedChecks,
          services: ["payment", "shipping", "email"],
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Calcular percentuais
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const systemMemoryPercent = (usedMemory / totalMemory) * 100;

      // Determinar status baseado no uso de memória
      let status: "up" | "degraded" | "down" = "up";
      if (heapUsedPercent > 90 || systemMemoryPercent > 90) {
        status = "down";
      } else if (heapUsedPercent > 75 || systemMemoryPercent > 75) {
        status = "degraded";
      }

      const responseTime = Date.now() - start;

      return {
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          heap: {
            used: memUsage.heapUsed,
            total: memUsage.heapTotal,
            percent: Math.round(heapUsedPercent),
          },
          system: {
            used: usedMemory,
            total: totalMemory,
            free: freeMemory,
            percent: Math.round(systemMemoryPercent),
          },
          rss: memUsage.rss,
          external: memUsage.external,
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkDisk(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const uploadsDir = process.env.UPLOAD_DEST || "./uploads";

      // No Node.js, não temos uma forma nativa de verificar espaço em disco
      // Vamos simular com informações básicas do sistema
      const stats = await fs.stat(uploadsDir);

      // Verificar se conseguimos criar um arquivo temporário
      const testFile = `${uploadsDir}/disk-check-${Date.now()}.tmp`;
      await fs.writeFile(testFile, "disk check");
      await fs.unlink(testFile);

      const responseTime = Date.now() - start;

      return {
        status: "up",
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          uploadsDir,
          accessible: true,
          writable: true,
          lastModified: stats.mtime,
        },
      };
    } catch (error) {
      return {
        status: "down",
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const cpuUsage = os.cpus().map((cpu) => {
      const total = Object.values(cpu.times).reduce(
        (acc, time) => acc + time,
        0,
      );
      return ((cpu.times.user + cpu.times.nice + cpu.times.sys) / total) * 100;
    });

    return {
      memoryUsage: memUsage,
      cpuUsage,
      uptime: process.uptime(),
      platform: os.platform(),
      nodeVersion: process.version,
      processId: process.pid,
      activeHandles: (process as any)._getActiveHandles().length,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      loadAverage: os.loadavg(),
    };
  }

  private mapResult(
    result: PromiseSettledResult<ServiceHealth>,
  ): ServiceHealth {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      status: "down",
      lastCheck: new Date().toISOString(),
      error: result.reason?.message || "Unknown error",
      details: {
        errorType: result.reason?.constructor?.name || "UnknownError",
      },
    };
  }

  private calculateChecks(services: Record<string, ServiceHealth>) {
    const statuses = Object.values(services).map((s) => s.status);

    return {
      total: statuses.length,
      passed: statuses.filter((s) => s === "up").length,
      failed: statuses.filter((s) => s === "down").length,
      degraded: statuses.filter((s) => s === "degraded").length,
    };
  }

  private calculateOverallStatus(
    services: Record<string, ServiceHealth>,
  ): "healthy" | "unhealthy" | "degraded" {
    const statuses = Object.values(services).map((s) => s.status);

    // Se todos os serviços estão funcionando
    if (statuses.every((s) => s === "up")) {
      return "healthy";
    }

    // Se algum serviço crítico está down
    if (services.database.status === "down") {
      return "unhealthy";
    }

    // Se há serviços down mas não críticos, ou serviços degraded
    if (
      statuses.some((s) => s === "down") ||
      statuses.some((s) => s === "degraded")
    ) {
      return "degraded";
    }

    return "healthy";
  }

  // Método para health check simples (liveness probe)
  async isAlive(): Promise<boolean> {
    try {
      // Check básico - se o processo está rodando
      return process.uptime() > 0;
    } catch {
      return false;
    }
  }

  // Método para readiness check
  async isReady(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status !== "unhealthy";
    } catch {
      return false;
    }
  }
}
