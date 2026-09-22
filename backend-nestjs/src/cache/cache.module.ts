import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheService } from "./cache.service";
import { CacheController } from "./cache.controller";
import { CacheInterceptor } from "./cache.interceptor";
import { CacheEvictInterceptor } from "./cache-evict.interceptor";

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const useRedis =
          configService.get("USE_REDIS_CACHE", "false") === "true";

        if (useRedis) {
          try {
            const { redisStore } = await import("cache-manager-redis-store");
            const redisConfig = {
              store: redisStore as any,
              host: configService.get("REDIS_HOST", "localhost"),
              port: parseInt(configService.get("REDIS_PORT", "6379")),
              password: configService.get("REDIS_PASSWORD", ""),
              db: parseInt(configService.get("REDIS_DB", "0")),
              ttl: parseInt(configService.get("CACHE_TTL", "300")),
              max: parseInt(configService.get("CACHE_MAX_ITEMS", "1000")),
            };

            console.log("🔴 Redis Cache Config:", {
              host: redisConfig.host,
              port: redisConfig.port,
              db: redisConfig.db,
              ttl: redisConfig.ttl,
            });

            return redisConfig;
          } catch (error) {
            console.warn(
              "⚠️ Redis not available, falling back to memory cache:",
              error.message,
            );
          }
        }

        // Fallback para cache em memória
        console.log("💾 Using memory cache (fallback)");
        return {
          ttl: parseInt(configService.get("CACHE_TTL", "300")),
          max: parseInt(configService.get("CACHE_MAX_ITEMS", "1000")),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [CacheController],
  providers: [CacheService, CacheInterceptor, CacheEvictInterceptor],
  exports: [
    CacheService,
    CacheInterceptor,
    CacheEvictInterceptor,
    NestCacheModule,
  ],
})
export class CacheModule {}
