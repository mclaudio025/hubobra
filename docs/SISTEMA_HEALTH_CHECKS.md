# Sistema de Health Checks Avançado - Documentação Completa

## 🎯 Objetivo
Implementar sistema robusto de monitoramento de saúde da aplicação com health checks detalhados, alertas automáticos e métricas de performance para garantir alta disponibilidade.

## 🏥 Funcionalidades Implementadas

### 1. **Health Checks Detalhados**

#### Serviços Monitorados
- **Database (PostgreSQL)**: Conexão, performance de queries, pool de conexões
- **Redis**: Operações read/write, estatísticas, latência
- **File System**: Acesso a diretórios, operações de I/O
- **External APIs**: APIs de pagamento, correios, email (configurável)
- **Memory**: Uso de heap, memória do sistema, garbage collection
- **Disk**: Espaço disponível, operações de escrita

#### Status Levels
```typescript
enum ServiceStatus {
  UP = 'up',           // Funcionando normalmente
  DEGRADED = 'degraded', // Funcionando com problemas
  DOWN = 'down'        // Não funcionando
}

enum SystemStatus {
  HEALTHY = 'healthy',     // Todos os serviços OK
  DEGRADED = 'degraded',   // Alguns problemas não críticos
  UNHEALTHY = 'unhealthy'  // Problemas críticos
}
```

### 2. **Endpoints de Health Check**

#### `/health` - Health Check Completo
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.7.3",
  "environment": "production",
  "services": {
    "database": {
      "status": "up",
      "responseTime": 45,
      "lastCheck": "2025-01-27T10:30:00.000Z",
      "details": {
        "userCount": 1250,
        "connectionPool": "active"
      }
    },
    "redis": {
      "status": "up",
      "responseTime": 12,
      "lastCheck": "2025-01-27T10:30:00.000Z",
      "details": {
        "stats": {
          "hits": 8500,
          "misses": 1200,
          "keys": 450
        }
      }
    }
  },
  "metrics": {
    "memoryUsage": {
      "heapUsed": 125829120,
      "heapTotal": 201326592
    },
    "cpuUsage": [15.2, 18.7, 12.3, 20.1],
    "uptime": 3600,
    "loadAverage": [0.5, 0.7, 0.8]
  },
  "checks": {
    "total": 6,
    "passed": 5,
    "failed": 0,
    "degraded": 1
  }
}
```

#### `/health/live` - Liveness Probe
```json
{
  "status": "alive",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600
}
```

#### `/health/ready` - Readiness Probe
```json
{
  "status": "ready",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600
}
```

#### `/health/status` - Status Simplificado
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.7.3",
  "environment": "production",
  "services": {
    "database": "up",
    "redis": "up",
    "fileSystem": "up",
    "externalAPIs": "degraded",
    "memory": "up",
    "disk": "up"
  }
}
```

#### `/health/metrics` - Métricas do Sistema
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.7.3",
  "environment": "production",
  "metrics": {
    "memoryUsage": {
      "heapUsed": 125829120,
      "heapTotal": 201326592,
      "rss": 180224000,
      "external": 2048576
    },
    "cpuUsage": [15.2, 18.7, 12.3, 20.1],
    "platform": "linux",
    "nodeVersion": "v18.17.0",
    "processId": 1234,
    "activeHandles": 15,
    "freeMemory": 2147483648,
    "totalMemory": 8589934592,
    "loadAverage": [0.5, 0.7, 0.8]
  }
}
```

#### `/health/ping` - Ping Simples
```
pong
```

### 3. **Sistema de Monitoramento Contínuo**

#### HealthMonitorService
- **Monitoramento automático** a cada 30 segundos
- **Detecção de mudanças** de status dos serviços
- **Alertas baseados em métricas** (CPU, memória, latência)
- **Histórico de alertas** com severidade
- **Integração com auditoria** de segurança

#### Tipos de Alertas
```typescript
enum AlertType {
  SERVICE_DOWN = 'service_down',
  SERVICE_DEGRADED = 'service_degraded',
  HIGH_MEMORY = 'high_memory',
  HIGH_CPU = 'high_cpu',
  SLOW_RESPONSE = 'slow_response'
}

enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

