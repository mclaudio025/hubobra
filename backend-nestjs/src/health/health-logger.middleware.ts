import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class HealthLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HealthCheck");
  private readonly loggedEndpoints = new Set([
    "/health",
    "/health/ready",
    "/health/live",
  ]);

  use(req: Request, res: Response, next: NextFunction) {
    // Só logar endpoints de health específicos e com falhas
    if (!this.loggedEndpoints.has(req.path)) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (body) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Logar apenas se houver problemas ou for muito lento
      if (statusCode >= 400 || responseTime > 5000) {
        const logger = new Logger("HealthCheck");
        logger.warn(`Health check issue: ${req.path}`, {
          method: req.method,
          path: req.path,
          statusCode,
          responseTime,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
        });
      } else if (responseTime > 1000) {
        const logger = new Logger("HealthCheck");
        logger.debug(`Slow health check: ${req.path} took ${responseTime}ms`);
      }

      return originalSend.call(this, body);
    };

    next();
  }
}
