import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(
    key: string,
    value: any,
    options?: number | { ttl?: number; prefix?: string },
  ): Promise<void> {
    if (typeof options === "number") {
      await this.cacheManager.set(key, value, options);
    } else if (options && typeof options === "object") {
      await this.cacheManager.set(key, value, options.ttl);
    } else {
      await this.cacheManager.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Método para invalidar cache por padrão
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Para Redis, usar scan para encontrar chaves
      const store = this.cacheManager.store as any;
      if (store.keys) {
        const keys = await store.keys(pattern);
        await Promise.all(keys.map((key: string) => this.del(key)));
      }
    } catch (error) {
      console.error("Erro ao invalidar cache por padrão:", error);
    }
  }

  // Métodos específicos para diferentes tipos de cache
  async cacheProducts(
    key: string,
    products: any[],
    ttl: number = 300,
  ): Promise<void> {
    await this.set(`products:${key}`, products, ttl);
  }

  async getCachedProducts(key: string): Promise<any[] | undefined> {
    return await this.get<any[]>(`products:${key}`);
  }

  async invalidateProductsCache(): Promise<void> {
    await this.invalidatePattern("products:*");
  }

  async cacheCategories(categories: any[], ttl: number = 600): Promise<void> {
    await this.set("categories:all", categories, ttl);
  }

  async getCachedCategories(): Promise<any[] | undefined> {
    return await this.get<any[]>("categories:all");
  }

  async invalidateCategoriesCache(): Promise<void> {
    await this.invalidatePattern("categories:*");
  }

  // Cache para configurações do sistema
  async cacheSettings(settings: any, ttl: number = 3600): Promise<void> {
    await this.set("settings:system", settings, ttl);
  }

  async getCachedSettings(): Promise<any | undefined> {
    return await this.get("settings:system");
  }

  // Método para verificar se uma chave existe
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  // Método para obter estatísticas do cache
  async getStats(): Promise<any> {
    try {
      const store = this.cacheManager.store as any;
      if (store.getClient && store.getClient().info) {
        // Para Redis
        const info = await store.getClient().info("memory");
        return {
          type: "redis",
          memory: info,
          connected: true,
        };
      } else {
        // Para cache em memória
        return {
          type: "memory",
          connected: true,
          message: "Cache em memória ativo",
        };
      }
    } catch (error) {
      return {
        type: "unknown",
        connected: false,
        error: error.message,
      };
    }
  }
}
