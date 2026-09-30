#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:8081';
const FRONTEND_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para fazer login e obter token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    if (response.data.access_token) {
      log('✅ Login realizado com sucesso', 'green');
      return response.data.access_token;
    }
  } catch (error) {
    log('❌ Erro no login: ' + error.message, 'red');
    return null;
  }
}

// Testar sistema de logs
async function testLoggingSystem(token) {
  logSection('🔍 TESTANDO SISTEMA DE LOGS');
  
  try {
    // Fazer algumas requisições para gerar logs
    const requests = [
      { method: 'GET', url: '/products' },
      { method: 'GET', url: '/categories' },
      { method: 'GET', url: '/health' },
      { method: 'GET', url: '/nonexistent' }, // Gerar erro 404
    ];

    for (const req of requests) {
      try {
        await axios({
          method: req.method,
          url: `${BASE_URL}${req.url}`,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 5000
        });
        log(`✅ ${req.method} ${req.url} - OK`, 'green');
      } catch (error) {
        if (error.response?.status === 404) {
          log(`⚠️  ${req.method} ${req.url} - 404 (esperado)`, 'yellow');
        } else {
          log(`❌ ${req.method} ${req.url} - ${error.message}`, 'red');
        }
      }
      await sleep(100);
    }

    // Verificar se os arquivos de log foram criados
    const logFiles = ['logs/combined.log', 'logs/error.log'];
    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        log(`✅ Arquivo de log criado: ${logFile}`, 'green');
      } else {
        log(`❌ Arquivo de log não encontrado: ${logFile}`, 'red');
      }
    }

  } catch (error) {
    log('❌ Erro no teste de logs: ' + error.message, 'red');
  }
}

