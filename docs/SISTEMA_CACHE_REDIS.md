# Sistema de Cache com Redis - Documentação Completa

## 🎯 Objetivo
Implementar sistema de cache robusto com Redis para melhorar performance das APIs, reduzir carga no banco de dados e otimizar experiência do usuário.

## 🚀 Funcionalidades Implementadas

### 1. **CacheService** - Serviço Principal
```typescript
// Operações básicas
await cacheService.get<Product[]>('products:list');
await cacheService.set('products:list', products, { ttl: 600 });
await cacheService.del('products:list');

// Cache-aside pattern
const products = await cacheService.getOrSet(
  'products:featured',
  () => this.prisma.product.findMany({ where: { featured: true } }),
  { ttl: 1800 }
);

// Invalidação por padrão
await cacheService.invalidatePattern('products:*');

// Estatísticas
const stats = await cacheService.getStats();
```

### 2. **Decorators Automáticos**
```typescript
// Cache automático
@CacheProducts(600) // 10 minutos
async findAll() {
  return this.prisma.product.findMany();
}

// Invalidação automática
@CacheEvict('products:*')
async create(data: CreateProductDto) {
  return this.prisma.product.create({ data });
}

// Decorators específicos
@CacheCategories(1800) // 30 minutos
@CacheUsers(900)       // 15 minutos
@CacheOrders(300)      // 5 minutos
```

### 3. **Interceptors Inteligentes**
- **CacheInterceptor**: Cache automático baseado em decorators
- **CacheEvictInterceptor**: Invalidação automática após operações
- **Chaves dinâmicas**: Baseadas em parâmetros, query e usuário

### 4. **API de Gerenciamento**
```bash
# Estatísticas do cache
GET /cache/stats

# Limpar todo cache
POST /cache/clear

# Deletar chave específica
DELETE /cache/key/products:list

# Invalidar por padrão
DELETE /cache/pattern/products:*

# Aquecer cache
POST /cache/warmup
```

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
```

### Docker Compose
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

## 📊 Estratégias de Cache Implementadas

### 1. **Cache por Tipo de Dados**
| Tipo | TTL | Estratégia | Invalidação |
|------|-----|------------|-------------|
| **Produtos** | 10min | Cache-aside | Create/Update/Delete |
| **Categorias** | 30min | Cache-aside | Create/Update/Delete |
| **Usuários** | 15min | Cache-aside | Update/Delete |
| **Pedidos** | 5min | Write-through | Status change |

### 2. **Chaves Dinâmicas**
```typescript
// Exemplos de chaves geradas
products:findAll:params:categoryId:123|query:page:1|limit:20
categories:findAll:query:active:true
users:findById:params:id:user-123
orders:findByUser:params:userId:user-456|query:status:pending
```

### 3. **Invalidação Inteligente**
```typescript
// Invalidar produtos quando categoria muda
@CacheEvict('products:*', 'categories:*')
async updateCategory(id: string, data: UpdateCategoryDto) {
  // ...
}

// Invalidar cache específico do usuário
@CacheEvict('users:findById:*:user-123')
async updateUser(id: string, data: UpdateUserDto) {
  // ...
}
```

## 🎯 Performance e Métricas

### Benefícios Esperados
- **50% redução** no tempo de resposta das APIs
- **70% redução** na carga do banco de dados
- **90% cache hit rate** para dados frequentes
- **Melhor UX** com carregamento mais rápido

### Monitoramento
```typescript
// Estatísticas disponíveis
{
  hits: 1250,        // Cache hits
  misses: 180,       // Cache misses
  keys: 45,          // Chaves ativas
  memory: "2.1MB"    // Memória usada
}

// Hit rate = hits / (hits + misses) = 87.4%
```

## 🛠️ Uso Prático

### 1. **Aplicar Cache em Service**
```typescript
@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  @CacheProducts(600)
  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true, images: true }
    });
  }

  @CacheEvict('products:*')
  async create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }
}
```

### 2. **Cache Manual Avançado**
```typescript
async getProductsWithCache(categoryId?: string) {
  const cacheKey = `products:category:${categoryId || 'all'}`;
  
  return this.cacheService.getOrSet(
    cacheKey,
    async () => {
      return this.prisma.product.findMany({
        where: categoryId ? { categoryId } : {},
        include: { category: true, images: true }
      });
    },
    { ttl: 600, prefix: 'products' }
  );
}
```

### 3. **Invalidação Específica**
```typescript
async updateProduct(id: string, data: UpdateProductDto) {
  const product = await this.prisma.product.update({
    where: { id },
    data,
  });

  // Invalidar caches específicos
  await Promise.all([
    this.cacheService.invalidatePattern('products:*'),
    this.cacheService.del(`product:${id}`),
    this.cacheService.del(`products:category:${product.categoryId}`),
  ]);

  return product;
}
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. **Redis não conecta**
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Iniciar Redis
docker run -d -p 6379:6379 redis:7-alpine

