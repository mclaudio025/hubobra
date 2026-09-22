import { Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";
import * as path from "path";

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    // Criar diretório de logs se não existir
    const logsDir = path.join(process.cwd(), "logs");
    require("fs").mkdirSync(logsDir, { recursive: true });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
          });
        }),
      ),
      transports: [
        // Console para desenvolvimento
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : "";
              return `${timestamp} [${level}] ${message} ${metaStr}`;
            }),
          ),
        }),

        // Arquivo para erros
        new winston.transports.File({
          filename: path.join(logsDir, "error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),

        // Arquivo para todos os logs
        new winston.transports.File({
          filename: path.join(logsDir, "combined.log"),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),

        // Arquivo específico para eventos de segurança
        new winston.transports.File({
          filename: path.join(logsDir, "security.log"),
          level: "warn",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.printf((info) => {
              if (info.type === "security") {
                return JSON.stringify(info);
              }
              return "";
            }),
          ),
        }),

        // Arquivo para eventos de negócio
        new winston.transports.File({
          filename: path.join(logsDir, "business.log"),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.printf((info) => {
              if (info.type === "business") {
                return JSON.stringify(info);
              }
              return "";
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, {
      trace,
      stack: trace,
      ...context,
    });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // Métodos específicos para diferentes tipos de log
  logRequest(req: any, res: any, responseTime: number) {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
      requestId: req.id,
    };

    if (res.statusCode >= 400) {
      this.error(
        `HTTP ${res.statusCode} - ${req.method} ${req.url}`,
        null,
        context,
      );
    } else {
      this.log(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, context);
    }
  }

  logSecurityEvent(event: string, context: LogContext) {
    this.logger.warn(`Security Event: ${event}`, {
      ...context,
      type: "security",
      severity: "high",
    });
  }

  logBusinessEvent(event: string, context: LogContext) {
    this.logger.info(`Business Event: ${event}`, {
      ...context,
      type: "business",
    });
  }

  logPerformanceEvent(event: string, duration: number, context?: LogContext) {
    this.logger.info(`Performance: ${event}`, {
      ...context,
      type: "performance",
      duration,
      unit: "ms",
    });
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.logger.debug("Database Query", {
      ...context,
      type: "database",
      query: query.substring(0, 200), // Limitar tamanho da query no log
      duration,
      unit: "ms",
    });
  }

  logCacheEvent(
    event: "hit" | "miss" | "set" | "delete",
    key: string,
    context?: LogContext,
  ) {
    this.logger.debug(`Cache ${event.toUpperCase()}: ${key}`, {
      ...context,
      type: "cache",
      cacheKey: key,
      event,
    });
  }

  logAuthEvent(event: string, userId?: string, context?: LogContext) {
    this.logger.info(`Auth Event: ${event}`, {
      ...context,
      type: "auth",
      userId,
    });
  }

  logUploadEvent(filename: string, size: number, context?: LogContext) {
    this.logBusinessEvent("File Upload", {
      ...context,
      filename,
      size,
      sizeFormatted: this.formatBytes(size),
    });
  }

  logOrderEvent(event: string, orderId: string, context?: LogContext) {
    this.logBusinessEvent(`Order ${event}`, {
      ...context,
      orderId,
    });
  }

  logPaymentEvent(event: string, amount: number, context?: LogContext) {
    this.logBusinessEvent(`Payment ${event}`, {
      ...context,
      amount,
      currency: "BRL",
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Método para buscar logs (útil para dashboard admin)
  async searchLogs(filters: {
    level?: string;
    type?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    // Em produção, isso seria implementado com uma solução como ELK Stack
    // Por enquanto, retornamos um array vazio
    return [];
  }

  // Método para obter estatísticas de logs
  async getLogStats(): Promise<{
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    lastError?: any;
  }> {
    // Em produção, isso seria implementado com agregações do sistema de logs
    return {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }
}
