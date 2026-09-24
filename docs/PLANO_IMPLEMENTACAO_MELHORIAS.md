# Plano de Implementação - Melhorias Prioritárias

## 🎯 Melhorias Imediatas (Alta Prioridade)

### 1. **Migração para PostgreSQL em Desenvolvimento**

#### Problema Atual
O projeto está usando SQLite em desenvolvimento, o que pode causar inconsistências com produção.

#### Solução
```bash
# 1. Atualizar schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. Atualizar .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_dev"

# 3. Executar migração
npx prisma migrate dev --name init
```

#### Implementação
```typescript
// backend-nestjs/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => {
        if (!config.DATABASE_URL) {
          throw new Error('DATABASE_URL is required');
        }
        return config;
      },
    }),
    PrismaModule,
  ],
})
export class DatabaseModule {}
```

### 2. **Sistema de Cache com Redis**

#### Implementação do CacheModule
```typescript
// backend-nestjs/src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 300, // 5 minutos padrão
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

```typescript
// backend-nestjs/src/cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Método para invalidar cache por padrão
  async invalidatePattern(pattern: string): Promise<void> {
    // Implementar lógica para invalidar por padrão
    const keys = await this.cacheManager.store.keys(pattern);
    await Promise.all(keys.map(key => this.del(key)));
  }
}
```

#### Decorator para Cache Automático
```typescript
// backend-nestjs/src/cache/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const Cacheable = (key: string, ttl: number = 300) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyName, descriptor);
  };
};
```

#### Interceptor de Cache
```typescript
// backend-nestjs/src/cache/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_KEY, CACHE_TTL } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.buildCacheKey(cacheKey, request);

    // Tentar buscar do cache
    const cachedResult = await this.cacheService.get(fullCacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // Se não estiver no cache, executar e cachear resultado
    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheService.set(fullCacheKey, result, cacheTTL);
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const { query, params, user } = request;
    const keyParts = [baseKey];
    
    if (params && Object.keys(params).length > 0) {
      keyParts.push(JSON.stringify(params));
    }
    
    if (query && Object.keys(query).length > 0) {
      keyParts.push(JSON.stringify(query));
    }
    
    if (user?.id) {
      keyParts.push(`user:${user.id}`);
    }
    
    return keyParts.join(':');
  }
}
```

### 3. **Otimização de Imagens**

#### Service de Otimização
```typescript
// backend-nestjs/src/upload/image-optimization.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

@Injectable()
export class ImageOptimizationService {
  async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {},
  ): Promise<Buffer> {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp',
    } = options;

    let sharpInstance = sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
    }

    return sharpInstance.toBuffer();
  }

  async generateThumbnails(buffer: Buffer): Promise<{
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  }> {
    const [thumbnail, medium, large] = await Promise.all([
      this.optimizeImage(buffer, { width: 150, height: 150 }),
      this.optimizeImage(buffer, { width: 400, height: 400 }),
      this.optimizeImage(buffer, { width: 800, height: 800 }),
    ]);

    return { thumbnail, medium, large };
  }
}
```

#### Middleware de Upload Otimizado
```typescript
// backend-nestjs/src/upload/optimized-upload.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ImageOptimizationService } from './image-optimization.service';

@Injectable()
export class OptimizedUploadMiddleware implements NestMiddleware {
  constructor(private imageOptimizationService: ImageOptimizationService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.file && req.file.mimetype.startsWith('image/')) {
      try {
        // Otimizar imagem original
        const optimizedBuffer = await this.imageOptimizationService.optimizeImage(
          req.file.buffer,
        );

        // Gerar thumbnails
        const thumbnails = await this.imageOptimizationService.generateThumbnails(
          req.file.buffer,
        );

        // Adicionar ao request para uso posterior
        req.file.buffer = optimizedBuffer;
        (req as any).thumbnails = thumbnails;
      } catch (error) {
        console.error('Erro na otimização de imagem:', error);
        // Continuar com imagem original em caso de erro
      }
    }