#### Thresholds de Alerta
```typescript
const alertThresholds = {
  memory: {
    degraded: 75,  // 75% uso de heap
    critical: 90   // 90% uso de heap
  },
  cpu: {
    degraded: 80,  // 80% uso médio de CPU
    critical: 95   // 95% uso médio de CPU
  },
  responseTime: {
    database: { slow: 1000, critical: 3000 },    // ms
    redis: { slow: 500, critical: 1500 },        // ms
    fileSystem: { slow: 200, critical: 600 },    // ms
    externalAPIs: { slow: 2000, critical: 6000 } // ms
  }
};
```

### 4. **API de Alertas**

#### `/health/alerts` - Histórico de Alertas
```json
{
  "alerts": [
    {
      "type": "high_memory",
      "service": "system",
      "message": "High memory usage: 87.3%",
      "severity": "high",
      "timestamp": "2025-01-27T10:25:00.000Z",
      "details": {
        "heapUsedPercent": "87.3",
        "heapUsed": 175829120,
        "heapTotal": 201326592
      }
    }
  ],
  "stats": {
    "total": 45,
    "last24h": 12,
    "last1h": 3,
    "bySeverity": {
      "critical": 2,
      "high": 8,
      "medium": 15,
      "low": 20
    },
    "byType": {
      "high_memory": 8,
      "slow_response": 12,
      "service_degraded": 5
    }
  }
}
```

## 🛠️ Implementação Técnica

### 1. **HealthService - Core Logic**
```typescript
@Injectable()
export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    // Executar todos os checks em paralelo
    const [database, redis, fileSystem, externalAPIs, memory, disk] = 
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkFileSystem(),
        this.checkExternalAPIs(),
        this.checkMemory(),
        this.checkDisk(),
      ]);

    // Mapear resultados e calcular status geral
    const services = this.mapResults([database, redis, ...]);
    const overallStatus = this.calculateOverallStatus(services);
    
    return {
      status: overallStatus,
      services,
      metrics: await this.getSystemMetrics(),
      // ...
    };
  }
}
```

### 2. **Database Health Check**
```typescript
private async checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Teste de conexão básico
    await this.prisma.$queryRaw`SELECT 1 as test`;
    
    // Teste de performance
    const userCount = await this.prisma.user.count();
    
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: { userCount, connectionPool: 'active' }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
}
```

### 3. **Redis Health Check**
```typescript
private async checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Teste de read/write
    const testKey = 'health-check';
    const testValue = `test-${Date.now()}`;
    
    await this.cacheService.set(testKey, testValue, { ttl: 10 });
    const result = await this.cacheService.get(testKey);
    
    if (result !== testValue) {
      throw new Error('Redis read/write test failed');
    }
    
    await this.cacheService.del(testKey);
    const stats = await this.cacheService.getStats();
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: { stats }
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}
```

### 4. **Monitoramento Contínuo**
```typescript
@Injectable()
export class HealthMonitorService implements OnModuleInit {
  private monitoringInterval: NodeJS.Timeout;
  
  onModuleInit() {
    this.startMonitoring();
  }
  
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      const currentHealth = await this.healthService.getHealthStatus();
      
      // Detectar mudanças de status
      await this.detectStatusChanges(this.lastHealth, currentHealth);
      
      // Verificar alertas de métricas
      await this.checkMetricAlerts(currentHealth);
      
      this.lastHealth = currentHealth;
    }, 30000); // 30 segundos
  }
}
```

## 🚀 Uso Prático

### 1. **Kubernetes Health Checks**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: ecommerce-api
        image: ecommerce-api:latest
        ports:
        - containerPort: 8081
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

### 2. **Load Balancer Health Check**
```nginx
# nginx.conf
upstream backend {
    server api1:8081 max_fails=3 fail_timeout=30s;
    server api2:8081 max_fails=3 fail_timeout=30s;
}

server {
    location /health/ping {
        proxy_pass http://backend;
        proxy_connect_timeout 1s;
        proxy_read_timeout 1s;
    }
}
```

### 3. **Monitoramento com Scripts**
```bash
# Teste completo
npm run health:test

# Monitoramento contínuo
npm run health:monitor

# Teste de carga
npm run health:load 1000 50

# Check rápido
curl http://localhost:8081/health/status
```

### 4. **Alertas Personalizados**
```typescript
// Configurar alertas customizados
const customAlerts = {
  highOrderVolume: {
    threshold: 1000,
    window: '5m',
    severity: 'medium'
  },
  lowInventory: {
    threshold: 10,
    window: '1h',
    severity: 'high'
  }
};
```

