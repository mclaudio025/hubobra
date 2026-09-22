import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CustomLoggerService } from "../logging/logger.service";
import { Prisma } from "@prisma/client";

export interface DatabaseInfo {
  version: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
}

export interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  tableStats: Array<{
    tableName: string;
    recordCount: number;
    size: string;
  }>;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private customLogger: CustomLoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log("✅ Database connected successfully");

      // Log informações da conexão
      const dbInfo = await this.getDatabaseInfo();
      this.customLogger.log("Database connection established", {
        type: "database",
        host: dbInfo.host,
        database: dbInfo.database,
        version: dbInfo.version,
      });
    } catch (error) {
      this.logger.error("❌ Failed to connect to database", error.stack);
      this.customLogger.error("Database connection failed", error.stack, {
        type: "database",
        error: error.message,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log("Database disconnected");
  }

  // Obter informações da conexão
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    try {
      const databaseUrl = this.configService.get<string>("DATABASE_URL");
      const isSQLite = databaseUrl?.startsWith("file:");

      if (isSQLite) {
        return {
          version: "SQLite 3.x",
          host: "localhost",
          port: 0,
          database: "dev.db",
          user: "local",
          ssl: false,
          maxConnections: 1,
          activeConnections: 1,
          idleConnections: 0,
        };
      }

      const versionResult = await this.prisma.$queryRaw<
        Array<{ version: string }>
      >`
        SELECT version() as version
      `;

      const connectionResult = await this.prisma.$queryRaw<
        Array<{
          host?: string;
          port?: number;
          database?: string;
          user?: string;
          ssl?: boolean;
        }>
      >`
        SELECT 
          inet_server_addr() as host,
          inet_server_port() as port,
          current_database() as database,
          current_user as user,
          CASE WHEN ssl IS NOT NULL THEN true ELSE false END as ssl
        FROM pg_stat_ssl 
        WHERE pid = pg_backend_pid()
        LIMIT 1
      `;

      const statsResult = await this.prisma.$queryRaw<
        Array<{
          max_connections?: number;
          active_connections?: number;
          idle_connections?: number;
        }>
      >`
        SELECT 
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections
      `;

      const connection = connectionResult[0] || {};
      const stats = statsResult[0] || {};

      return {
        version: versionResult[0]?.version || "Unknown",
        host: connection.host || "localhost",
        port: connection.port || 5432,
        database: connection.database || "unknown",
        user: connection.user || "unknown",
        ssl: connection.ssl || false,
        maxConnections: stats.max_connections || 0,
        activeConnections: stats.active_connections || 0,
        idleConnections: stats.idle_connections || 0,
      };
    } catch (error) {
      this.logger.error("Error getting database info", error.stack);
      throw error;
    }
  }

  // Obter estatísticas do banco
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Total de tabelas (SQLite compatible)
      const tablesResult = await this.prisma.$queryRaw<
        Array<{ count: number }>
      >(
        Prisma.sql`SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
      );

      // Tamanho do banco (SQLite - retorna em bytes)
      const sizeResult = await this.prisma.$queryRaw<Array<{ size: number }>>(
        Prisma.sql`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`,
      );

      // Estatísticas por tabela (SQLite compatible)
      const tableStatsResult = await this.prisma.$queryRaw<
        Array<{
          table_name: string;
          row_count: number;
          size: string;
        }>
      >(
        Prisma.sql`SELECT name as table_name, 0 as row_count, '0 bytes' as size FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 20`,
      );

      // Contar registros totais (aproximado)
      let totalRecords = 0;
      for (const table of tableStatsResult) {
        totalRecords += Number(table.row_count);
      }

      // Formatar tamanho do banco de bytes para string legível
      const sizeInBytes = Number(sizeResult[0]?.size || 0);
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 bytes";
        const k = 1024;
        const sizes = ["bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      return {
        totalTables: Number(tablesResult[0]?.count || 0),
        totalRecords,
        databaseSize: formatBytes(sizeInBytes),
        tableStats: tableStatsResult.map((table) => ({
          tableName: table.table_name,
          recordCount: Number(table.row_count),
          size: table.size,
        })),
      };
    } catch (error) {
      this.logger.error("Error getting database stats", error.stack);
      throw error;
    }
  }

  // Verificar saúde da conexão
  async checkHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: false,
        responseTime,
        error: error.message,
      };
    }
  }

  // Executar query personalizada com log
  async executeQuery<T = any>(
    query: string,
    params: any[] = [],
    userId?: string,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await this.prisma.$queryRawUnsafe<T>(query, ...params);
      const duration = Date.now() - startTime;

      // Log da query
      this.customLogger.logDatabaseQuery(query, duration, {
        userId,
        paramsCount: params.length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.customLogger.error("Database query failed", error.stack, {
        type: "database",
        query: query.substring(0, 200),
        duration,
        userId,
        error: error.message,
      });

      throw error;
    }
  }

  // Backup programático (para desenvolvimento)
  async createBackup(): Promise<{
    success: boolean;
    filename?: string;
    size?: number;
    error?: string;
  }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup_${timestamp}.json`;

      // Para desenvolvimento, vamos fazer um backup JSON das tabelas principais
      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        data: {
          users: await this.prisma.user.findMany(),
          categories: await this.prisma.category.findMany(),
          products: await this.prisma.product.findMany({
            include: {
              images: true,
              attributes: true,
            },
          }),
          orders: await this.prisma.order.findMany({
            include: {
              items: true,
              shippingAddress: true,
              payment: true,
            },
          }),
          settings: await this.prisma.setting.findMany(),
        },
      };

      const fs = require("fs");
      const path = require("path");

      const backupsDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const filepath = path.join(backupsDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

      const stats = fs.statSync(filepath);

      this.customLogger.logBusinessEvent("Database Backup Created", {
        filename,
        size: stats.size,
        tables: Object.keys(backup.data).length,
      });

      return {
        success: true,
        filename,
        size: stats.size,
      };
    } catch (error) {
      this.logger.error("Error creating backup", error.stack);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Otimizar banco (VACUUM, ANALYZE)
  async optimizeDatabase(): Promise<{
    success: boolean;
    operations: string[];
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      // VACUUM para recuperar espaço
      await this.prisma.$executeRaw`VACUUM`;
      operations.push("VACUUM");

      // ANALYZE para atualizar estatísticas
      await this.prisma.$executeRaw`ANALYZE`;
      operations.push("ANALYZE");

      // REINDEX para otimizar índices (apenas em desenvolvimento)
      if (process.env.NODE_ENV === "development") {
        await this.prisma.$executeRaw`REINDEX DATABASE CONCURRENTLY`;
        operations.push("REINDEX");
      }

      const duration = Date.now() - startTime;

      this.customLogger.logBusinessEvent("Database Optimized", {
        operations,
        duration,
      });

      return {
        success: true,
        operations,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error("Error optimizing database", error.stack);

      return {
        success: false,
        operations,
        duration,
        error: error.message,
      };
    }
  }

  // Monitorar queries lentas
  async getSlowQueries(limit: number = 10): Promise<
    Array<{
      query: string;
      calls: number;
      totalTime: number;
      avgTime: number;
      rows: number;
    }>
  > {
    try {
      const result = await this.prisma.$queryRaw<
        Array<{
          query: string;
          calls: bigint;
          total_time: number;
          mean_time: number;
          rows: bigint;
        }>
      >`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        ORDER BY mean_time DESC 
        LIMIT ${limit}
      `;

      return result.map((row) => ({
        query: row.query,
        calls: Number(row.calls),
        totalTime: row.total_time,
        avgTime: row.mean_time,
        rows: Number(row.rows),
      }));
    } catch (error) {
      // pg_stat_statements pode não estar habilitado
      this.logger.warn(
        "pg_stat_statements not available for slow query monitoring",
      );
      return [];
    }
  }
}
