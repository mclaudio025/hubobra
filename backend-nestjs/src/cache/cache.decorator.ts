import { SetMetadata } from "@nestjs/common";

export const CACHE_KEY_METADATA = "cache_key";
export const CACHE_TTL_METADATA = "cache_ttl";
export const CACHE_PREFIX_METADATA = "cache_prefix";

/**
 * Decorator para cache automático
 * @param key Chave base do cache
 * @param ttl Tempo de vida em segundos (padrão: 300)
 * @param prefix Prefixo para a chave (opcional)
 */
export const Cacheable = (key: string, ttl: number = 300, prefix?: string) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    if (prefix) {
      SetMetadata(CACHE_PREFIX_METADATA, prefix)(
        target,
        propertyName,
        descriptor,
      );
    }
    return descriptor;
  };
};

/**
 * Decorator para invalidar cache
 * @param patterns Padrões de chaves para invalidar
 */
export const CacheEvict = (...patterns: string[]) => {
  return SetMetadata("cache_evict_patterns", patterns);
};

/**
 * Decorator para cache de produtos
 */
export const CacheProducts = (ttl: number = 600) => {
  return Cacheable("products", ttl, "products");
};

/**
 * Decorator para cache de categorias
 */
export const CacheCategories = (ttl: number = 1800) => {
  return Cacheable("categories", ttl, "categories");
};

/**
 * Decorator para cache de usuários
 */
export const CacheUsers = (ttl: number = 900) => {
  return Cacheable("users", ttl, "users");
};

/**
 * Decorator para cache de pedidos
 */
export const CacheOrders = (ttl: number = 300) => {
  return Cacheable("orders", ttl, "orders");
};
