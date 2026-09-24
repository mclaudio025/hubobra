# 🐘 Sistema PostgreSQL Avançado

## 🎯 Visão Geral

Sistema completo de gerenciamento e monitoramento PostgreSQL implementado para o e-commerce. Fornece migração de SQLite para PostgreSQL, monitoramento avançado, backup automático e otimização de performance.

## 🏗️ Arquitetura

### Backend (NestJS)
```
backend-nestjs/src/
├── database/
│   ├── database.module.ts         # Módulo principal do banco
│   ├── database.service.ts        # Serviços de gerenciamento
│   ├── database-health.service.ts # Monitoramento de saúde
│   └── database.controller.ts     # API endpoints
├── prisma/
│   ├── schema.prisma              # Schema PostgreSQL
│   └── seed.ts                    # Dados iniciais
└── scripts/
    └── setup-database.js          # Script de configuração
```

### Frontend (Next.js)
```
frontend/src/app/
├── admin/database/
│   └── page.tsx                   # Dashboard de monitoramento
└── api/database/
    ├── dashboard/route.ts         # API proxy para dashboard
    ├── backup/route.ts            # Criação de backup
    └── optimize/route.ts          # Otimização do banco
```

### Infraestrutura
```
infra/
└── docker-compose.yml            # PostgreSQL + Redis
```

## 🔧 Funcionalidades Implementadas

### 1. Migração Completa para PostgreSQL

#### Características:
- **Schema otimizado** para PostgreSQL com tipos nativos
- **Índices avançados** para performance
- **Relacionamentos complexos** com integridade referencial
- **Validações de ambiente** para garantir configuração correta

#### Schema Principal:
```sql
-- Usuários com roles e auditoria
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Produtos com atributos dinâmicos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id)
);

-- Índices otimizados
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('portuguese', name || ' ' || description));
```

### 2. Sistema de Monitoramento Avançado

#### Métricas Coletadas:
- **Conexões**: Ativas, inativas, uso percentual
- **Performance**: Tempo de resposta, queries lentas
- **Armazenamento**: Tamanho do banco, estatísticas por tabela
- **Saúde**: Status geral, alertas automáticos

#### Health Checks Automáticos:
```typescript
// Verificação a cada 5 minutos
@Cron(CronExpression.EVERY_5_MINUTES)
async performHealthCheck() {
  const metrics = await this.collectHealthMetrics();
  
  // Alertas automáticos
  if (metrics.connections.usage > 80) {
    this.logger.warn('High connection usage detected');
  }
  
  if (metrics.responseTime > 1000) {
    this.logger.warn('Slow database response detected');
  }
}
```

#### Tipos de Alertas:
- ⚠️ **Alto uso de conexões** (>75% crítico, >90% emergência)
- ⚠️ **Tempo de resposta lento** (>500ms aviso, >1000ms crítico)
- ⚠️ **Queries lentas** (>10 queries, >5s tempo médio)
- ⚠️ **Falha de conectividade** (conexão perdida)

### 3. Sistema de Backup Inteligente

#### Características:
- **Backup programático** em formato JSON para desenvolvimento
- **Backup SQL** usando pg_dump para produção
- **Versionamento automático** com timestamp
- **Compressão** para economizar espaço
- **Validação** de integridade

#### Tipos de Backup:
```bash
# Backup completo (desenvolvimento)
POST /database/backup
{
  "success": true,
  "filename": "backup_2024-01-27T10-30-00.json",
  "size": 2048576,
  "tables": 15
}

# Backup SQL (produção)
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql
```

### 4. Otimização Automática

#### Operações Disponíveis:
- **VACUUM**: Recuperação de espaço em disco
- **ANALYZE**: Atualização de estatísticas do planejador
- **REINDEX**: Reconstrução de índices (desenvolvimento)
- **Limpeza de logs**: Remoção de dados antigos

#### Exemplo de Otimização:
```typescript
async optimizeDatabase() {
  const operations = [];
  
  // VACUUM para recuperar espaço
  await this.prisma.$executeRaw`VACUUM`;
  operations.push('VACUUM');
  
  // ANALYZE para estatísticas
  await this.prisma.$executeRaw`ANALYZE`;
  operations.push('ANALYZE');
  
  return { success: true, operations, duration };
}
```

### 5. Dashboard de Monitoramento

#### Seções do Dashboard:
1. **Status Geral**: Uptime, tempo de resposta, alertas
2. **Informações da Conexão**: Host, versão, SSL, usuário
3. **Conexões**: Ativas, inativas, uso percentual
4. **Armazenamento**: Tamanho, tabelas, registros
5. **Queries Lentas**: Top 5 queries com maior tempo médio

#### Funcionalidades Interativas:
- **Auto-refresh** configurável (30s padrão)
- **Backup sob demanda** com feedback visual
- **Otimização manual** com progresso
- **Alertas visuais** para problemas críticos

## 🚀 Como Usar

### 1. Configuração Inicial
```bash
# Configurar ambiente completo
node scripts/setup-database.js setup

# Apenas configurar .env
node scripts/setup-database.js env

# Verificar status
node scripts/setup-database.js check
```

### 2. Iniciar Infraestrutura
```bash
# Iniciar PostgreSQL e Redis
cd infra
docker-compose up -d postgres redis

# Verificar se estão rodando
docker-compose ps
```

### 3. Executar Migrações
```bash
cd backend-nestjs

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Popular com dados iniciais
npx prisma db seed
```

