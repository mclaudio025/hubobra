# 📊 Sistema de Monitoramento e Logs Avançado

## 🎯 Visão Geral

Sistema completo de monitoramento, logs estruturados e métricas de performance implementado para o e-commerce. Fornece visibilidade total sobre a saúde e performance da aplicação.

## 🏗️ Arquitetura

### Backend (NestJS)
```
backend-nestjs/src/
├── logging/
│   ├── logger.service.ts      # Serviço de logs estruturados
│   ├── logging.interceptor.ts # Interceptor para logs automáticos
│   └── logging.module.ts      # Módulo de logs
├── metrics/
│   ├── metrics.service.ts     # Coleta e processamento de métricas
│   ├── metrics.controller.ts  # API endpoints para métricas
│   ├── metrics.interceptor.ts # Interceptor para coleta automática
│   └── metrics.module.ts      # Módulo de métricas
└── health/
    ├── health.service.ts      # Health checks avançados
    └── health.controller.ts   # Endpoints de saúde
```

### Frontend (Next.js)
```
frontend/src/app/
├── admin/monitoramento/
│   └── page.tsx              # Dashboard de monitoramento
└── api/metrics/
    ├── dashboard/route.ts    # API proxy para dashboard
    └── export/route.ts       # Exportação de métricas
```

## 🔧 Funcionalidades Implementadas

### 1. Sistema de Logs Estruturados

#### Características:
- **Logs categorizados** por tipo (request, error, security, business, performance)
- **Rotação automática** de arquivos (5MB por arquivo, 5-10 arquivos históricos)
- **Múltiplos transportes** (console, arquivos, futuramente ELK Stack)
- **Contexto rico** com informações de usuário, IP, user-agent, etc.

#### Tipos de Log:
```typescript
// Logs de requisição HTTP
logger.logRequest(req, res, responseTime);

// Eventos de segurança
logger.logSecurityEvent('Failed Login Attempt', { ip, userAgent });

// Eventos de negócio
logger.logBusinessEvent('Order Created', { orderId, userId, amount });

// Performance
logger.logPerformanceEvent('Database Query', duration, { query });

// Upload de arquivos
logger.logUploadEvent(filename, size, { userId });
```

#### Arquivos Gerados:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros
- `logs/security.log` - Eventos de segurança
- `logs/business.log` - Eventos de negócio

### 2. Sistema de Métricas

#### Métricas Coletadas:
- **Sistema**: Memória, CPU, uptime
- **Aplicação**: Total de requests, taxa de erro, tempo de resposta
- **Database**: Conexões ativas, tempo médio de query
- **Cache**: Hit rate, operações
- **Uploads**: Total, tamanho médio

#### Endpoints Disponíveis:
```bash
GET /metrics              # Métricas atuais
GET /metrics/history      # Histórico (últimos 60 minutos)
GET /metrics/alerts       # Status de alertas
GET /metrics/dashboard    # Dados completos para dashboard
GET /metrics/export       # Exportação formato Prometheus
```

#### Alertas Automáticos:
- ⚠️ **Alto uso de memória** (>80%)
- ⚠️ **Alta taxa de erro** (>5%)
- ⚠️ **Tempo de resposta lento** (>1000ms)
- ⚠️ **Baixa taxa de cache hit** (<70%)

### 3. Health Checks Avançados

#### Verificações:
- **Database**: Conectividade e tempo de resposta
- **Redis**: Operações de leitura/escrita
- **Sistema de arquivos**: Permissões de escrita
- **APIs externas**: Status de serviços dependentes

#### Endpoints:
```bash
GET /health       # Status completo do sistema
GET /health/ready # Readiness probe (Kubernetes)
GET /health/live  # Liveness probe (Kubernetes)
```

### 4. Dashboard de Monitoramento

#### Características:
- **Tempo real** com auto-refresh configurável
- **Alertas visuais** para problemas críticos
- **Métricas históricas** com gráficos
- **Interface responsiva** para mobile/desktop
- **Exportação** de dados para análise externa

#### Seções do Dashboard:
1. **Resumo Executivo**: Uptime, requests totais, taxa de erro
2. **Sistema**: Uso de memória, CPU, load average
3. **Aplicação**: Requests por minuto, tempo de resposta
4. **Database**: Conexões, queries, performance
5. **Cache & Storage**: Hit rate, uploads, armazenamento