    next();
  }
}
```

### 4. **Sistema de Health Checks Avançado**

```typescript
// backend-nestjs/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    externalAPIs: ServiceHealth;
    fileSystem: ServiceHealth;
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthStatus> {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  async readiness(): Promise<{ ready: boolean }> {
    const health = await this.healthService.getHealthStatus();
    return { ready: health.status !== 'unhealthy' };
  }

  @Get('live')
  async liveness(): Promise<{ alive: boolean }> {
    return { alive: true };
  }
}
```

```typescript
// backend-nestjs/src/health/health.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const [database, redis, externalAPIs, fileSystem] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkFileSystem(),
    ]);

    const services = {
      database: this.mapResult(database),
      redis: this.mapResult(redis),
      externalAPIs: this.mapResult(externalAPIs),
      fileSystem: this.mapResult(fileSystem),
    };

    const overallStatus = this.calculateOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: os.loadavg()[0],
        activeConnections: (process as any)._getActiveHandles().length,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.cacheService.set('health-check', 'ok', 10);
      const result = await this.cacheService.get('health-check');
      
      if (result !== 'ok') {
        throw new Error('Redis read/write test failed');
      }

      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async checkExternalAPIs(): Promise<ServiceHealth> {
    // Implementar checks para APIs externas (pagamento, correios, etc.)
    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkFileSystem(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const fs = require('fs').promises;
      await fs.access('./uploads', fs.constants.W_OK);
      
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private mapResult(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    return {
      status: 'down',
      lastCheck: new Date().toISOString(),
      error: result.reason?.message || 'Unknown error',
    };
  }

  private calculateOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map(s => s.status);
    
    if (statuses.every(s => s === 'up')) {
      return 'healthy';
    }
    
    if (statuses.some(s => s === 'down')) {
      // Se database está down, sistema está unhealthy
      if (services.database.status === 'down') {
        return 'unhealthy';
      }
      // Outros serviços down = degraded
      return 'degraded';
    }
    
    return 'degraded';
  }
}
```

### 5. **Configuração de CORS Mais Restritiva**

```typescript
// backend-nestjs/src/config/cors.config.ts
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'https://loja-moderna.com',
          'https://www.loja-moderna.com',
          'https://admin.loja-moderna.com',
        ]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
        ];

    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 horas
};
```

### 6. **Sistema de Logs Estruturados**

```typescript
// backend-nestjs/src/logging/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, ...context });
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
    this.log('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    });
  }

  logSecurityEvent(event: string, context: LogContext) {
    this.logger.warn(`Security Event: ${event}`, {
      ...context,
      type: 'security',
    });
  }

  logBusinessEvent(event: string, context: LogContext) {
    this.logger.info(`Business Event: ${event}`, {
      ...context,
      type: 'business',
    });
  }
}
```

## 📋 Checklist de Implementação

### Semana 1: Infraestrutura Base
- [ ] Migrar para PostgreSQL
- [ ] Configurar Redis
- [ ] Implementar sistema de cache básico
- [ ] Configurar CORS restritivo
- [ ] Implementar health checks

### Semana 2: Performance
- [ ] Sistema de otimização de imagens
- [ ] Cache interceptor
- [ ] Índices de banco de dados
- [ ] Logs estruturados

### Semana 3: Monitoramento
- [ ] Métricas de performance
- [ ] Error tracking
- [ ] Dashboards básicos
- [ ] Alertas automáticos

### Semana 4: Testes e Validação
- [ ] Testes de carga
- [ ] Validação de performance
- [ ] Testes de segurança
- [ ] Documentação atualizada

## 🚀 Scripts de Deploy

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy das melhorias..."

# 1. Backup do banco
echo "📦 Fazendo backup do banco..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Executar migrações
echo "🔄 Executando migrações..."
cd backend-nestjs
npx prisma migrate deploy

# 3. Build das aplicações
echo "🏗️ Building aplicações..."
npm run build

# 4. Restart dos serviços
echo "🔄 Reiniciando serviços..."
docker-compose restart

# 5. Health check
echo "🏥 Verificando saúde dos serviços..."
curl -f http://localhost:8081/health || exit 1

echo "✅ Deploy concluído com sucesso!"
```

Este plano fornece uma implementação prática e gradual das melhorias mais importantes, priorizando estabilidade e performance do sistema.