### 4. Acessar Monitoramento
```bash
# Interface web
http://localhost:3000/admin/database

# APIs diretas
http://localhost:8081/database/info
http://localhost:8081/database/health
http://localhost:8081/database/dashboard
```

### 5. Testes
```bash
# Teste completo
node test-database-system.js

# Testes específicos
node test-database-system.js info       # Informações
node test-database-system.js health     # Saúde
node test-database-system.js operations # Operações
```

## 📊 Configuração de Produção

### 1. Variáveis de Ambiente
```bash
# .env (produção)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
REDIS_URL="redis://host:6379"

# Configurações de performance
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000
```

### 2. Otimizações PostgreSQL
```sql
-- postgresql.conf (produção)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
```

### 3. Monitoramento Externo
```yaml
# docker-compose.yml (produção)
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ecommerce_prod
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

## 🔍 Monitoramento e Alertas

### Métricas Principais:
```typescript
interface DatabaseHealthMetrics {
  timestamp: string;
  isHealthy: boolean;
  responseTime: number;
  connections: {
    active: number;
    idle: number;
    max: number;
    usage: number; // percentage
  };
  performance: {
    slowQueries: number;
    avgResponseTime: number;
    totalQueries: number;
  };
  storage: {
    databaseSize: string;
    totalTables: number;
    totalRecords: number;
  };
  alerts: Alert[];
}
```

### Configuração de Alertas:
```typescript
// Thresholds configuráveis
const ALERT_THRESHOLDS = {
  CONNECTION_USAGE_WARNING: 75,
  CONNECTION_USAGE_CRITICAL: 90,
  RESPONSE_TIME_WARNING: 500,
  RESPONSE_TIME_CRITICAL: 1000,
  SLOW_QUERIES_WARNING: 10,
  SLOW_QUERY_TIME_CRITICAL: 5000,
};
```

### Integração com Logs:
```typescript
// Logs estruturados para alertas
this.customLogger.logSecurityEvent('Database Alert: High Connection Usage', {
  severity: 'critical',
  connectionUsage: 95,
  threshold: 90,
  activeConnections: 95,
  maxConnections: 100,
});
```

## 🛠️ Manutenção e Troubleshooting

### Comandos Úteis:
```bash
# Verificar status das conexões
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# Queries mais lentas
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# Tamanho das tabelas
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

### Backup e Restore:
```bash
# Backup completo
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql

# Backup apenas dados
pg_dump --data-only "postgresql://user:pass@host:5432/db" > data.sql

# Restore
psql "postgresql://user:pass@host:5432/db" < backup.sql

# Backup programático (desenvolvimento)
node scripts/setup-database.js backup
```

### Otimização de Performance:
```bash
# Analisar todas as tabelas
node scripts/setup-database.js optimize

# VACUUM manual
VACUUM ANALYZE;

# Reindexar banco (cuidado em produção)
REINDEX DATABASE database_name;
```

## 📈 Métricas de Performance

### Benchmarks Esperados:
- **Tempo de resposta**: <100ms (queries simples), <500ms (queries complexas)
- **Throughput**: >1000 queries/segundo
- **Uso de conexões**: <70% em operação normal
- **Cache hit ratio**: >95%
- **Uptime**: >99.9%

### Monitoramento Contínuo:
```typescript
// Coleta automática a cada 5 minutos
@Cron(CronExpression.EVERY_5_MINUTES)
async collectMetrics() {
  const metrics = await this.getDatabaseMetrics();
  
  // Armazenar histórico
  this.metricsHistory.push(metrics);
  
  // Alertas automáticos
  this.checkAlerts(metrics);
  
  // Log para análise
  this.logger.log('Database metrics collected', metrics);
}
```

## 🔐 Segurança

### Configurações de Segurança:
```sql
-- Criar usuário específico para aplicação
CREATE USER ecommerce_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ecommerce_db TO ecommerce_app;
GRANT USAGE ON SCHEMA public TO ecommerce_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ecommerce_app;

-- SSL obrigatório
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
```

### Auditoria:
```typescript
// Log de operações sensíveis
async executeQuery(query: string, params: any[], userId?: string) {
  const startTime = Date.now();
  
  try {
    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    
    // Log da operação
    this.customLogger.logDatabaseQuery(query, Date.now() - startTime, {
      userId,
      success: true,
    });
    
    return result;
  } catch (error) {
    // Log do erro
    this.customLogger.error('Database query failed', error.stack, {
      query: query.substring(0, 200),
      userId,
      error: error.message,
    });
    
    throw error;
  }
}
```

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas):
- [ ] Implementar pg_stat_statements para análise de queries
- [ ] Configurar connection pooling otimizado
- [ ] Adicionar métricas de cache hit ratio

### Médio Prazo (1 mês):
- [ ] Integração com Prometheus/Grafana
- [ ] Backup automático para S3/MinIO
- [ ] Réplicas de leitura para escalabilidade

### Longo Prazo (3 meses):
- [ ] Particionamento de tabelas grandes
- [ ] Análise preditiva de performance
- [ ] Migração para PostgreSQL cluster

## 📚 Documentação Adicional

- [Monitoramento e Logs](./SISTEMA_MONITORAMENTO_LOGS.md)
- [Cache Redis](./SISTEMA_CACHE_REDIS.md)
- [Health Checks](./SISTEMA_HEALTH_CHECKS.md)
- [Deploy em Produção](./DEPLOY_EASYPANEL.md)

---

**Status**: ✅ **Implementado e Testado**  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024