## 🚀 Como Usar

### 1. Instalação
```bash
# Backend - dependências já instaladas
cd backend-nestjs
npm install winston uuid

# Frontend - sem dependências adicionais necessárias
```

### 2. Configuração
```bash
# Variáveis de ambiente (.env)
LOG_LEVEL=info                    # debug, info, warn, error
BACKEND_URL=http://localhost:8081
```

### 3. Acesso ao Dashboard
```bash
# Interface web
http://localhost:3000/admin/monitoramento

# APIs diretas
http://localhost:8081/health
http://localhost:8081/metrics
```

### 4. Testes
```bash
# Teste completo do sistema
node test-monitoring-system.js

# Testes específicos
node test-monitoring-system.js logs     # Apenas logs
node test-monitoring-system.js health   # Health checks
node test-monitoring-system.js metrics  # Métricas
node test-monitoring-system.js load     # Simular carga
```

## 📈 Métricas de Performance

### Benchmarks Esperados:
- **Tempo de resposta médio**: <200ms
- **Taxa de erro**: <1%
- **Cache hit rate**: >80%
- **Uso de memória**: <70%
- **Uptime**: >99.9%

### Alertas Configurados:
| Métrica | Warning | Critical | Ação |
|---------|---------|----------|------|
| Memória | >60% | >80% | Log de alerta |
| Taxa de erro | >2% | >5% | Log de alerta |
| Tempo resposta | >500ms | >1000ms | Log de alerta |
| Cache hit | <80% | <70% | Log de alerta |

## 🔍 Monitoramento em Produção

### Logs Estruturados:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "HTTP 200 - GET /products",
  "method": "GET",
  "url": "/products",
  "statusCode": 200,
  "responseTime": 45,
  "ip": "192.168.1.100",
  "userId": "user123",
  "requestId": "req-uuid-123"
}
```

### Métricas Exportadas (Prometheus):
```
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes 134217728

# HELP nodejs_requests_total Total number of requests
# TYPE nodejs_requests_total counter
nodejs_requests_total 1500
```

## 🛠️ Integração com Ferramentas Externas

### ELK Stack (Futuro):
- **Elasticsearch**: Armazenamento e indexação de logs
- **Logstash**: Processamento e transformação
- **Kibana**: Visualização e dashboards

### Prometheus + Grafana (Futuro):
- **Prometheus**: Coleta de métricas
- **Grafana**: Dashboards avançados
- **AlertManager**: Notificações automáticas

### Kubernetes:
```yaml
# Health checks para pods
livenessProbe:
  httpGet:
    path: /health/live
    port: 8081
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8081
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📊 Relatórios e Análises

### Relatórios Automáticos:
- **Diário**: Resumo de performance e erros
- **Semanal**: Tendências e comparações
- **Mensal**: Análise de crescimento e otimizações

### Métricas de Negócio:
- **Conversão**: Taxa de carrinho abandonado
- **Performance**: Tempo de carregamento por página
- **Usuários**: Sessões ativas, bounce rate
- **Vendas**: Revenue por hora/dia/mês

## 🔐 Segurança e Privacidade

### Dados Sensíveis:
- **Não logamos**: Senhas, tokens, dados pessoais
- **Mascaramos**: IPs parciais, IDs de usuário
- **Criptografamos**: Logs em produção (futuro)

### Retenção:
- **Logs locais**: 30 dias
- **Métricas**: 90 dias
- **Alertas**: 1 ano

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas):
- [ ] Integração com sistema de notificações (email/Slack)
- [ ] Dashboards específicos por módulo
- [ ] Métricas de negócio avançadas

### Médio Prazo (1 mês):
- [ ] Integração com ELK Stack
- [ ] Alertas inteligentes com ML
- [ ] Relatórios automatizados

### Longo Prazo (3 meses):
- [ ] APM (Application Performance Monitoring)
- [ ] Distributed tracing
- [ ] Análise preditiva de falhas

## 📚 Documentação Adicional

- [Health Checks](./SISTEMA_HEALTH_CHECKS.md)
- [Cache Redis](./SISTEMA_CACHE_REDIS.md)
- [Segurança Avançada](./SISTEMA_SEGURANCA_AVANCADA.md)
- [Deploy em Produção](./DEPLOY_EASYPANEL.md)

---

**Status**: ✅ **Implementado e Testado**  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024