// Testar sistema de métricas
async function testMetricsSystem(token) {
  logSection('📊 TESTANDO SISTEMA DE MÉTRICAS');
  
  if (!token) {
    log('❌ Token necessário para testar métricas', 'red');
    return;
  }

  try {
    // Testar endpoint de métricas atuais
    const metricsResponse = await axios.get(`${BASE_URL}/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Métricas atuais obtidas:', 'green');
    const metrics = metricsResponse.data;
    log(`   - Uptime: ${Math.floor(metrics.uptime)}s`, 'blue');
    log(`   - Memória: ${metrics.memory.formatted.used}/${metrics.memory.formatted.total} (${metrics.memory.percentage.toFixed(1)}%)`, 'blue');
    log(`   - Requests: ${metrics.requests.total}`, 'blue');
    log(`   - Taxa de erro: ${metrics.requests.errorRate.toFixed(2)}%`, 'blue');

    // Testar histórico de métricas
    const historyResponse = await axios.get(`${BASE_URL}/metrics/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log(`✅ Histórico de métricas: ${historyResponse.data.length} entradas`, 'green');

    // Testar alertas
    const alertsResponse = await axios.get(`${BASE_URL}/metrics/alerts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Alertas verificados:', 'green');
    const alerts = alertsResponse.data;
    log(`   - Alto uso de memória: ${alerts.highMemoryUsage ? '⚠️' : '✅'}`, alerts.highMemoryUsage ? 'yellow' : 'green');
    log(`   - Alta taxa de erro: ${alerts.highErrorRate ? '⚠️' : '✅'}`, alerts.highErrorRate ? 'yellow' : 'green');
    log(`   - Resposta lenta: ${alerts.slowResponseTime ? '⚠️' : '✅'}`, alerts.slowResponseTime ? 'yellow' : 'green');
    log(`   - Cache baixo: ${alerts.lowCacheHitRate ? '⚠️' : '✅'}`, alerts.lowCacheHitRate ? 'yellow' : 'green');

    // Testar dashboard
    const dashboardResponse = await axios.get(`${BASE_URL}/metrics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Dashboard de métricas obtido:', 'green');
    const dashboard = dashboardResponse.data;
    log(`   - Total de requests: ${dashboard.summary.totalRequests}`, 'blue');
    log(`   - Uptime: ${dashboard.summary.uptime}`, 'blue');
    log(`   - Tempo médio de resposta: ${dashboard.summary.avgResponseTime.toFixed(0)}ms`, 'blue');

  } catch (error) {
    log('❌ Erro no teste de métricas: ' + error.message, 'red');
    if (error.response?.status === 403) {
      log('   Verifique se o usuário tem permissão de admin', 'yellow');
    }
  }
}

// Testar sistema de health checks
async function testHealthSystem() {
  logSection('🏥 TESTANDO SISTEMA DE HEALTH CHECKS');
  
  try {
    // Health check básico
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    log('✅ Health check básico:', 'green');
    const health = healthResponse.data;
    log(`   - Status: ${health.status}`, health.status === 'healthy' ? 'green' : 'red');
    log(`   - Uptime: ${Math.floor(health.uptime)}s`, 'blue');
    log(`   - Database: ${health.services.database.status}`, health.services.database.status === 'up' ? 'green' : 'red');
    log(`   - Redis: ${health.services.redis.status}`, health.services.redis.status === 'up' ? 'green' : 'red');

    // Readiness check
    const readyResponse = await axios.get(`${BASE_URL}/health/ready`);
    log(`✅ Readiness check: ${readyResponse.data.ready ? 'READY' : 'NOT READY'}`, 
        readyResponse.data.ready ? 'green' : 'red');

    // Liveness check
    const liveResponse = await axios.get(`${BASE_URL}/health/live`);
    log(`✅ Liveness check: ${liveResponse.data.alive ? 'ALIVE' : 'NOT ALIVE'}`, 
        liveResponse.data.alive ? 'green' : 'red');

  } catch (error) {
    log('❌ Erro no teste de health checks: ' + error.message, 'red');
  }
}

// Testar frontend do monitoramento
async function testFrontendMonitoring(token) {
  logSection('🖥️  TESTANDO FRONTEND DE MONITORAMENTO');
  
  if (!token) {
    log('❌ Token necessário para testar frontend', 'red');
    return;
  }

  try {
    // Testar API route do dashboard
    const response = await axios.get(`${FRONTEND_URL}/api/metrics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ API route do dashboard funcionando', 'green');
    log(`   - Status: ${response.status}`, 'blue');
    log(`   - Dados recebidos: ${Object.keys(response.data).join(', ')}`, 'blue');

  } catch (error) {
    log('❌ Erro no teste do frontend: ' + error.message, 'red');
    if (error.code === 'ECONNREFUSED') {
      log('   Verifique se o frontend está rodando na porta 3000', 'yellow');
    }
  }
}

// Simular carga para testar métricas
async function simulateLoad(token) {
  logSection('🚀 SIMULANDO CARGA PARA TESTAR MÉTRICAS');
  
  log('Fazendo 50 requisições simultâneas...', 'yellow');
  
  const requests = [];
  for (let i = 0; i < 50; i++) {
    requests.push(
      axios.get(`${BASE_URL}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      }).catch(() => {}) // Ignorar erros individuais
    );
  }
  
  const startTime = Date.now();
  await Promise.all(requests);
  const endTime = Date.now();
  
  log(`✅ 50 requisições completadas em ${endTime - startTime}ms`, 'green');
  log('Aguardando 2 segundos para métricas serem processadas...', 'yellow');
  await sleep(2000);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log('🔧 SISTEMA DE MONITORAMENTO E LOGS - TESTE COMPLETO', 'bold');
  log(`Testando: ${testType}`, 'blue');
  
  // Login
  const token = await login();
  
  if (testType === 'all' || testType === 'logs') {
    await testLoggingSystem(token);
  }
  
  if (testType === 'all' || testType === 'health') {
    await testHealthSystem();
  }
  
  if (testType === 'all' || testType === 'metrics') {
    await testMetricsSystem(token);
  }
  
  if (testType === 'all' || testType === 'frontend') {
    await testFrontendMonitoring(token);
  }
  
  if (testType === 'all' || testType === 'load') {
    await simulateLoad(token);
    // Testar métricas após carga
    if (token) {
      await testMetricsSystem(token);
    }
  }

  logSection('📋 RESUMO DOS TESTES');
  log('✅ Testes de monitoramento concluídos!', 'green');
  log('', 'reset');
  log('Para acessar o dashboard de monitoramento:', 'blue');
  log(`   Frontend: ${FRONTEND_URL}/admin/monitoramento`, 'blue');
  log(`   API Métricas: ${BASE_URL}/metrics`, 'blue');
  log(`   Health Check: ${BASE_URL}/health`, 'blue');
  log('', 'reset');
  log('Comandos disponíveis:', 'yellow');
  log('   node test-monitoring-system.js all      # Todos os testes', 'yellow');
  log('   node test-monitoring-system.js logs     # Apenas logs', 'yellow');
  log('   node test-monitoring-system.js health   # Apenas health checks', 'yellow');
  log('   node test-monitoring-system.js metrics  # Apenas métricas', 'yellow');
  log('   node test-monitoring-system.js frontend # Apenas frontend', 'yellow');
  log('   node test-monitoring-system.js load     # Simular carga', 'yellow');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log('❌ Erro fatal: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = { main };