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

// Testar informações do banco
async function testDatabaseInfo(token) {
  logSection('🔍 TESTANDO INFORMAÇÕES DO BANCO');
  
  if (!token) {
    log('❌ Token necessário para testar banco', 'red');
    return;
  }

  try {
    // Testar informações básicas
    const infoResponse = await axios.get(`${BASE_URL}/database/info`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Informações do banco obtidas:', 'green');
    const info = infoResponse.data;
    log(`   - Versão: ${info.version.split(' ')[0]}`, 'blue');
    log(`   - Host: ${info.host}:${info.port}`, 'blue');
    log(`   - Banco: ${info.database}`, 'blue');
    log(`   - Usuário: ${info.user}`, 'blue');
    log(`   - SSL: ${info.ssl ? 'Habilitado' : 'Desabilitado'}`, 'blue');
    log(`   - Conexões: ${info.activeConnections}/${info.maxConnections}`, 'blue');

    // Testar estatísticas
    const statsResponse = await axios.get(`${BASE_URL}/database/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Estatísticas do banco obtidas:', 'green');
    const stats = statsResponse.data;
    log(`   - Tamanho: ${stats.databaseSize}`, 'blue');
    log(`   - Tabelas: ${stats.totalTables}`, 'blue');
    log(`   - Registros: ${stats.totalRecords.toLocaleString()}`, 'blue');
    log(`   - Maiores tabelas: ${stats.tableStats.slice(0, 3).map(t => t.tableName).join(', ')}`, 'blue');

  } catch (error) {
    log('❌ Erro ao testar informações do banco: ' + error.message, 'red');
    if (error.response?.status === 403) {
      log('   Verifique se o usuário tem permissão de admin', 'yellow');
    }
  }
}

// Testar saúde do banco
async function testDatabaseHealth(token) {
  logSection('🏥 TESTANDO SAÚDE DO BANCO');
  
  if (!token) {
    log('❌ Token necessário para testar saúde', 'red');
    return;
  }

  try {
    // Health check básico
    const healthResponse = await axios.get(`${BASE_URL}/database/health`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Health check básico:', 'green');
    const health = healthResponse.data;
    log(`   - Status: ${health.isHealthy ? 'Saudável' : 'Não Saudável'}`, 
        health.isHealthy ? 'green' : 'red');
    log(`   - Tempo de resposta: ${health.responseTime}ms`, 'blue');
    if (health.error) {
      log(`   - Erro: ${health.error}`, 'red');
    }

    // Métricas de saúde
    const metricsResponse = await axios.get(`${BASE_URL}/database/health/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Métricas de saúde obtidas:', 'green');
    const metrics = metricsResponse.data;
    log(`   - Status: ${metrics.isHealthy ? 'Saudável' : 'Não Saudável'}`, 
        metrics.isHealthy ? 'green' : 'red');
    log(`   - Uso de conexões: ${metrics.connections.usage.toFixed(1)}%`, 'blue');
    log(`   - Queries lentas: ${metrics.performance.slowQueries}`, 'blue');
    log(`   - Alertas: ${metrics.alerts.length}`, metrics.alerts.length > 0 ? 'yellow' : 'green');

    // Mostrar alertas se houver
    if (metrics.alerts.length > 0) {
      log('⚠️  Alertas ativos:', 'yellow');
      metrics.alerts.forEach(alert => {
        log(`   - ${alert.type}: ${alert.message}`, 'yellow');
      });
    }

    // Resumo de saúde
    const summaryResponse = await axios.get(`${BASE_URL}/database/health/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Resumo de saúde:', 'green');
    const summary = summaryResponse.data;
    log(`   - Status geral: ${summary.status}`, 
        summary.status === 'healthy' ? 'green' : 
        summary.status === 'degraded' ? 'yellow' : 'red');
    log(`   - Uptime: ${formatUptime(summary.uptime)}`, 'blue');
    log(`   - Alertas críticos: ${summary.criticalAlerts}`, 
        summary.criticalAlerts > 0 ? 'red' : 'green');

  } catch (error) {
    log('❌ Erro ao testar saúde do banco: ' + error.message, 'red');
  }
}

// Testar operações do banco
async function testDatabaseOperations(token) {
  logSection('🔧 TESTANDO OPERAÇÕES DO BANCO');
  
  if (!token) {
    log('❌ Token necessário para testar operações', 'red');
    return;
  }

  try {
    // Testar queries lentas
    const slowQueriesResponse = await axios.get(`${BASE_URL}/database/slow-queries?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Queries lentas obtidas:', 'green');
    const slowQueries = slowQueriesResponse.data;
    if (slowQueries.length > 0) {
      log(`   - ${slowQueries.length} queries lentas encontradas`, 'yellow');
      slowQueries.forEach((query, index) => {
        log(`   ${index + 1}. Tempo médio: ${query.avgTime.toFixed(2)}ms (${query.calls} execuções)`, 'blue');
      });
    } else {
      log('   - Nenhuma query lenta detectada', 'green');
    }

    // Testar backup
    log('📦 Testando criação de backup...', 'blue');
    const backupResponse = await axios.post(`${BASE_URL}/database/backup`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const backup = backupResponse.data;
    if (backup.success) {
      log(`✅ Backup criado: ${backup.filename}`, 'green');
      log(`   - Tamanho: ${formatBytes(backup.size)}`, 'blue');
    } else {
      log(`❌ Erro no backup: ${backup.error}`, 'red');
    }

    // Testar otimização (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      log('⚡ Testando otimização do banco...', 'blue');
      const optimizeResponse = await axios.post(`${BASE_URL}/database/optimize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const optimize = optimizeResponse.data;
      if (optimize.success) {
        log(`✅ Otimização concluída em ${optimize.duration}ms`, 'green');
        log(`   - Operações: ${optimize.operations.join(', ')}`, 'blue');
      } else {
        log(`❌ Erro na otimização: ${optimize.error}`, 'red');
      }
    }

  } catch (error) {
    log('❌ Erro ao testar operações: ' + error.message, 'red');
  }
}

// Testar dashboard do banco
async function testDatabaseDashboard(token) {
  logSection('📊 TESTANDO DASHBOARD DO BANCO');
  
  if (!token) {
    log('❌ Token necessário para testar dashboard', 'red');
    return;
  }

  try {
    // Testar dashboard completo
    const dashboardResponse = await axios.get(`${BASE_URL}/database/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ Dashboard do banco obtido:', 'green');
    const dashboard = dashboardResponse.data;
    log(`   - Timestamp: ${new Date(dashboard.timestamp).toLocaleString()}`, 'blue');
    log(`   - Status: ${dashboard.health.isHealthy ? 'Saudável' : 'Não Saudável'}`, 
        dashboard.health.isHealthy ? 'green' : 'red');
    log(`   - Conexões ativas: ${dashboard.info.activeConnections}`, 'blue');
    log(`   - Tamanho do banco: ${dashboard.stats.databaseSize}`, 'blue');
    log(`   - Status geral: ${dashboard.summary.status}`, 'blue');

    // Testar API route do frontend
    const frontendResponse = await axios.get(`${FRONTEND_URL}/api/database/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    log('✅ API route do frontend funcionando:', 'green');
    log(`   - Status: ${frontendResponse.status}`, 'blue');
    log(`   - Dados recebidos: ${Object.keys(frontendResponse.data).join(', ')}`, 'blue');

  } catch (error) {
    log('❌ Erro ao testar dashboard: ' + error.message, 'red');
    if (error.code === 'ECONNREFUSED') {
      log('   Verifique se o frontend está rodando na porta 3000', 'yellow');
    }
  }
}

// Testar configuração do PostgreSQL
async function testPostgreSQLSetup() {
  logSection('🐘 TESTANDO CONFIGURAÇÃO POSTGRESQL');
  
  try {
    // Verificar se o script de setup existe
    if (fs.existsSync('./scripts/setup-database.js')) {
      log('✅ Script de setup encontrado', 'green');
    } else {
      log('❌ Script de setup não encontrado', 'red');
    }

    // Verificar arquivos .env
    const backendEnv = './backend-nestjs/.env';
    if (fs.existsSync(backendEnv)) {
      log('✅ Arquivo .env do backend encontrado', 'green');
      
      // Verificar se tem DATABASE_URL
      const envContent = fs.readFileSync(backendEnv, 'utf8');
      if (envContent.includes('DATABASE_URL') && envContent.includes('postgresql://')) {
        log('✅ DATABASE_URL PostgreSQL configurada', 'green');
      } else {
        log('❌ DATABASE_URL PostgreSQL não configurada', 'red');
      }
    } else {
      log('❌ Arquivo .env do backend não encontrado', 'red');
    }

    // Verificar docker-compose
    if (fs.existsSync('./infra/docker-compose.yml')) {
      log('✅ Docker Compose encontrado', 'green');
      
      const dockerContent = fs.readFileSync('./infra/docker-compose.yml', 'utf8');
      if (dockerContent.includes('postgres:') && dockerContent.includes('redis:')) {
        log('✅ PostgreSQL e Redis configurados no Docker', 'green');
      } else {
        log('❌ PostgreSQL ou Redis não configurados no Docker', 'red');
      }
    } else {
      log('❌ Docker Compose não encontrado', 'red');
    }

  } catch (error) {
    log('❌ Erro ao verificar configuração: ' + error.message, 'red');
  }
}

// Funções utilitárias
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log('🐘 SISTEMA POSTGRESQL - TESTE COMPLETO', 'bold');
  log(`Testando: ${testType}`, 'blue');
  
  // Login
  const token = await login();
  
  if (testType === 'all' || testType === 'setup') {
    await testPostgreSQLSetup();
  }
  
  if (testType === 'all' || testType === 'info') {
    await testDatabaseInfo(token);
  }
  
  if (testType === 'all' || testType === 'health') {
    await testDatabaseHealth(token);
  }
  
  if (testType === 'all' || testType === 'operations') {
    await testDatabaseOperations(token);
  }
  
  if (testType === 'all' || testType === 'dashboard') {
    await testDatabaseDashboard(token);
  }

  logSection('📋 RESUMO DOS TESTES');
  log('✅ Testes do sistema PostgreSQL concluídos!', 'green');
  log('', 'reset');
  log('Para acessar o monitoramento do banco:', 'blue');
  log(`   Frontend: ${FRONTEND_URL}/admin/database`, 'blue');
  log(`   API Info: ${BASE_URL}/database/info`, 'blue');
  log(`   API Health: ${BASE_URL}/database/health`, 'blue');
  log(`   API Dashboard: ${BASE_URL}/database/dashboard`, 'blue');
  log('', 'reset');
  log('Para configurar o banco:', 'yellow');
  log('   node scripts/setup-database.js setup', 'yellow');
  log('   cd infra && docker-compose up -d postgres redis', 'yellow');
  log('', 'reset');
  log('Comandos de teste disponíveis:', 'yellow');
  log('   node test-database-system.js all        # Todos os testes', 'yellow');
  log('   node test-database-system.js setup      # Verificar configuração', 'yellow');
  log('   node test-database-system.js info       # Informações do banco', 'yellow');
  log('   node test-database-system.js health     # Saúde do banco', 'yellow');
  log('   node test-database-system.js operations # Operações (backup, otimização)', 'yellow');
  log('   node test-database-system.js dashboard  # Dashboard completo', 'yellow');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log('❌ Erro fatal: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = { main };