import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "./cache.service";
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_PREFIX_METADATA,
} from "./cache.decorator";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    // Se não tem cache key, pular cache
    if (!cacheKey) {
      return next.handle();
    }

    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );
    const cachePrefix = this.reflector.get<string>(
      CACHE_PREFIX_METADATA,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.buildCacheKey(cacheKey, request, cachePrefix);

    try {
      // Tentar buscar do cache
      const cachedResult = await this.cacheService.get(fullCacheKey);
      if (cachedResult !== undefined) {
        this.logger.debug(`Cache hit for key: ${fullCacheKey}`);
        return of(cachedResult);
      }

      // Se não estiver no cache, executar e cachear resultado
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== undefined && result !== null) {
            await this.cacheService.set(fullCacheKey, result, {
              ttl: cacheTTL,
              prefix: cachePrefix,
            });
            this.logger.debug(`Cached result for key: ${fullCacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${fullCacheKey}:`, error);
      // Em caso de erro no cache, continuar sem cache
      return next.handle();
    }
  }

  private buildCacheKey(
    baseKey: string,
    request: any,
    prefix?: string,
  ): string {
    const keyParts = [];

    if (prefix) {
      keyParts.push(prefix);
    }

    keyParts.push(baseKey);

    // Adicionar parâmetros da rota
    if (request.params && Object.keys(request.params).length > 0) {
      const paramsStr = Object.entries(request.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join("|");
      keyParts.push(`params:${paramsStr}`);
    }

    // Adicionar query parameters (apenas os relevantes)
    if (request.query && Object.keys(request.query).length > 0) {
      const relevantQuery = this.filterRelevantQuery(request.query);
      if (Object.keys(relevantQuery).length > 0) {
        const queryStr = Object.entries(relevantQuery)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}:${value}`)
          .join("|");
        keyParts.push(`query:${queryStr}`);
      }
    }

    // Adicionar ID do usuário se autenticado
    if (request.user?.id) {
      keyParts.push(`user:${request.user.id}`);
    }

    return keyParts.join(":");
  }

  private filterRelevantQuery(query: any): Record<string, any> {
    const relevantKeys = [
      "page",
      "limit",
      "sort",
      "order",
      "search",
      "category",
      "categoryId",
      "slug",
      "status",
      "active",
      "featured",
      "minPrice",
      "maxPrice",
    ];


    const filtered: Record<string, any> = {};
    for (const key of relevantKeys) {
      if (query[key] !== undefined) {
        filtered[key] = query[key];
      }
    }

    return filtered;
  }
}
