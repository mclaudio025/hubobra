const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:8081';

async function testHealthEndpoints() {
  console.log('🏥 Testando endpoints de health...\n');

  const endpoints = [
    { path: '/health', name: 'Health Check Completo' },
    { path: '/health/live', name: 'Liveness Probe' },
    { path: '/health/ready', name: 'Readiness Probe' },
    { path: '/health/status', name: 'Status Rápido' },
    { path: '/health/metrics', name: 'Métricas do Sistema' },
    { path: '/health/services', name: 'Status dos Serviços' },
    { path: '/health/ping', name: 'Ping Simples' },
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 10000,
        validateStatus: () => true, // Aceitar todos os status codes
      });
      const responseTime = Date.now() - startTime;

      const statusIcon = response.status < 300 ? '✅' : 
                        response.status < 400 ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${endpoint.name}`);
      console.log(`   URL: ${BASE_URL}${endpoint.path}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Tempo: ${responseTime}ms`);
      
      if (endpoint.path === '/health' && response.data) {
        console.log(`   Sistema: ${response.data.status || 'unknown'}`);
        if (response.data.services) {
          Object.entries(response.data.services).forEach(([service, info]) => {
            const serviceStatus = info.status === 'up' ? '🟢' : 
                                 info.status === 'degraded' ? '🟡' : '🔴';
            console.log(`   ${serviceStatus} ${service}: ${info.status} (${info.responseTime || 0}ms)`);
          });
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${endpoint.name}`);
      console.log(`   URL: ${BASE_URL}${endpoint.path}`);
      console.log(`   Erro: ${error.message}`);
      console.log('');
    }
  }
}

async function monitorHealth(intervalSeconds = 30) {
  console.log(`🔄 Iniciando monitoramento contínuo (${intervalSeconds}s)...\n`);
  
  const monitor = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/health/status`, {
        timeout: 5000,
        validateStatus: () => true,
      });
      
      const timestamp = new Date().toLocaleTimeString();
      const status = response.data?.status || 'unknown';
      const statusIcon = status === 'healthy' ? '🟢' : 
                        status === 'degraded' ? '🟡' : '🔴';
      
      console.log(`[${timestamp}] ${statusIcon} Sistema: ${status}`);
      
      if (response.data?.services) {
        const downServices = Object.entries(response.data.services)
          .filter(([, status]) => status !== 'up')
          .map(([name, status]) => `${name}:${status}`);
        
        if (downServices.length > 0) {
          console.log(`   ⚠️ Problemas: ${downServices.join(', ')}`);
        }
      }
      
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ❌ Erro: ${error.message}`);
    }
  };
  
  // Executar imediatamente
  await monitor();
  
  // Configurar intervalo
  setInterval(monitor, intervalSeconds * 1000);
}

async function loadTest(requests = 100, concurrency = 10) {
  console.log(`🚀 Teste de carga: ${requests} requests com ${concurrency} concorrentes...\n`);
  
  const results = [];
  const startTime = Date.now();
  
  const makeRequest = async () => {
    const reqStart = Date.now();
    try {
      const response = await axios.get(`${BASE_URL}/health/ping`, {
        timeout: 5000,
      });
      return {
        success: true,
        responseTime: Date.now() - reqStart,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - reqStart,
        error: error.message,
      };
    }
  };
  
  // Executar requests em batches
  for (let i = 0; i < requests; i += concurrency) {
    const batch = [];
    for (let j = 0; j < concurrency && (i + j) < requests; j++) {
      batch.push(makeRequest());
    }
    
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Mostrar progresso
    const progress = Math.min(i + concurrency, requests);
    process.stdout.write(`\r   Progresso: ${progress}/${requests} (${((progress/requests)*100).toFixed(1)}%)`);
  }
  
  console.log('\n');
  
  // Calcular estatísticas
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const responseTimes = successful.map(r => r.responseTime);
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  const totalTime = Date.now() - startTime;
  const requestsPerSecond = (requests / totalTime) * 1000;
  
  console.log('📊 Resultados:');
  console.log(`   Total: ${requests} requests em ${totalTime}ms`);
  console.log(`   Sucesso: ${successful.length} (${((successful.length/requests)*100).toFixed(1)}%)`);
  console.log(`   Falhas: ${failed.length} (${((failed.length/requests)*100).toFixed(1)}%)`);
  console.log(`   RPS: ${requestsPerSecond.toFixed(2)} requests/segundo`);
  console.log(`   Tempo de resposta:`);
  console.log(`     Médio: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`     Mínimo: ${minResponseTime}ms`);
  console.log(`     Máximo: ${maxResponseTime}ms`);
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'test':
    testHealthEndpoints();
    break;
  case 'monitor':
    const interval = parseInt(process.argv[3]) || 30;
    monitorHealth(interval);
    break;
  case 'load':
    const requests = parseInt(process.argv[3]) || 100;
    const concurrency = parseInt(process.argv[4]) || 10;
    loadTest(requests, concurrency);
    break;
  default:
    console.log('Uso:');
    console.log('  node test-health.js test           # Testar todos os endpoints');
    console.log('  node test-health.js monitor [30]   # Monitorar continuamente');
    console.log('  node test-health.js load [100] [10] # Teste de carga');
    break;
}