import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "./cache.service";

@Injectable()
export class CacheEvictInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheEvictInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const evictPatterns = this.reflector.get<string[]>(
      "cache_evict_patterns",
      context.getHandler(),
    );

    if (!evictPatterns || evictPatterns.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        // Invalidar cache após operação bem-sucedida
        try {
          await Promise.all(
            evictPatterns.map((pattern) =>
              this.cacheService.invalidatePattern(pattern),
            ),
          );
          this.logger.debug(
            `Cache evicted for patterns: ${evictPatterns.join(", ")}`,
          );
        } catch (error) {
          this.logger.error("Cache eviction error:", error);
        }
      }),
    );
  }
}
