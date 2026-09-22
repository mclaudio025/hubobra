import { Controller, Get, HttpStatus, Res, Header } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { Response } from "express";
import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "Health check completo do sistema",
    description:
      "Retorna status detalhado de todos os serviços e métricas do sistema",
  })
  @ApiResponse({
    status: 200,
    description: "Sistema saudável",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["healthy", "degraded", "unhealthy"] },
        timestamp: { type: "string" },
        uptime: { type: "number" },
        version: { type: "string" },
        environment: { type: "string" },
        services: {
          type: "object",
          properties: {
            database: { $ref: "#/components/schemas/ServiceHealth" },
            redis: { $ref: "#/components/schemas/ServiceHealth" },
            fileSystem: { $ref: "#/components/schemas/ServiceHealth" },
          },
        },
        metrics: {
          type: "object",
          properties: {
            memoryUsage: { type: "object" },
            cpuUsage: { type: "array" },
            uptime: { type: "number" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: "Sistema não saudável" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async check(@Res() res: Response) {
    try {
      const health = await this.healthService.getHealthStatus();

      // Determinar status HTTP baseado na saúde do sistema
      let httpStatus = HttpStatus.OK;
      if (health.status === "unhealthy") {
        httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
      } else if (health.status === "degraded") {
        httpStatus = HttpStatus.OK; // Ainda funcional, mas com problemas
      }

      return res.status(httpStatus).json(health);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        uptime: process.uptime(),
      });
    }
  }

  @Get("live")
  @ApiOperation({
    summary: "Liveness probe",
    description:
      "Verifica se a aplicação está viva (para Kubernetes liveness probe)",
  })
  @ApiResponse({ status: 200, description: "Aplicação está viva" })
  @ApiResponse({ status: 503, description: "Aplicação não está respondendo" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async liveness(@Res() res: Response) {
    try {
      const isAlive = await this.healthService.isAlive();

      if (isAlive) {
        return res.status(HttpStatus.OK).json({
          status: "alive",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: "dead",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Get("ready")
  @ApiOperation({
    summary: "Readiness probe",
    description:
      "Verifica se a aplicação está pronta para receber tráfego (para Kubernetes readiness probe)",
  })
  @ApiResponse({ status: 200, description: "Aplicação está pronta" })
  @ApiResponse({ status: 503, description: "Aplicação não está pronta" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async readiness(@Res() res: Response) {
    try {
      const isReady = await this.healthService.isReady();

      if (isReady) {
        return res.status(HttpStatus.OK).json({
          status: "ready",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: "not_ready",
          timestamp: new Date().toISOString(),
          message: "Application is not ready to receive traffic",
        });
      }
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Get("metrics")
  @ApiOperation({
    summary: "Métricas do sistema",
    description: "Retorna apenas as métricas de performance do sistema",
  })
  @ApiResponse({ status: 200, description: "Métricas do sistema" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async metrics(@Res() res: Response) {
    try {
      const health = await this.healthService.getHealthStatus();

      return res.status(HttpStatus.OK).json({
        timestamp: health.timestamp,
        uptime: health.uptime,
        version: health.version,
        environment: health.environment,
        metrics: health.metrics,
        checks: health.checks,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get("services")
  @ApiOperation({
    summary: "Status dos serviços",
    description: "Retorna apenas o status dos serviços externos",
  })
  @ApiResponse({ status: 200, description: "Status dos serviços" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async services(@Res() res: Response) {
    try {
      const health = await this.healthService.getHealthStatus();

      return res.status(HttpStatus.OK).json({
        timestamp: health.timestamp,
        status: health.status,
        services: health.services,
        checks: health.checks,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Endpoint simples para load balancers
  @Get("ping")
  @ApiExcludeEndpoint()
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async ping(@Res() res: Response) {
    return res.status(HttpStatus.OK).send("pong");
  }

  // Endpoint para verificação rápida de status
  @Get("status")
  @ApiOperation({
    summary: "Status rápido",
    description: "Retorna status simplificado para verificações rápidas",
  })
  @ApiResponse({ status: 200, description: "Status simplificado" })
  @Header("Cache-Control", "no-cache, no-store, must-revalidate")
  async status(@Res() res: Response) {
    try {
      const health = await this.healthService.getHealthStatus();

      return res.status(HttpStatus.OK).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime,
        version: health.version,
        environment: health.environment,
        services: Object.entries(health.services).reduce(
          (acc, [key, service]) => {
            acc[key] = service.status;
            return acc;
          },
          {} as Record<string, string>,
        ),
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