# Testar conexão
npm run redis:test
```

#### 2. **Cache não funciona**
```typescript
// Verificar se CacheModule está importado
@Module({
  imports: [CacheModule],
  // ...
})

// Verificar se CacheService está injetado
constructor(private cacheService: CacheService) {}
```

#### 3. **Performance ruim**
```bash
# Verificar estatísticas
npm run cache:stats

# Limpar cache se necessário
npm run cache:clear

# Monitorar Redis
redis-cli monitor
```

#### 4. **Memória alta**
```bash
# Verificar uso de memória
redis-cli info memory

# Configurar TTL menor
CACHE_TTL=180

# Limitar número de chaves
CACHE_MAX_ITEMS=500
```

## 📈 Otimizações Avançadas

### 1. **Cache Warming**
```typescript
@Injectable()
export class CacheWarmupService {
  async warmupCache() {
    const tasks = [
      this.warmupProducts(),
      this.warmupCategories(),
      this.warmupFeaturedItems(),
    ];
    
    await Promise.all(tasks);
  }

  private async warmupProducts() {
    await this.productsService.findAll();
    await this.productsService.findFeatured();
  }
}
```

### 2. **Cache Layers**
```typescript
// L1: Memory cache (muito rápido, pequeno)
// L2: Redis cache (rápido, médio)
// L3: Database (lento, grande)

async getProduct(id: string) {
  // L1: Verificar memory cache
  let product = this.memoryCache.get(`product:${id}`);
  if (product) return product;

  // L2: Verificar Redis
  product = await this.cacheService.get(`product:${id}`);
  if (product) {
    this.memoryCache.set(`product:${id}`, product, 60); // 1min
    return product;
  }

  // L3: Buscar no banco
  product = await this.prisma.product.findUnique({ where: { id } });
  if (product) {
    await this.cacheService.set(`product:${id}`, product, { ttl: 600 });
    this.memoryCache.set(`product:${id}`, product, 60);
  }

  return product;
}
```

### 3. **Cache Compression**
```typescript
// Para dados grandes, usar compressão
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

async setCompressed(key: string, data: any) {
  const json = JSON.stringify(data);
  const compressed = await gzipAsync(json);
  await this.cacheService.set(key, compressed.toString('base64'));
}

async getCompressed<T>(key: string): Promise<T | null> {
  const compressed = await this.cacheService.get<string>(key);
  if (!compressed) return null;
  
  const buffer = Buffer.from(compressed, 'base64');
  const decompressed = await gunzipAsync(buffer);
  return JSON.parse(decompressed.toString());
}
```

## 🚀 Próximos Passos

### Fase 1: Implementação Básica ✅
- [x] CacheService com Redis
- [x] Decorators automáticos
- [x] Interceptors inteligentes
- [x] API de gerenciamento

### Fase 2: Otimizações (Próxima)
- [ ] Cache warming automático
- [ ] Compressão para dados grandes
- [ ] Cache layers (Memory + Redis)
- [ ] Métricas avançadas

### Fase 3: Produção
- [ ] Redis Cluster
- [ ] Backup automático
- [ ] Monitoramento com alertas
- [ ] Auto-scaling baseado em uso

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run redis:test          # Testar Redis
npm run cache:stats         # Ver estatísticas
npm run cache:clear         # Limpar cache

# Redis CLI
redis-cli ping              # Testar conexão
redis-cli keys "*"          # Listar chaves
redis-cli flushall          # Limpar tudo
redis-cli info memory       # Info de memória
redis-cli monitor           # Monitorar comandos

# Docker
docker-compose up -d redis  # Iniciar Redis
docker logs redis-ecommerce # Ver logs
docker exec -it redis-ecommerce redis-cli # Acessar CLI
```

---

**✅ Sistema de Cache implementado com sucesso!**
Redis configurado e funcionando em: `redis://localhost:6379`