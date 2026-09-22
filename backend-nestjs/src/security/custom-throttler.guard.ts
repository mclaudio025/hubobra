import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { ThrottlerLimitDetail } from "@nestjs/throttler/dist/throttler.guard.interface";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Usar ID do usuário se autenticado, senão usar IP
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || "unknown";

    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  protected getLimit(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): number {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    // Limites específicos por rota
    const routeLimits: Record<string, number> = {
      "/auth/login": 5, // 5 tentativas de login por minuto
      "/auth/register": 3, // 3 registros por minuto
      "/auth/forgot-password": 2, // 2 tentativas de recuperação por minuto
      "/upload": 10, // 10 uploads por minuto
      "/products": 100, // 100 requests de produtos por minuto
      "/categories": 50, // 50 requests de categorias por minuto
    };

    // Verificar se a rota tem limite específico
    for (const [routePattern, limit] of Object.entries(routeLimits)) {
      if (route.includes(routePattern)) {
        return limit;
      }
    }

    // Limites diferentes para usuários autenticados vs anônimos
    if (request.user) {
      return throttlerLimitDetail.limit * 2; // Usuários autenticados têm limite dobrado
    }

    return throttlerLimitDetail.limit;
  }

  protected getTtl(context: ExecutionContext): number {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    // TTL específico por rota (em milissegundos)
    const routeTtls: Record<string, number> = {
      "/auth/login": 60000, // 1 minuto para login
      "/auth/register": 300000, // 5 minutos para registro
      "/auth/forgot-password": 900000, // 15 minutos para recuperação
    };

    for (const [routePattern, ttl] of Object.entries(routeTtls)) {
      if (route.includes(routePattern)) {
        return ttl;
      }
    }

    return 60000; // 1 minuto padrão
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;
    const tracker = await this.getTracker(request);

    // Log detalhado para monitoramento
    console.warn(`🚫 Rate limit exceeded:`, {
      tracker,
      route,
      limit: throttlerLimitDetail.limit,
      ttl: throttlerLimitDetail.ttl,
      timestamp: new Date().toISOString(),
      userAgent: request.get("User-Agent"),
    });

    // Mensagem personalizada baseada na rota
    let message = "Rate limit exceeded. Please try again later.";

    if (route.includes("/auth/login")) {
      message = "Too many login attempts. Please wait before trying again.";
    } else if (route.includes("/auth/register")) {
      message =
        "Too many registration attempts. Please wait before trying again.";
    } else if (route.includes("/upload")) {
      message =
        "Upload rate limit exceeded. Please wait before uploading again.";
    }

    throw new ThrottlerException(message);
  }
}