## 📊 Métricas e Dashboards

### 1. **Métricas Coletadas**
- **Uptime**: Tempo de funcionamento da aplicação
- **Response Time**: Tempo de resposta por serviço
- **Memory Usage**: Uso de memória heap e sistema
- **CPU Usage**: Uso de CPU por core
- **Active Connections**: Conexões ativas no banco
- **Cache Hit Rate**: Taxa de acerto do cache
- **Error Rate**: Taxa de erros por endpoint

### 2. **Dashboard Sugerido**
```json
{
  "panels": [
    {
      "title": "System Status",
      "type": "stat",
      "targets": ["/health/status"]
    },
    {
      "title": "Response Times",
      "type": "graph",
      "targets": ["/health/metrics"]
    },
    {
      "title": "Memory Usage",
      "type": "graph",
      "targets": ["/health/metrics"]
    },
    {
      "title": "Recent Alerts",
      "type": "table",
      "targets": ["/health/alerts"]
    }
  ]
}
```

## 🔧 Configuração e Customização

### 1. **Variáveis de Ambiente**
```env
# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
HEALTH_ALERT_MEMORY_THRESHOLD=85
HEALTH_ALERT_CPU_THRESHOLD=80
HEALTH_ALERT_RESPONSE_TIME_THRESHOLD=1000

# Monitoring
HEALTH_MONITORING_ENABLED=true
HEALTH_ALERTS_ENABLED=true
HEALTH_LOG_LEVEL=warn
```

### 2. **Customização de Thresholds**
```typescript
// health.config.ts
export const healthConfig = {
  thresholds: {
    database: { slow: 1000, critical: 3000 },
    redis: { slow: 500, critical: 1500 },
    memory: { degraded: 75, critical: 90 },
    cpu: { degraded: 80, critical: 95 }
  },
  monitoring: {
    interval: 30000,
    alertHistory: 100,
    enableContinuousMonitoring: true
  }
};
```

### 3. **Integração com Alertas Externos**
```typescript
// Slack notifications
async sendSlackAlert(alert: HealthAlert) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `🚨 Health Alert: ${alert.message}`,
    attachments: [{
      color: this.getSlackColor(alert.severity),
      fields: [
        { title: 'Service', value: alert.service, short: true },
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Time', value: alert.timestamp, short: true }
      ]
    }]
  });
}

// Email notifications
async sendEmailAlert(alert: HealthAlert) {
  // Implementar envio de email
}
```

## 🧪 Testes e Validação

### 1. **Testes Automatizados**
```bash
# Testar todos os endpoints
npm run health:test

# Monitorar por 5 minutos
timeout 300 npm run health:monitor 10

# Teste de carga
npm run health:load 500 25
```

### 2. **Simulação de Falhas**
```bash
# Simular falha no Redis
docker stop redis-ecommerce

# Verificar detecção
curl http://localhost:8081/health/status

# Simular alta carga de CPU
stress --cpu 4 --timeout 60s

# Verificar alertas
curl http://localhost:8081/health/alerts
```

## 📈 Benefícios Implementados

### Operacionais
- **Detecção precoce** de problemas
- **Visibilidade completa** do sistema
- **Alertas automáticos** para incidentes
- **Métricas detalhadas** para otimização

### Desenvolvimento
- **Debugging facilitado** com métricas
- **Testes de carga** integrados
- **Monitoramento local** durante desenvolvimento
- **APIs padronizadas** para integração

### Produção
- **Alta disponibilidade** com health checks
- **Integração com Kubernetes** (liveness/readiness)
- **Load balancer** health checks
- **Alertas proativos** para ops

## 🚀 Próximos Passos

### Fase 1: Implementação Básica ✅
- [x] Health checks detalhados
- [x] Monitoramento contínuo
- [x] Sistema de alertas
- [x] APIs de consulta

### Fase 2: Melhorias Avançadas
- [ ] Machine Learning para detecção de anomalias
- [ ] Integração com Prometheus/Grafana
- [ ] Alertas via Slack/Email
- [ ] Health checks customizáveis

### Fase 3: Observabilidade Completa
- [ ] Distributed tracing
- [ ] APM integration
- [ ] Custom metrics
- [ ] SLA monitoring

---

**✅ Sistema de Health Checks Avançado implementado com sucesso!**
Monitoramento completo com alertas automáticos e métricas detalhadas para alta disponibilidade.